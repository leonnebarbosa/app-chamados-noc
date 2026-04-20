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

  const operadora = await prisma.operadora.findUnique({
    where: { id },
  })

  if (!operadora) {
    return NextResponse.json({ error: "Operadora não encontrada" }, { status: 404 })
  }

  return NextResponse.json(operadora)
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
    const { nome, telefoneSuporte, emailSuporte, portalUrl, slaHoras, observacoes, ativo } = body

    const operadora = await prisma.operadora.update({
      where: { id },
      data: {
        nome,
        telefoneSuporte: telefoneSuporte || null,
        emailSuporte: emailSuporte || null,
        portalUrl: portalUrl || null,
        slaHoras: slaHoras || null,
        observacoes: observacoes || null,
        ativo: ativo ?? true,
      },
    })

    return NextResponse.json(operadora)
  } catch (error) {
    console.error("Erro ao atualizar operadora:", error)
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
    await prisma.operadora.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao arquivar operadora:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

