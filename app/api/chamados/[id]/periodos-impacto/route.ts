import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"

// GET - Listar períodos de impacto de um chamado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const chamadoId = parseInt(params.id)
  if (isNaN(chamadoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  const periodos = await prisma.periodoImpacto.findMany({
    where: { chamadoId },
    include: {
      criadoPor: { select: { id: true, nome: true } },
    },
    orderBy: { inicio: "asc" },
  })

  return NextResponse.json(periodos)
}

// POST - Criar novo período de impacto
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const chamadoId = parseInt(params.id)
  if (isNaN(chamadoId)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { inicio, fim, descricao } = body

    if (!inicio) {
      return NextResponse.json(
        { error: "Data de início é obrigatória" },
        { status: 400 }
      )
    }

    const periodo = await prisma.periodoImpacto.create({
      data: {
        chamado: { connect: { id: chamadoId } },
        inicio: new Date(inicio),
        fim: fim ? new Date(fim) : null,
        descricao: descricao || null,
        criadoPor: { connect: { id: usuario.userId } },
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
        descricao: `Período de impacto adicionado: ${new Date(inicio).toLocaleString('pt-BR')}${fim ? ' até ' + new Date(fim).toLocaleString('pt-BR') : ' (em andamento)'}`,
        usuarioId: usuario.userId,
      },
    })

    return NextResponse.json(periodo, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar período de impacto:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

