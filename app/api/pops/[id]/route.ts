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

  const pop = await prisma.pop.findUnique({
    where: { id },
  })

  if (!pop) {
    return NextResponse.json({ error: "POP não encontrado" }, { status: 404 })
  }

  return NextResponse.json(pop)
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
    const { codigo, nome, cidade, estado, endereco, ativo } = body

    const pop = await prisma.pop.update({
      where: { id },
      data: {
        codigo,
        nome,
        cidade,
        estado: estado?.toUpperCase(),
        endereco: endereco || null,
        ativo: ativo ?? true,
      },
    })

    return NextResponse.json(pop)
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Código já existe" }, { status: 400 })
    }
    console.error("Erro ao atualizar POP:", error)
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
    await prisma.pop.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao arquivar POP:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

