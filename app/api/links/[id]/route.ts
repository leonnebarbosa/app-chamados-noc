import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import { dispararWebhook } from "@/lib/webhook"

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

  const link = await prisma.link.findUnique({
    where: { id },
    include: {
      operadora: true,
      pop: true,
    },
  })

  if (!link) {
    return NextResponse.json({ error: "Link não encontrado" }, { status: 404 })
  }

  return NextResponse.json(link)
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
    const { designador, operadoraId, popId, transporteId, tipoServico, capacidade, diaVencimento, enderecoPontaA, enderecoPontaB, observacoes, ativo } = body

    const link = await prisma.link.update({
      where: { id },
      data: {
        designador,
        operadoraId: operadoraId || null,
        popId: popId || null,
        transporteId: transporteId || null,
        tipoServico: tipoServico || null,
        capacidade: capacidade || null,
        diaVencimento: diaVencimento || null,
        enderecoPontaA: enderecoPontaA || null,
        enderecoPontaB: enderecoPontaB || null,
        observacoes: observacoes || null,
        ativo: ativo ?? true,
      },
      include: {
        operadora: true,
        pop: true,
        transporte: true,
      },
    })

    // Disparar webhook para link atualizado
    dispararWebhook("link.atualizado", {
      id: link.id,
      designador: link.designador,
      operadora: link.operadora?.nome,
      pop: link.pop?.nome,
      ativo: link.ativo,
    }).catch((error) => console.error("Erro ao disparar webhook:", error))

    return NextResponse.json(link)
  } catch (error: any) {
    if (error.code === "P2002") {
      return NextResponse.json({ error: "Designador já existe" }, { status: 400 })
    }
    console.error("Erro ao atualizar link:", error)
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
    // Verificar se é exclusão permanente (query param)
    const url = new URL(request.url)
    const permanent = url.searchParams.get("permanent") === "true"
    
    if (permanent) {
      // Exclusão permanente - apenas para supervisores
      if (usuario.perfil !== "supervisor") {
        return NextResponse.json(
          { error: "Apenas supervisores podem excluir links permanentemente" },
          { status: 403 }
        )
      }
      
      // Verificar se o link está arquivado
      const link = await prisma.link.findUnique({ where: { id } })
      if (!link) {
        return NextResponse.json({ error: "Link não encontrado" }, { status: 404 })
      }
      if (link.ativo) {
        return NextResponse.json(
          { error: "O link precisa estar arquivado antes de ser excluído permanentemente" },
          { status: 400 }
        )
      }
      
      // Verificar se há chamados vinculados
      const chamadosCount = await prisma.chamado.count({ where: { linkId: id } })
      if (chamadosCount > 0) {
        return NextResponse.json(
          { error: `Este link possui ${chamadosCount} chamado(s) vinculado(s). Não é possível excluir.` },
          { status: 400 }
        )
      }
      
      // Exclusão permanente
      await prisma.link.delete({ where: { id } })

      // Disparar webhook para link deletado
      dispararWebhook("link.deletado", {
        id: id,
      }).catch((error) => console.error("Erro ao disparar webhook:", error))

      return NextResponse.json({ success: true, message: "Link excluído permanentemente" })
    }
    
    // Soft delete (arquivar)
    await prisma.link.update({
      where: { id },
      data: { ativo: false },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao excluir link:", error)
    return NextResponse.json({ error: "Erro interno do servidor" }, { status: 500 })
  }
}

