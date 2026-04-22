import { prisma } from "@/lib/db"

export interface WebhookPayload {
  evento: string
  timestamp: string
  dados: any
}

/**
 * Valida URL de webhook para prevenir SSRF
 */
export function validarURLWebhook(urlString: string): { valid: boolean; error?: string } {
  try {
    const url = new URL(urlString)
    
    // Apenas HTTPS em produção
    if (process.env.NODE_ENV === 'production' && url.protocol !== 'https:') {
      return { valid: false, error: 'Apenas URLs HTTPS são permitidas em produção' }
    }
    
    // Bloquear IPs privados e localhost
    const hostname = url.hostname.toLowerCase()
    const blockedPatterns = [
      /^localhost$/i,
      /^127\./,
      /^0\./,
      /^10\./,
      /^172\.(1[6-9]|2[0-9]|3[01])\./,
      /^192\.168\./,
      /^169\.254\./,
      /^::1$/,
      /^[fF][cCdD]/,
    ]
    
    if (blockedPatterns.some(pattern => pattern.test(hostname))) {
      return { valid: false, error: 'URLs com IPs privados/localhost não são permitidas' }
    }
    
    // Bloquear portas perigosas
    const dangerousPorts = [22, 23, 25, 135, 139, 445, 1433, 3306, 5432, 6379, 27017]
    const port = parseInt(url.port) || (url.protocol === 'https:' ? 443 : 80)
    if (dangerousPorts.includes(port)) {
      return { valid: false, error: 'Porta não permitida por motivos de segurança' }
    }
    
    return { valid: true }
  } catch {
    return { valid: false, error: 'URL inválida' }
  }
}

export type WebhookEvento =
  | "chamado.criado"
  | "chamado.atualizado"
  | "chamado.fechado"
  | "chamado.status_alterado"
  | "link.criado"
  | "link.atualizado"
  | "link.deletado"
  | "operadora.criada"
  | "operadora.atualizada"

/**
 * Dispara webhooks para um evento específico
 */
export async function dispararWebhook(
  evento: WebhookEvento,
  dados: any
): Promise<void> {
  try {
    // Buscar webhooks ativos que estão configurados para este evento
    const webhooks = await prisma.webhookConfig.findMany({
      where: {
        ativo: true,
      },
    })

    // Filtrar webhooks que têm este evento habilitado
    const webhooksParaEvento = webhooks.filter((webhook) => {
      try {
        const eventos = JSON.parse(webhook.eventos) as string[]
        return eventos.includes(evento)
      } catch {
        return false
      }
    })

    if (webhooksParaEvento.length === 0) {
      return // Nenhum webhook configurado para este evento
    }

    // Preparar payload
    const payload: WebhookPayload = {
      evento,
      timestamp: new Date().toISOString(),
      dados,
    }

    // Disparar cada webhook em paralelo
    const promises = webhooksParaEvento.map((webhook) =>
      enviarWebhook(webhook, payload)
    )

    await Promise.allSettled(promises)
  } catch (error) {
    console.error("Erro ao disparar webhooks:", error)
    // Não lançar erro para não interromper o fluxo principal
  }
}

/**
 * Envia uma requisição HTTP para o webhook
 */
