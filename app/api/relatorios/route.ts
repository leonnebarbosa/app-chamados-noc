import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const tipo = searchParams.get("tipo") || "resumo"
  const dataInicio = searchParams.get("dataInicio")
  const dataFim = searchParams.get("dataFim")

  // Filtro de data (usa dataDeteccao)
  const whereData: any = {}
  if (dataInicio) {
    whereData.dataDeteccao = { gte: new Date(dataInicio) }
  }
  if (dataFim) {
    whereData.dataDeteccao = { 
      ...whereData.dataDeteccao,
      lte: new Date(dataFim + "T23:59:59") 
    }
  }

  try {
    switch (tipo) {
      case "resumo":
        return NextResponse.json(await getResumoGeral(whereData))
      case "kpis":
        return NextResponse.json(await getKPIsCompletos(whereData, dataInicio, dataFim))
      case "operadoras":
        return NextResponse.json(await getPerformanceOperadoras(whereData))
      case "pops":
        return NextResponse.json(await getIncidentesPorPop(whereData))
      case "mensal":
        return NextResponse.json(await getTendenciaMensal())
      case "tiposFalha":
        return NextResponse.json(await getIncidentesPorTipoFalha(whereData))
      case "linksProblematicos":
        return NextResponse.json(await getLinksProblematicos(whereData))
      case "relatorioLink":
        const linkId = searchParams.get("linkId")
        if (!linkId) {
          return NextResponse.json({ error: "linkId é obrigatório" }, { status: 400 })
        }
        return NextResponse.json(await getRelatorioLink(parseInt(linkId), whereData))
      case "relatorioTransporte":
        const transporteId = searchParams.get("transporteId")
        if (!transporteId) {
          return NextResponse.json({ error: "transporteId é obrigatório" }, { status: 400 })
        }
        return NextResponse.json(await getRelatorioTransporte(parseInt(transporteId), whereData))
      default:
        return NextResponse.json({ error: "Tipo de relatório inválido" }, { status: 400 })
    }
  } catch (error) {
    console.error("Erro ao gerar relatório:", error)
    return NextResponse.json({ error: "Erro ao gerar relatório" }, { status: 500 })
  }
}

async function getResumoGeral(whereData: any) {
  const [
    totalChamados,
    chamadosAbertos,
    chamadosFechados,
    chamadosPorImpacto,
    tempoMedioResolucao,
  ] = await Promise.all([
    prisma.chamado.count({ where: whereData }),
    prisma.chamado.count({ where: { ...whereData, status: { not: "fechado" } } }),
    prisma.chamado.count({ where: { ...whereData, status: "fechado" } }),
    prisma.chamado.groupBy({
      by: ["impacto"],
      where: whereData,
      _count: true,
    }),
    prisma.chamado.findMany({
      where: { ...whereData, status: "fechado" },
      select: { dataDeteccao: true, dataNormalizacao: true, dataResolucao: true, dataFechamento: true },
    }),
  ])

  // Calcular MTTR (Mean Time To Repair) em horas
  // Usa dataNormalizacao se disponível, senão dataResolucao, senão dataFechamento
  let mttrHoras = 0
  const chamadosComTempo = tempoMedioResolucao.filter(c => c.dataNormalizacao || c.dataResolucao || c.dataFechamento)
  if (chamadosComTempo.length > 0) {
    const totalHoras = chamadosComTempo.reduce((acc, chamado) => {
      const dataFim = chamado.dataNormalizacao || chamado.dataResolucao || chamado.dataFechamento
      if (dataFim) {
        const diff = dataFim.getTime() - chamado.dataDeteccao.getTime()
        return acc + (diff / (1000 * 60 * 60))
      }
      return acc
    }, 0)
    mttrHoras = totalHoras / chamadosComTempo.length
  }

  // Formatar dados de impacto para gráfico
  const impactoData = [
    { name: "Crítico", value: 0, color: "#ef4444" },
    { name: "Alto", value: 0, color: "#f97316" },
    { name: "Médio", value: 0, color: "#eab308" },
    { name: "Baixo", value: 0, color: "#22c55e" },
  ]

  chamadosPorImpacto.forEach((item) => {
    const map: Record<string, number> = { 
      critico: 0, 
      alto: 1, 
      medio: 2, 
      baixo: 3 
    }
    const idx = map[item.impacto]
    if (idx !== undefined) {
      impactoData[idx].value = item._count
    }
  })

  return {
    totalChamados,
    chamadosAbertos,
    chamadosFechados,
    mttrHoras: Math.round(mttrHoras * 10) / 10,
    taxaResolucao: totalChamados > 0 ? Math.round((chamadosFechados / totalChamados) * 100) : 0,
    impactoData,
  }
}

