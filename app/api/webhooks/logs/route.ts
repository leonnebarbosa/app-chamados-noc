import { NextRequest, NextResponse } from "next/server"
import { getUsuarioLogado } from "@/lib/auth"
import { prisma } from "@/lib/db"

// GET /api/webhooks/logs - Listar logs de webhooks
export async function GET(request: NextRequest) {
  const usuario = await getUsuarioLogado()
  
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  if (usuario.perfil !== "supervisor") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  try {
    const { searchParams } = new URL(request.url)
    const webhookId = searchParams.get("webhookId")
    const evento = searchParams.get("evento")
    const limit = parseInt(searchParams.get("limit") || "50")

    const where: any = {}

    if (webhookId) {
      where.webhookConfigId = parseInt(webhookId)
    }

    if (evento) {
      where.evento = evento
    }

    const logs = await prisma.webhookLog.findMany({
      where,
      orderBy: { criadoEm: "desc" },
      take: limit,
    })

    return NextResponse.json(logs)
  } catch (error) {
    console.error("Erro ao listar logs de webhooks:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

