import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import { atualizacaoChamadoSchema } from "@/lib/validations"

export async function POST(
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
    
    const parsed = atualizacaoChamadoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { descricao, novoStatus } = parsed.data

    const chamadoAtual = await prisma.chamado.findUnique({
      where: { id },
    })

    if (!chamadoAtual) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    // Cria o histórico
    const historico = await prisma.chamadoHistorico.create({
      data: {
        chamadoId: id,
        usuarioId: usuario.userId,
        tipoAcao: novoStatus ? "mudanca_status" : "atualizacao",
        descricao,
        statusAnterior: novoStatus ? chamadoAtual.status : null,
        statusNovo: novoStatus || null,
      },
      include: {
        usuario: { select: { id: true, nome: true } },
      },
    })

    // Atualiza o status se necessário
    if (novoStatus && novoStatus !== chamadoAtual.status) {
      await prisma.chamado.update({
        where: { id },
        data: { status: novoStatus },
      })
    }

    return NextResponse.json(historico, { status: 201 })
  } catch (error) {
    console.error("Erro ao adicionar histórico:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

