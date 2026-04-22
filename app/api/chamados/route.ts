import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import { chamadoSchema } from "@/lib/validations"
import { gerarNumeroChamado } from "@/lib/utils"
import { dispararWebhook, formatarChamadoParaWebhook } from "@/lib/webhook"
import { rateLimit } from "@/lib/security"

export async function GET(request: NextRequest) {
  // Rate limiting: 200 requisições por minuto
  const ip = request.ip ?? "unknown"
  const { allowed, remaining, reset } = rateLimit(ip, 200, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente mais tarde." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "200",
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(reset / 1000).toString(),
        },
      }
    )
  }

  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const status = searchParams.get("status")
  const impacto = searchParams.get("impacto")
  const operadoraId = searchParams.get("operadoraId")
  const popId = searchParams.get("popId")

  const where: any = {}

  if (status && status !== "todos") {
    where.status = status
  }
  if (impacto && impacto !== "todos") {
    where.impacto = impacto
  }
  if (operadoraId) {
    where.link = { operadoraId: parseInt(operadoraId) }
  }
  if (popId) {
    where.link = { ...where.link, popId: parseInt(popId) }
  }

  const chamados = await prisma.chamado.findMany({
    where,
    include: {
      link: {
        include: {
          operadora: true,
          pop: true,
        },
      },
      transporte: { include: { operadora: true } },
      tipoFalha: true,
      abertoPor: { select: { id: true, nome: true } },
      fechadoPor: { select: { id: true, nome: true } },
    },
    orderBy: { dataDeteccao: "desc" },
  })

  return NextResponse.json(chamados)
}

export async function POST(request: NextRequest) {
  // Rate limiting: 50 criações por minuto
  const ip = request.ip ?? "unknown"
  const { allowed, remaining, reset } = rateLimit(ip, 50, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente mais tarde." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "50",
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(reset / 1000).toString(),
        },
      }
    )
  }

  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const { tipoChamado, linkId, transporteId, tipoFalhaId, dataDeteccao, impacto, descricaoProblema, protocoloOperadora } = body

    // Validações básicas
    if (!tipoFalhaId || !dataDeteccao || !impacto || !descricaoProblema) {
      return NextResponse.json(
        { error: "Campos obrigatórios não preenchidos" },
        { status: 400 }
      )
    }

    if (tipoChamado === "link" && !linkId) {
      return NextResponse.json(
        { error: "Link é obrigatório para chamados de link" },
        { status: 400 }
      )
    }

    if (tipoChamado === "transporte" && !transporteId) {
      return NextResponse.json(
        { error: "Transporte é obrigatório para chamados de transporte" },
        { status: 400 }
      )
    }

    // Gera número único
    let numero = gerarNumeroChamado()
    let tentativas = 0
    while (await prisma.chamado.findUnique({ where: { numero } })) {
      numero = gerarNumeroChamado()
      tentativas++
      if (tentativas > 10) {
        return NextResponse.json(
          { error: "Erro ao gerar número do chamado" },
          { status: 500 }
        )
      }
    }

    const chamado = await prisma.chamado.create({
      data: {
        numero,
        tipoChamado: tipoChamado || "link",
        linkId: tipoChamado === "link" ? linkId : null,
        transporteId: tipoChamado === "transporte" ? transporteId : null,
        tipoFalhaId,
        dataDeteccao: new Date(dataDeteccao),
        impacto,
        descricaoProblema,
        protocoloOperadora: protocoloOperadora || null,
        abertoPorId: usuario.userId,
        dataContatoOperadora: protocoloOperadora ? new Date() : null,
      },
      include: {
        link: {
          include: {
            operadora: true,
            pop: true,
          },
        },
        transporte: { include: { operadora: true } },
        tipoFalha: true,
        abertoPor: { select: { id: true, nome: true } },
      },
    })

    // Cria histórico de abertura
    const descricaoHistorico = tipoChamado === "transporte" 
      ? "Chamado aberto para transporte" 
      : "Chamado aberto"

    await prisma.chamadoHistorico.create({
      data: {
        chamadoId: chamado.id,
        usuarioId: usuario.userId,
        tipoAcao: "abertura",
        descricao: descricaoHistorico,
        statusNovo: "aberto",
      },
    })

    // Disparar webhook
    dispararWebhook("chamado.criado", formatarChamadoParaWebhook(chamado)).catch(
      (error) => console.error("Erro ao disparar webhook:", error)
    )

    return NextResponse.json(chamado, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar chamado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

