import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"

// PUT - Atualizar período de impacto
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; periodoId: string } }
) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const chamadoId = parseInt(params.id)
  const periodoId = parseInt(params.periodoId)
  
  if (isNaN(chamadoId) || isNaN(periodoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { inicio, fim, descricao } = body

    // Verificar se o período pertence ao chamado
    const periodoExistente = await prisma.periodoImpacto.findFirst({
      where: { id: periodoId, chamadoId },
    })

    if (!periodoExistente) {
      return NextResponse.json(
        { error: "Período não encontrado" },
        { status: 404 }
      )
    }

    const periodo = await prisma.periodoImpacto.update({
      where: { id: periodoId },
      data: {
        inicio: inicio ? new Date(inicio) : undefined,
        fim: fim === null ? null : (fim ? new Date(fim) : undefined),
        descricao: descricao !== undefined ? descricao : undefined,
      },
      include: {
        criadoPor: { select: { id: true, nome: true } },
      },
    })

    // Registrar no histórico
    await prisma.chamadoHistorico.create({
      data: {
        chamadoId,
        tipoAcao: "periodo_impacto",
        descricao: `Período de impacto atualizado`,
        usuarioId: usuario.userId,
      },
    })

    return NextResponse.json(periodo)
  } catch (error) {
    console.error("Erro ao atualizar período de impacto:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE - Remover período de impacto
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; periodoId: string } }
) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const chamadoId = parseInt(params.id)
  const periodoId = parseInt(params.periodoId)
  
  if (isNaN(chamadoId) || isNaN(periodoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    // Verificar se o período pertence ao chamado
    const periodo = await prisma.periodoImpacto.findFirst({
      where: { id: periodoId, chamadoId },
    })

    if (!periodo) {
      return NextResponse.json(
        { error: "Período não encontrado" },
        { status: 404 }
      )
    }

    await prisma.periodoImpacto.delete({
      where: { id: periodoId },
    })

    // Registrar no histórico
    await prisma.chamadoHistorico.create({
      data: {
        chamadoId,
        tipoAcao: "periodo_impacto",
        descricao: `Período de impacto removido: ${periodo.inicio.toLocaleString('pt-BR')}${periodo.fim ? ' até ' + periodo.fim.toLocaleString('pt-BR') : ''}`,
        usuarioId: usuario.userId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao deletar período de impacto:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

