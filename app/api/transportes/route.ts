import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"

export async function GET(request: NextRequest) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  const searchParams = request.nextUrl.searchParams
  const ativo = searchParams.get("ativo")
  const includeLinks = searchParams.get("includeLinks") === "true"

  const where: any = {}
  if (ativo !== null) {
    where.ativo = ativo === "true"
  }

  const transportes = await prisma.transporte.findMany({
    where,
    include: includeLinks ? {
      operadora: true,
      links: {
        where: { ativo: true },
        include: {
          operadora: true,
          pop: true,
        },
      },
      _count: {
        select: { links: true, chamados: { where: { status: { not: "fechado" } } } }
      }
    } : {
      operadora: true,
      _count: {
        select: { links: true, chamados: { where: { status: { not: "fechado" } } } }
      }
    },
    orderBy: { nome: "asc" },
  })

  return NextResponse.json(transportes)
}

export async function POST(request: NextRequest) {
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { nome, operadoraId, origem, destino, capacidade, tecnologia, observacoes } = body

    if (!nome || !operadoraId || !origem || !destino) {
      return NextResponse.json(
        { error: "Nome, operadora, origem e destino são obrigatórios" },
        { status: 400 }
      )
    }

    const transporte = await prisma.transporte.create({
      data: {
        nome,
        operadoraId,
        origem,
        destino,
        capacidade: capacidade || null,
        tecnologia: tecnologia || null,
        observacoes: observacoes || null,
      },
    })

    return NextResponse.json(transporte, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar transporte:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

