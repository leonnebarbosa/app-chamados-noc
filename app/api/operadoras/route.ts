import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import { operadoraSchema } from "@/lib/validations"

export async function GET(request: NextRequest) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const ativo = searchParams.get("ativo")

  const where: any = {}
  if (ativo !== null) {
    where.ativo = ativo === "true"
  }

  const operadoras = await prisma.operadora.findMany({
    where,
    orderBy: { nome: "asc" },
  })

  return NextResponse.json(operadoras)
}

export async function POST(request: NextRequest) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const parsed = operadoraSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const operadora = await prisma.operadora.create({
      data: parsed.data,
    })

    return NextResponse.json(operadora, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar operadora:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