async function getPerformanceOperadoras(whereData: any) {
  const chamados = await prisma.chamado.findMany({
    where: { ...whereData, OR: [{ link: { isNot: null } }, { transporte: { isNot: null } }] },
    select: {
      status: true,
      impacto: true,
      dataDeteccao: true,
      dataNormalizacao: true,
      dataResolucao: true,
      dataFechamento: true,
      link: {
        include: { operadora: true },
      },
      transporte: {
        select: { fornecedor: true },
      },
    },
  })

  // Agrupar por operadora
  const operadorasMap = new Map<string, {
    nome: string
    total: number
    fechados: number
    tempoTotal: number
    criticos: number
  }>()

  chamados.forEach((chamado) => {
    const operadoraNome = chamado.link?.operadora?.nome || chamado.transporte?.fornecedor || "Sem Operadora"

    if (!operadorasMap.has(operadoraNome)) {
      operadorasMap.set(operadoraNome, {
        nome: operadoraNome,
        total: 0,
        fechados: 0,
        tempoTotal: 0,
        criticos: 0,
      })
    }

    const op = operadorasMap.get(operadoraNome)!
    op.total++

    if (chamado.impacto === "critico") op.criticos++

    if (chamado.status === "fechado") {
      op.fechados++
      const dataFim = chamado.dataNormalizacao || chamado.dataResolucao || chamado.dataFechamento
      if (dataFim) {
        const diff = dataFim.getTime() - chamado.dataDeteccao.getTime()
        op.tempoTotal += diff / (1000 * 60 * 60) // em horas
      }
    }
  })

  const resultado = Array.from(operadorasMap.values()).map((op) => ({
    nome: op.nome,
    total: op.total,
    fechados: op.fechados,
    abertos: op.total - op.fechados,
    criticos: op.criticos,
    mttr: op.fechados > 0 ? Math.round((op.tempoTotal / op.fechados) * 10) / 10 : 0,
    taxaResolucao: op.total > 0 ? Math.round((op.fechados / op.total) * 100) : 0,
  }))

  return resultado.sort((a, b) => b.total - a.total)
}

async function getIncidentesPorPop(whereData: any) {
  const chamados = await prisma.chamado.findMany({
    where: { ...whereData, OR: [{ link: { isNot: null } }, { transporte: { isNot: null } }] },
    include: {
      link: {
        include: { pop: true },
      },
      transporte: true,
    },
  })

  // Agrupar por POP (links) ou origem/destino (transportes)
  const popsMap = new Map<string, {
    nome: string
    cidade: string
    estado: string
    total: number
    criticos: number
  }>()

  chamados.forEach((chamado) => {
    const pop = chamado.link?.pop

    if (pop) {
      const key = pop.codigo

      if (!popsMap.has(key)) {
        popsMap.set(key, {
          nome: pop.nome,
          cidade: pop.cidade,
          estado: pop.estado,
          total: 0,
          criticos: 0,
        })
      }

      const p = popsMap.get(key)!
      p.total++
      if (chamado.impacto === "critico") p.criticos++
    } else if (chamado.transporte) {
      const key = `transporte-${chamado.transporte.origem}-${chamado.transporte.destino}`

      if (!popsMap.has(key)) {
        popsMap.set(key, {
          nome: `${chamado.transporte.nome}`,
          cidade: `${chamado.transporte.origem} ↔ ${chamado.transporte.destino}`,
          estado: "",
          total: 0,
          criticos: 0,
        })
      }

      const p = popsMap.get(key)!
      p.total++
      if (chamado.impacto === "critico") p.criticos++
    }
  })

  return Array.from(popsMap.values()).sort((a, b) => b.total - a.total)
}

