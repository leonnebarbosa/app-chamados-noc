import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"

// GET - Retorna chamados com SLA próximo de estourar
export async function GET(request: NextRequest) {
  try {
    const usuarioLogado = await getUsuarioLogado()
    
    if (!usuarioLogado) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    // Buscar chamados abertos ou em andamento
    const chamadosAbertos = await prisma.chamado.findMany({
      where: {
        status: {
          in: ["aberto", "em_andamento", "aguardando_operadora"],
        },
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
      orderBy: { dataDeteccao: "asc" }, // Mais antigos primeiro
    })

    const agora = new Date()
    const alertas: any[] = []

    for (const chamado of chamadosAbertos) {
      const dataDeteccao = new Date(chamado.dataDeteccao)
      const horasAberto = (agora.getTime() - dataDeteccao.getTime()) / (1000 * 60 * 60)

      // Determinar SLA baseado no impacto
      let slaHoras = 24 // Padrão
      switch (chamado.impacto) {
        case "critico":
          slaHoras = 4
          break
        case "alto":
          slaHoras = 8
          break
        case "medio":
          slaHoras = 16
          break
        case "baixo":
          slaHoras = 24
          break
      }

      // Se operadora tem SLA específico, usar ele
      if (chamado.link?.operadora?.slaHoras) {
        slaHoras = chamado.link.operadora.slaHoras
      }

      const percentualSLA = (horasAberto / slaHoras) * 100
      const horasRestantes = slaHoras - horasAberto

      // Alertar se passou 70% do SLA ou já estourou
      if (percentualSLA >= 70 || horasRestantes <= 0) {
        alertas.push({
          id: chamado.id,
          numero: chamado.numero,
          status: chamado.status,
          impacto: chamado.impacto,
          link: chamado.link?.designador || chamado.transporte?.nome,
          operadora: chamado.link?.operadora?.nome || chamado.transporte?.operadora?.nome,
          tipoFalha: chamado.tipoFalha?.nome,
          dataAbertura: chamado.dataAbertura,
          horasAberto: Math.round(horasAberto * 10) / 10,
          slaHoras,
          horasRestantes: Math.round(horasRestantes * 10) / 10,
          percentualSLA: Math.round(percentualSLA),
          estourado: horasRestantes <= 0,
          criticidade: horasRestantes <= 0 ? "estourado" : percentualSLA >= 90 ? "critico" : "atencao",
        })
      }
    }

    // Ordenar por criticidade
    alertas.sort((a, b) => {
      if (a.estourado && !b.estourado) return -1
      if (!a.estourado && b.estourado) return 1
      return b.percentualSLA - a.percentualSLA
    })

    return NextResponse.json({
      total: alertas.length,
      estourados: alertas.filter(a => a.estourado).length,
      emAtencao: alertas.filter(a => !a.estourado).length,
      alertas,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar alertas" }, { status: 500 })
  }
}


