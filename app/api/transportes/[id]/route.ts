import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const id = parseInt(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  const transporte = await prisma.transporte.findUnique({
    where: { id },
    include: {
      operadora: true,
      links: {
        where: { ativo: true },
        include: {
          operadora: true,
          pop: true,
        },
      },
      chamados: {
        where: { status: { not: "fechado" } },
        include: {
          tipoFalha: true,
          abertoPor: { select: { id: true, nome: true } },
        },
        orderBy: { dataAbertura: "desc" },
        take: 10,
      },
      _count: {
        select: { 
          links: true, 
          chamados: { where: { status: { not: "fechado" } } } 
        }
      }
    },
  })

  if (!transporte) {
    return NextResponse.json({ error: "Transporte não encontrado" }, { status: 404 })
  }

  return NextResponse.json(transporte)
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const id = parseInt(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const { nome, operadoraId, origem, destino, capacidade, tecnologia, observacoes, ativo } = body

    const transporte = await prisma.transporte.update({
      where: { id },
      data: {
        nome,
        operadoraId,
        origem,
        destino,
        capacidade: capacidade || null,
        tecnologia: tecnologia || null,
        observacoes: observacoes || null,
        ativo: ativo ?? true,
      },
    })

    return NextResponse.json(transporte)
  } catch (error) {
    console.error("Erro ao atualizar transporte:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const id = parseInt(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    await prisma.transporte.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao arquivar transporte:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

