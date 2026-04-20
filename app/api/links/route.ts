import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import { linkSchema } from "@/lib/validations"
import { dispararWebhook } from "@/lib/webhook"

export async function GET(request: NextRequest) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const ativo = searchParams.get("ativo")
  const operadoraId = searchParams.get("operadoraId")
  const popId = searchParams.get("popId")

  const where: any = {}
  
  if (ativo !== null) {
    where.ativo = ativo === "true"
  }
  if (operadoraId) {
    where.operadoraId = parseInt(operadoraId)
  }
  if (popId) {
    where.popId = parseInt(popId)
  }

  const links = await prisma.link.findMany({
    where,
    include: {
      operadora: true,
      pop: true,
      transporte: true,
    },
    orderBy: { designador: "asc" },
  })

  return NextResponse.json(links)
}

export async function POST(request: NextRequest) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    
    const parsed = linkSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const link = await prisma.link.create({
      data: parsed.data,
      include: {
        operadora: true,
        pop: true,
        transporte: true,
      },
    })

    // Disparar webhook para link criado
    dispararWebhook("link.criado", {
      id: link.id,
      designador: link.designador,
      operadora: link.operadora?.nome,
      pop: link.pop?.nome,
      ativo: link.ativo,
    }).catch((error) => console.error("Erro ao disparar webhook:", error))

    return NextResponse.json(link, { status: 201 })
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Designador já existe" },
        { status: 400 }
      )
    }
    console.error("Erro ao criar link:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