async function enviarWebhook(
  webhook: any,
  payload: WebhookPayload
): Promise<void> {
  const startTime = Date.now()
  let statusCode: number | null = null
  let resposta: string | null = null
  let erro: string | null = null
  let sucesso = false

  try {
    // Parse dos headers customizados
    let headers: Record<string, string> = {
      "Content-Type": "application/json",
      "User-Agent": "NOC-Chamados-Webhook/1.0",
    }

    if (webhook.headers) {
      try {
        const customHeaders = JSON.parse(webhook.headers)
        headers = { ...headers, ...customHeaders }
      } catch {
        // Ignorar headers inválidos
      }
    }

    // Configurar requisição com timeout e retentativas
    const controller = new AbortController()
    const timeoutId = setTimeout(
      () => controller.abort(),
      webhook.timeout * 1000
    )

    let tentativa = 0
    let ultimoErro: Error | null = null

    while (tentativa < webhook.retentativas) {
      try {
        const response = await fetch(webhook.url, {
          method: webhook.metodo,
          headers,
          body: JSON.stringify(payload),
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        statusCode = response.status
        const responseText = await response.text()
        resposta = responseText.substring(0, 1000) // Limitar tamanho da resposta

        if (response.ok) {
          sucesso = true
          break // Sucesso, sair do loop
        } else {
          ultimoErro = new Error(
            `HTTP ${statusCode}: ${responseText.substring(0, 200)}`
          )
          tentativa++
          if (tentativa < webhook.retentativas) {
            // Aguardar antes de tentar novamente (backoff exponencial)
            await new Promise((resolve) =>
              setTimeout(resolve, 1000 * Math.pow(2, tentativa))
            )
          }
        }
      } catch (fetchError: any) {
        ultimoErro = fetchError
        tentativa++
        if (tentativa < webhook.retentativas) {
          // Aguardar antes de tentar novamente
          await new Promise((resolve) =>
            setTimeout(resolve, 1000 * Math.pow(2, tentativa))
          )
        }
      }
    }

    if (!sucesso && ultimoErro) {
      throw ultimoErro
    }
  } catch (error: any) {
    erro = error.message || String(error)
    sucesso = false

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/95ae5b67-bb2a-491d-b1c2-d7e6d2d50e7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/webhook.ts:222',message:'Erro geral no enviarWebhook',data:{webhookId:webhook.id,erro},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
    // #endregion
  } finally {
    const tempoResposta = Date.now() - startTime

    // #region agent log
    fetch('http://127.0.0.1:7242/ingest/95ae5b67-bb2a-491d-b1c2-d7e6d2d50e7d',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'lib/webhook.ts:230',message:'enviarWebhook finalizado',data:{webhookId:webhook.id,sucesso,statusCode,tempoResposta,erro},timestamp:Date.now(),sessionId:'debug-session',runId:'initial',hypothesisId:'D'})}).catch(()=>{});
    // #endregion

    // Salvar log do webhook
    try {
      await prisma.webhookLog.create({
        data: {
          webhookConfigId: webhook.id,
          evento: payload.evento,
          url: webhook.url,
          metodo: webhook.metodo,
          payload: JSON.stringify(payload),
          statusCode,
          resposta,
          erro,
          tempoResposta,
          sucesso,
        },
      })
    } catch (logError) {
      console.error("Erro ao salvar log de webhook:", logError)
    }
  }
}

/**
 * Formata dados do chamado para o webhook
 */
export function formatarChamadoParaWebhook(chamado: any) {
  return {
    id: chamado.id,
    numero: chamado.numero,
    status: chamado.status,
    impacto: chamado.impacto,
    tipoChamado: chamado.tipoChamado,
    dataDeteccao: chamado.dataDeteccao,
    dataAbertura: chamado.dataAbertura,
    dataNormalizacao: chamado.dataNormalizacao,
    dataFechamento: chamado.dataFechamento,
    protocoloOperadora: chamado.protocoloOperadora,
    descricaoProblema: chamado.descricaoProblema,
    link: chamado.link
      ? {
          id: chamado.link.id,
          designador: chamado.link.designador,
          operadora: chamado.link.operadora?.nome,
        }
      : null,
    transporte: chamado.transporte
      ? {
          id: chamado.transporte.id,
          nome: chamado.transporte.nome,
          operadora: chamado.transporte.operadora?.nome || null,
        }
      : null,
    abertoPor: {
      id: chamado.abertoPor.id,
      nome: chamado.abertoPor.nome,
    },
  }
}

/**
 * Lista de eventos disponíveis
 */
export const EVENTOS_DISPONIVEIS: Array<{
  valor: WebhookEvento
  label: string
  descricao: string
}> = [
  {
    valor: "chamado.criado",
    label: "Chamado Criado",
    descricao: "Disparado quando um novo chamado é aberto",
  },
  {
    valor: "chamado.atualizado",
    label: "Chamado Atualizado",
    descricao: "Disparado quando um chamado é atualizado",
  },
  {
    valor: "chamado.status_alterado",
    label: "Status do Chamado Alterado",
    descricao: "Disparado quando o status de um chamado é alterado",
  },
  {
    valor: "chamado.fechado",
    label: "Chamado Fechado",
    descricao: "Disparado quando um chamado é fechado",
  },
  {
    valor: "link.criado",
    label: "Link Criado",
    descricao: "Disparado quando um novo link é cadastrado",
  },
  {
    valor: "link.atualizado",
    label: "Link Atualizado",
    descricao: "Disparado quando um link é atualizado",
  },
  {
    valor: "link.deletado",
    label: "Link Deletado",
    descricao: "Disparado quando um link é removido",
  },
  {
    valor: "operadora.criada",
    label: "Operadora Criada",
    descricao: "Disparado quando uma nova operadora é cadastrada",
  },
  {
    valor: "operadora.atualizada",
    label: "Operadora Atualizada",
    descricao: "Disparado quando uma operadora é atualizada",
  },
]

