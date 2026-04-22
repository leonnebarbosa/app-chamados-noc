import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import { fechamentoChamadoSchema } from "@/lib/validations"
import { dispararWebhook, formatarChamadoParaWebhook } from "@/lib/webhook"

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
    
    const parsed = fechamentoChamadoSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos", details: parsed.error.flatten() },
        { status: 400 }
      )
    }

    const { dataResolucao, semConfirmacaoOperadora, observacao } = parsed.data

    const chamadoAtual = await prisma.chamado.findUnique({
      where: { id },
    })

    if (!chamadoAtual) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    if (chamadoAtual.status === "fechado") {
      return NextResponse.json({ error: "Chamado já está fechado" }, { status: 400 })
    }

    // Atualiza o chamado
    const chamado = await prisma.chamado.update({
      where: { id },
      data: {
        status: "fechado",
        dataResolucao: new Date(dataResolucao),
        dataNormalizacao: new Date(dataResolucao),
        dataFechamento: new Date(),
        fechadoPorId: usuario.userId,
      },
      include: {
        link: {
          include: {
            operadora: true,
            pop: true,
          },
        },
        transporte: true,
        tipoFalha: true,
        abertoPor: { select: { id: true, nome: true } },
        fechadoPor: { select: { id: true, nome: true } },
      },
    })

    // Disparar webhook
    dispararWebhook("chamado.fechado", formatarChamadoParaWebhook(chamado)).catch(
      (error) => console.error("Erro ao disparar webhook:", error)
    )

    // Cria histórico de fechamento
    let descricaoHistorico = "Chamado fechado."
    if (semConfirmacaoOperadora) {
      descricaoHistorico += " Sem confirmação da operadora."
    }
    if (observacao) {
      descricaoHistorico += ` Observação: ${observacao}`
    }

    await prisma.chamadoHistorico.create({
      data: {
        chamadoId: id,
        usuarioId: usuario.userId,
        tipoAcao: "fechamento",
        descricao: descricaoHistorico,
        statusAnterior: chamadoAtual.status,
        statusNovo: "fechado",
      },
    })

    return NextResponse.json(chamado)
  } catch (error) {
    console.error("Erro ao fechar chamado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

