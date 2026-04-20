import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"

export async function GET() {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const tiposFalha = await prisma.tipoFalha.findMany({
    orderBy: { nome: "asc" },
  })

  return NextResponse.json(tiposFalha)
}

export async function POST(request: NextRequest) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { nome, descricao } = body

    if (!nome || nome.length < 2) {
      return NextResponse.json(
        { error: "Nome deve ter no mínimo 2 caracteres" },
        { status: 400 }
      )
    }

    const tipoFalha = await prisma.tipoFalha.create({
      data: { nome, descricao },
    })

    return NextResponse.json(tipoFalha, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar tipo de falha:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

