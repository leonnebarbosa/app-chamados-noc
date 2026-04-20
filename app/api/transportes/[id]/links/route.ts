import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"

// Retorna os links de um transporte específico
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

  const links = await prisma.link.findMany({
    where: { 
      transporteId: id,
      ativo: true,
    },
    include: {
      operadora: true,
      pop: true,
    },
    orderBy: { designador: "asc" },
  })

  return NextResponse.json(links)
}