async function getTendenciaMensal() {
  // Últimos 12 meses
  const hoje = new Date()
  const inicio = new Date(hoje.getFullYear(), hoje.getMonth() - 11, 1)

  const chamados = await prisma.chamado.findMany({
    where: {
      dataDeteccao: { gte: inicio },
    },
    select: {
      dataDeteccao: true,
      status: true,
      impacto: true,
    },
  })

  // Agrupar por mês
  const mesesMap = new Map<string, { mes: string, abertos: number, fechados: number, criticos: number }>()

  // Inicializar todos os meses
  for (let i = 0; i < 12; i++) {
    const data = new Date(hoje.getFullYear(), hoje.getMonth() - 11 + i, 1)
    const key = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`
    const mesNome = data.toLocaleDateString("pt-BR", { month: "short", year: "2-digit" })
    mesesMap.set(key, { mes: mesNome, abertos: 0, fechados: 0, criticos: 0 })
  }

  chamados.forEach((chamado) => {
    const data = chamado.dataDeteccao
    const key = `${data.getFullYear()}-${String(data.getMonth() + 1).padStart(2, "0")}`
    
    if (mesesMap.has(key)) {
      const m = mesesMap.get(key)!
      m.abertos++
      if (chamado.status === "fechado") m.fechados++
      if (chamado.impacto === "critico") m.criticos++
    }
  })

  return Array.from(mesesMap.values())
}

async function getIncidentesPorTipoFalha(whereData: any) {
  const resultado = await prisma.chamado.groupBy({
    by: ["tipoFalhaId"],
    where: whereData,
    _count: true,
  })

  const tiposFalha = await prisma.tipoFalha.findMany()
  const tiposMap = new Map(tiposFalha.map((t) => [t.id, t.nome]))

  return resultado
    .map((item) => ({
      nome: tiposMap.get(item.tipoFalhaId!) || "Não especificado",
      total: item._count,
    }))
    .sort((a, b) => b.total - a.total)
}

// KPIs completos para dashboard avançado
async function getKPIsCompletos(whereData: any, dataInicio?: string | null, dataFim?: string | null) {
  const [
    chamadosFechados,
    periodosImpacto,
  ] = await Promise.all([
    // Chamados fechados para MTTR
    prisma.chamado.findMany({
      where: { ...whereData, status: "fechado" },
      select: {
        dataDeteccao: true,
        dataNormalizacao: true,
        dataResolucao: true,
        dataFechamento: true,
      },
    }),
    // Períodos de impacto para MTTI e total de horas
    // Buscar períodos que OCORRERAM no período selecionado (não apenas de chamados detectados no período)
    prisma.periodoImpacto.findMany({
      where: dataInicio || dataFim ? {
        // Se há filtro de data, buscar períodos que iniciaram no período
        inicio: {
          ...(dataInicio && { gte: new Date(dataInicio) }),
          ...(dataFim && { lte: new Date(dataFim + "T23:59:59") }),
        },
      } : {},
      select: { inicio: true, fim: true, chamadoId: true },
    }),
  ])

  // MTTR - Mean Time To Repair (em horas)
  let mttrHoras = 0
  const chamadosComResolucao = chamadosFechados.filter(c => c.dataNormalizacao || c.dataResolucao || c.dataFechamento)
  if (chamadosComResolucao.length > 0) {
    const totalHoras = chamadosComResolucao.reduce((acc, c) => {
      const dataFim = c.dataNormalizacao || c.dataResolucao || c.dataFechamento
      if (dataFim) {
        return acc + (dataFim.getTime() - c.dataDeteccao.getTime()) / (1000 * 60 * 60)
      }
      return acc
    }, 0)
    mttrHoras = totalHoras / chamadosComResolucao.length
  }

  // Tempo Total de Impacto (soma dos períodos de impacto reais)
  let tempoTotalImpacto = 0
  const periodosValidos = periodosImpacto.filter(p => p.fim)
  if (periodosValidos.length > 0) {
    tempoTotalImpacto = periodosValidos.reduce((acc, p) => {
      return acc + (p.fim!.getTime() - p.inicio.getTime()) / (1000 * 60 * 60)
    }, 0)
  }

  // Total de horas de incidente (períodos únicos baseados nos chamados completos)
  // Se dois chamados estão ocorrendo ao mesmo tempo, conta apenas uma vez esse período
  // Conta desde a detecção até a normalização/fechamento (período completo do incidente)
  let totalHorasIncidente = 0
  let periodosUnidosCount = 0
  
  // Buscar chamados fechados (com normalização OU fechamento)
  const chamadosParaIncidente = await prisma.chamado.findMany({
    where: {
      ...whereData,
      status: "fechado",
    },
    select: {
      dataDeteccao: true,
      dataNormalizacao: true,
      dataResolucao: true,
      dataFechamento: true,
    },
  })

  if (chamadosParaIncidente.length > 0) {
    // Criar períodos de incidente (detecção -> normalização/resolução/fechamento)
    const periodosIncidente = chamadosParaIncidente
      .filter(c => c.dataNormalizacao || c.dataResolucao || c.dataFechamento)
      .map(c => ({
        inicio: c.dataDeteccao,
        fim: (c.dataNormalizacao || c.dataResolucao || c.dataFechamento)!
      }))
      .sort((a, b) => a.inicio.getTime() - b.inicio.getTime())
    
    // Unir períodos sobrepostos
    const periodosUnidos: { inicio: Date, fim: Date }[] = []
    
    for (const periodo of periodosIncidente) {
      if (periodosUnidos.length === 0) {
        periodosUnidos.push({ inicio: periodo.inicio, fim: periodo.fim })
      } else {
        const ultimo = periodosUnidos[periodosUnidos.length - 1]
        // Se o período atual se sobrepõe ou está adjacente ao último
        if (periodo.inicio.getTime() <= ultimo.fim.getTime()) {
          // Estender o fim se necessário
          if (periodo.fim.getTime() > ultimo.fim.getTime()) {
            ultimo.fim = periodo.fim
          }
        } else {
          // Novo período não sobreposto
          periodosUnidos.push({ inicio: periodo.inicio, fim: periodo.fim })
        }
      }
    }
    
    // Calcular total de horas dos períodos unidos
    totalHorasIncidente = periodosUnidos.reduce((acc, p) => {
      return acc + (p.fim.getTime() - p.inicio.getTime()) / (1000 * 60 * 60)
    }, 0)
    
    periodosUnidosCount = periodosUnidos.length
  }

  // Disponibilidade baseada em links com problemas (similar ao dashboard)
  // Buscar links IP ativos
  const linksAtivos = await prisma.link.findMany({
    where: {
      ativo: true,
      OR: [
        { tipoServico: { contains: 'link', mode: 'insensitive' } },
        { tipoServico: { contains: 'ip', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      transporteId: true,
    },
  })

  // Buscar links com chamados em aberto no período
  const chamadosLinksAbertos = await prisma.chamado.findMany({
    where: {
      ...whereData,
      status: { not: 'fechado' },
      linkId: { not: null },
    },
    select: { linkId: true },
  })

  // Buscar transportes com chamados em aberto no período
  const chamadosTransportesAbertos = await prisma.chamado.findMany({
    where: {
      ...whereData,
      status: { not: 'fechado' },
      transporteId: { not: null },
    },
    select: { transporteId: true },
  })

  const linksComProblema = new Set(chamadosLinksAbertos.map(c => c.linkId))
  const transportesComProblema = new Set(chamadosTransportesAbertos.map(c => c.transporteId))

  // Contar links afetados
  let linksAfetados = 0
  linksAtivos.forEach(link => {
    const temChamadoDireto = linksComProblema.has(link.id)
    const transporteAfetado = link.transporteId && transportesComProblema.has(link.transporteId)
    if (temChamadoDireto || transporteAfetado) {
      linksAfetados++
    }
  })

  // Calcular disponibilidade: (links totais - links afetados) / links totais * 100
  const totalLinksIP = linksAtivos.length
  const disponibilidade = totalLinksIP > 0
    ? Math.round(((totalLinksIP - linksAfetados) / totalLinksIP) * 100 * 100) / 100
    : 100

  return {
    mttr: {
      valor: Math.round(mttrHoras * 10) / 10,
      unidade: "horas",
      label: "MTTR",
      descricao: "Tempo médio de reparo",
      amostra: chamadosComResolucao.length,
    },
    mtti: {
      valor: Math.round(tempoTotalImpacto * 10) / 10,
      unidade: "horas",
      label: "Tempo Total de Impacto",
      descricao: "Tempo total de impacto real nos clientes",
      amostra: periodosValidos.length,
    },
    totalHorasIncidente: {
      valor: Math.round(totalHorasIncidente * 10) / 10,
      unidade: "horas",
      label: "Total Horas Incidente",
      descricao: "Tempo total com incidentes (detecção→normalização)",
      amostra: `${periodosUnidosCount} únicos de ${chamadosParaIncidente.length} totais`,
    },
    disponibilidade: {
      valor: disponibilidade,
      unidade: "%",
      label: "Disponibilidade",
      descricao: "Disponibilidade geral dos links",
      amostra: totalLinksIP,
    },
  }
}

// Links e transportes mais problemáticos
async function getLinksProblematicos(whereData: any) {
  const chamados = await prisma.chamado.findMany({
    where: { ...whereData, OR: [{ linkId: { not: null } }, { transporteId: { not: null } }] },
    select: {
      linkId: true,
      transporteId: true,
      dataDeteccao: true,
      dataNormalizacao: true,
      dataResolucao: true,
      dataFechamento: true,
      impacto: true,
      status: true,
      link: {
        select: {
          id: true,
          designador: true,
          capacidade: true,
          operadora: { select: { nome: true } },
          pop: { select: { cidade: true } },
        },
      },
      transporte: {
        select: {
          id: true,
          nome: true,
          fornecedor: true,
          capacidade: true,
          origem: true,
          destino: true,
        },
      },
    },
  })

  // Agrupar por link ou transporte
  const itensMap = new Map<string, {
    id: number
    designador: string
    operadora: string
    pop: string
    capacidade: string | null
    totalChamados: number
    chamadosCriticos: number
    tempoIndisponivel: number // em horas
    chamadosAbertos: number
  }>()

  chamados.forEach((c) => {
    let key: string
    let item: { id: number; designador: string; operadora: string; pop: string; capacidade: string | null }

    if (c.link) {
      key = `link-${c.link.id}`
      item = {
        id: c.link.id,
        designador: c.link.designador,
        operadora: c.link.operadora?.nome || "Sem operadora",
        pop: c.link.pop?.cidade || "Sem POP",
        capacidade: c.link.capacidade,
      }
    } else if (c.transporte) {
      key = `transporte-${c.transporte.id}`
      item = {
        id: c.transporte.id,
        designador: `${c.transporte.nome} (${c.transporte.fornecedor})`,
        operadora: c.transporte.fornecedor,
        pop: `${c.transporte.origem} ↔ ${c.transporte.destino}`,
        capacidade: c.transporte.capacidade,
      }
    } else {
      return
    }

    if (!itensMap.has(key)) {
      itensMap.set(key, {
        ...item,
        totalChamados: 0,
        chamadosCriticos: 0,
        tempoIndisponivel: 0,
        chamadosAbertos: 0,
      })
    }

    const entry = itensMap.get(key)!
    entry.totalChamados++

    if (c.impacto === "critico") entry.chamadosCriticos++
    if (c.status !== "fechado") entry.chamadosAbertos++

    // Calcular tempo de indisponibilidade
    const dataFim = c.dataNormalizacao || c.dataResolucao || c.dataFechamento || new Date()
    entry.tempoIndisponivel += (dataFim.getTime() - c.dataDeteccao.getTime()) / (1000 * 60 * 60)
  })

  // Ordenar por total de chamados (mais problemáticos primeiro)
  return Array.from(itensMap.values())
    .map(entry => ({
      ...entry,
      tempoIndisponivel: Math.round(entry.tempoIndisponivel * 10) / 10,
    }))
    .sort((a, b) => b.totalChamados - a.totalChamados)
    .slice(0, 15) // Top 15
}

// Relatório detalhado de um link específico (para enviar à operadora)
async function getRelatorioLink(linkId: number, whereData: any) {
  // Buscar informações do link
  const link = await prisma.link.findUnique({
    where: { id: linkId },
    include: {
      operadora: true,
      pop: true,
      transporte: true,
    },
  })

  if (!link) {
    throw new Error("Link não encontrado")
  }

  // Usar o período passado pelo frontend
  // Se o link tem diaVencimento, ajustar para o ciclo de faturamento dentro do mês selecionado
  let periodoInicio: Date | undefined
  let periodoFim: Date | undefined
  
  if (whereData.dataDeteccao?.gte && whereData.dataDeteccao?.lte) {
    // Período selecionado pelo usuário (mês de referência)
    const dataInicioSelecionada = new Date(whereData.dataDeteccao.gte)
    const dataFimSelecionada = new Date(whereData.dataDeteccao.lte)
    
    if (link.diaVencimento) {
      // Ajustar para o ciclo de faturamento baseado no mês selecionado
      const diaVenc = link.diaVencimento
      const mesSelecionado = dataInicioSelecionada.getMonth()
      const anoSelecionado = dataInicioSelecionada.getFullYear()
      
      // Início: dia de vencimento do mês anterior ao selecionado
      periodoInicio = new Date(anoSelecionado, mesSelecionado - 1, diaVenc)
      // Fim: dia de vencimento do mês selecionado
      periodoFim = new Date(anoSelecionado, mesSelecionado, diaVenc)
      
      // Atualizar whereData com o período do ciclo de faturamento
      whereData = {
        dataDeteccao: {
          gte: periodoInicio,
          lte: periodoFim,
        }
      }
    } else {
      // Sem dia de vencimento, usar período selecionado
      periodoInicio = dataInicioSelecionada
      periodoFim = dataFimSelecionada
    }
  }

  // Buscar chamados do link no período
  const chamados = await prisma.chamado.findMany({
    where: {
      ...whereData,
      linkId: linkId,
    },
    include: {
      tipoFalha: true,
      abertoPor: { select: { nome: true } },
      periodosImpacto: true,
    },
    orderBy: { dataDeteccao: "asc" },
  })

  // Calcular métricas
  let tempoTotalIndisponivel = 0 // em milissegundos
  let tempoTotalImpacto = 0

  const chamadosFormatados = chamados.map((c) => {
    const dataFim = c.dataNormalizacao || c.dataResolucao || c.dataFechamento
    const duracaoMs = dataFim
      ? dataFim.getTime() - c.dataDeteccao.getTime()
      : Date.now() - c.dataDeteccao.getTime()

    tempoTotalIndisponivel += duracaoMs

    // Somar períodos de impacto
    const impactoMs = c.periodosImpacto.reduce((acc, p) => {
      if (p.fim) {
        return acc + (p.fim.getTime() - p.inicio.getTime())
      }
      return acc
    }, 0)
    tempoTotalImpacto += impactoMs

    return {
      numero: c.numero,
      dataDeteccao: c.dataDeteccao,
      dataNormalizacao: c.dataNormalizacao,
      dataFechamento: c.dataFechamento,
      duracaoHoras: Math.round((duracaoMs / (1000 * 60 * 60)) * 100) / 100,
      duracaoFormatada: formatarDuracao(duracaoMs),
      tipoFalha: c.tipoFalha?.nome || "Não especificado",
      impacto: c.impacto,
      protocoloOperadora: c.protocoloOperadora,
      descricaoProblema: c.descricaoProblema,
      status: c.status,
      periodosImpacto: c.periodosImpacto.map(p => ({
        inicio: p.inicio,
        fim: p.fim,
        duracaoFormatada: p.fim ? formatarDuracao(p.fim.getTime() - p.inicio.getTime()) : "Em andamento",
      })),
    }
  })

  // Calcular período do relatório (usa o período calculado pelo dia de vencimento se disponível)
  const dataInicio = periodoInicio || whereData.dataDeteccao?.gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const dataFim = periodoFim || whereData.dataDeteccao?.lte || new Date()
  const periodoTotalMs = dataFim.getTime() - dataInicio.getTime()
  const periodoTotalHoras = periodoTotalMs / (1000 * 60 * 60)

  // Calcular disponibilidade
  const tempoIndisponivelHoras = tempoTotalIndisponivel / (1000 * 60 * 60)
  const disponibilidade = periodoTotalHoras > 0
    ? Math.max(0, ((periodoTotalHoras - tempoIndisponivelHoras) / periodoTotalHoras) * 100)
    : 100

  // SLA de disponibilidade contratado (em percentual)
  // Nota: o campo slaHoras da operadora representa tempo de resposta/resolução,
  // não percentual de disponibilidade. Para disponibilidade, usamos valores padrão.
  // TODO: Adicionar campo slaDisponibilidade no modelo Operadora
  const slaContratado = 99.5 // SLA padrão de 99.5% de disponibilidade

  const descumprimentoSla = Math.max(0, slaContratado - disponibilidade)

  return {
    link: {
      id: link.id,
      designador: link.designador,
      tipoServico: link.tipoServico,
      capacidade: link.capacidade,
      diaVencimento: link.diaVencimento,
      operadora: link.operadora?.nome || "Não definida",
      operadoraTelefone: link.operadora?.telefoneSuporte,
      operadoraEmail: link.operadora?.emailSuporte,
      pop: link.pop?.nome || "Não definido",
      popCidade: link.pop?.cidade,
      popEstado: link.pop?.estado,
    },
    periodo: {
      inicio: dataInicio,
      fim: dataFim,
      totalHoras: Math.round(periodoTotalHoras * 10) / 10,
      totalDias: Math.round((periodoTotalHoras / 24) * 10) / 10,
    },
    metricas: {
      totalIncidentes: chamados.length,
      incidentesCriticos: chamados.filter(c => c.impacto === "critico").length,
      incidentesAbertos: chamados.filter(c => c.status !== "fechado").length,
      tempoTotalIndisponivel: formatarDuracao(tempoTotalIndisponivel),
      tempoTotalIndisponivelHoras: Math.round(tempoIndisponivelHoras * 100) / 100,
      tempoTotalImpacto: formatarDuracao(tempoTotalImpacto),
      tempoTotalImpactoHoras: Math.round((tempoTotalImpacto / (1000 * 60 * 60)) * 100) / 100,
      disponibilidade: Math.round(disponibilidade * 100) / 100,
      slaContratado: Math.round(slaContratado * 100) / 100,
      descumprimentoSla: Math.round(descumprimentoSla * 100) / 100,
      cumpreSla: disponibilidade >= slaContratado,
    },
    chamados: chamadosFormatados,
    geradoEm: new Date(),
  }
}

// Relatório detalhado de um transporte específico (para enviar à operadora)
async function getRelatorioTransporte(transporteId: number, whereData: any) {
  // Buscar informações do transporte
  const transporte = await prisma.transporte.findUnique({
    where: { id: transporteId },
  })

  if (!transporte) {
    throw new Error("Transporte não encontrado")
  }

  // Usar o período passado pelo frontend
  let periodoInicio: Date | undefined
  let periodoFim: Date | undefined
  
  if (whereData.dataDeteccao?.gte && whereData.dataDeteccao?.lte) {
    // Período selecionado pelo usuário (mês de referência)
    periodoInicio = new Date(whereData.dataDeteccao.gte)
    periodoFim = new Date(whereData.dataDeteccao.lte)
  }

  // Buscar chamados do transporte no período
  const chamados = await prisma.chamado.findMany({
    where: {
      ...whereData,
      transporteId: transporteId,
    },
    include: {
      tipoFalha: true,
      abertoPor: { select: { nome: true } },
      periodosImpacto: true,
    },
    orderBy: { dataDeteccao: "asc" },
  })

  // Calcular métricas
  let tempoTotalIndisponivel = 0 // em milissegundos
  let tempoTotalImpacto = 0

  const chamadosFormatados = chamados.map((c) => {
    const dataFim = c.dataNormalizacao || c.dataResolucao || c.dataFechamento
    const duracaoMs = dataFim
      ? dataFim.getTime() - c.dataDeteccao.getTime()
      : Date.now() - c.dataDeteccao.getTime()
    
    tempoTotalIndisponivel += duracaoMs

    // Somar períodos de impacto
    const impactoMs = c.periodosImpacto.reduce((acc, p) => {
      if (p.fim) {
        return acc + (p.fim.getTime() - p.inicio.getTime())
      }
      return acc
    }, 0)
    tempoTotalImpacto += impactoMs

    return {
      numero: c.numero,
      dataDeteccao: c.dataDeteccao,
      dataNormalizacao: c.dataNormalizacao,
      dataFechamento: c.dataFechamento,
      duracaoHoras: Math.round((duracaoMs / (1000 * 60 * 60)) * 100) / 100,
      duracaoFormatada: formatarDuracao(duracaoMs),
      tipoFalha: c.tipoFalha?.nome || "Não especificado",
      impacto: c.impacto,
      protocoloOperadora: c.protocoloOperadora,
      descricaoProblema: c.descricaoProblema,
      status: c.status,
      periodosImpacto: c.periodosImpacto.map(p => ({
        inicio: p.inicio,
        fim: p.fim,
        duracaoFormatada: p.fim ? formatarDuracao(p.fim.getTime() - p.inicio.getTime()) : "Em andamento",
      })),
    }
  })

  // Calcular período do relatório
  const dataInicio = periodoInicio || whereData.dataDeteccao?.gte || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  const dataFim = periodoFim || whereData.dataDeteccao?.lte || new Date()
  const periodoTotalMs = dataFim.getTime() - dataInicio.getTime()
  const periodoTotalHoras = periodoTotalMs / (1000 * 60 * 60)

  // Calcular disponibilidade
  const tempoIndisponivelHoras = tempoTotalIndisponivel / (1000 * 60 * 60)
  const disponibilidade = periodoTotalHoras > 0
    ? Math.max(0, ((periodoTotalHoras - tempoIndisponivelHoras) / periodoTotalHoras) * 100)
    : 100

  // SLA de disponibilidade contratado (em percentual)
  const slaContratado = 99.5 // SLA padrão de 99.5% de disponibilidade

  const descumprimentoSla = Math.max(0, slaContratado - disponibilidade)

  return {
    link: {
      id: transporte.id,
      designador: `${transporte.nome} (${transporte.fornecedor})`,
      tipoServico: "Transporte",
      capacidade: transporte.capacidade || "N/A",
      diaVencimento: null,
      operadora: transporte.fornecedor,
      operadoraTelefone: null,
      operadoraEmail: null,
      pop: `${transporte.origem} ↔ ${transporte.destino}`,
      popCidade: transporte.origem,
      popEstado: transporte.destino,
    },
    periodo: {
      inicio: dataInicio,
      fim: dataFim,
      totalHoras: Math.round(periodoTotalHoras * 10) / 10,
      totalDias: Math.round((periodoTotalHoras / 24) * 10) / 10,
    },
    metricas: {
      totalIncidentes: chamados.length,
      incidentesCriticos: chamados.filter(c => c.impacto === "critico").length,
      incidentesAbertos: chamados.filter(c => c.status !== "fechado").length,
      tempoTotalIndisponivel: formatarDuracao(tempoTotalIndisponivel),
      tempoTotalIndisponivelHoras: Math.round(tempoIndisponivelHoras * 100) / 100,
      tempoTotalImpacto: formatarDuracao(tempoTotalImpacto),
      tempoTotalImpactoHoras: Math.round((tempoTotalImpacto / (1000 * 60 * 60)) * 100) / 100,
      disponibilidade: Math.round(disponibilidade * 100) / 100,
      slaContratado: Math.round(slaContratado * 100) / 100,
      descumprimentoSla: Math.round(descumprimentoSla * 100) / 100,
      cumpreSla: disponibilidade >= slaContratado,
    },
    chamados: chamadosFormatados,
    geradoEm: new Date(),
  }
}

// Função auxiliar para formatar duração
function formatarDuracao(ms: number): string {
  const horas = Math.floor(ms / (1000 * 60 * 60))
  const minutos = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60))
  
  if (horas > 0) {
    return `${horas}h ${minutos}min`
  }
  return `${minutos}min`
}

