import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import { popSchema } from "@/lib/validations"

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

  const pops = await prisma.pop.findMany({
    where,
    orderBy: [{ estado: "asc" }, { cidade: "asc" }],
  })

  return NextResponse.json(pops)
}

export async function POST(request: NextRequest) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const parsed = popSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const pop = await prisma.pop.create({
      data: parsed.data,
    })

    return NextResponse.json(pop, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Código do POP já existe" },
        { status: 400 }
      )
    }
    console.error("Erro ao criar POP:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

