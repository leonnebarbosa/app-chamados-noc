import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import { dispararWebhook, formatarChamadoParaWebhook } from "@/lib/webhook"

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

  const chamado = await prisma.chamado.findUnique({
    where: { id },
    include: {
      link: {
        include: {
          operadora: true,
          pop: true,
          transporte: true,
        },
      },
      transporte: {
        include: {
          links: {
            where: { ativo: true },
            include: {
              operadora: true,
              pop: true,
            },
          },
        },
      },
      tipoFalha: true,
      abertoPor: { select: { id: true, nome: true } },
      fechadoPor: { select: { id: true, nome: true } },
      historicos: {
        include: {
          usuario: { select: { id: true, nome: true } },
        },
        orderBy: { criadoEm: "desc" },
      },
      anexos: {
        include: {
          usuario: { select: { id: true, nome: true } },
        },
        orderBy: { criadoEm: "desc" },
      },
      periodosImpacto: {
        include: {
          criadoPor: { select: { id: true, nome: true } },
        },
        orderBy: { inicio: "asc" },
      },
    },
  })

  if (!chamado) {
    return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
  }

  return NextResponse.json(chamado)
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
    const { status, protocoloOperadora, descricao, dataInicioImpacto, dataFimImpacto } = body

    const chamadoAtual = await prisma.chamado.findUnique({
      where: { id },
    })

    if (!chamadoAtual) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    const updateData: any = {}

    if (status && status !== chamadoAtual.status) {
      updateData.status = status
      
      // Registra contato com operadora
      if (status === "aguardando_operadora" && !chamadoAtual.dataContatoOperadora) {
        updateData.dataContatoOperadora = new Date()
      }

      // Registra histórico de mudança de status
      await prisma.chamadoHistorico.create({
        data: {
          chamadoId: id,
          usuarioId: usuario.userId,
          tipoAcao: "mudanca_status",
          descricao: descricao || `Status alterado para ${status}`,
          statusAnterior: chamadoAtual.status,
          statusNovo: status,
        },
      })
    }

    if (protocoloOperadora) {
      updateData.protocoloOperadora = protocoloOperadora
      if (!chamadoAtual.dataContatoOperadora) {
        updateData.dataContatoOperadora = new Date()
      }
    }

    // Campos de período de impacto
    if (dataInicioImpacto !== undefined) {
      updateData.dataInicioImpacto = dataInicioImpacto ? new Date(dataInicioImpacto) : null
    }
    if (dataFimImpacto !== undefined) {
      updateData.dataFimImpacto = dataFimImpacto ? new Date(dataFimImpacto) : null
    }

    // Campo de normalização manual
    if (body.dataNormalizacao !== undefined) {
      updateData.dataNormalizacao = body.dataNormalizacao ? new Date(body.dataNormalizacao) : null
      
      // Registra histórico
      if (body.dataNormalizacao) {
        await prisma.chamadoHistorico.create({
          data: {
            chamadoId: id,
            usuarioId: usuario.userId,
            tipoAcao: "atualizacao",
            descricao: `Data de normalização atualizada para ${new Date(body.dataNormalizacao).toLocaleString("pt-BR")}`,
          },
        })
      }
    }

    // Campo de detecção
    if (body.dataDeteccao !== undefined) {
      updateData.dataDeteccao = new Date(body.dataDeteccao)
      
      // Registra histórico
      await prisma.chamadoHistorico.create({
        data: {
          chamadoId: id,
          usuarioId: usuario.userId,
          tipoAcao: "atualizacao",
          descricao: `Data de detecção atualizada para ${new Date(body.dataDeteccao).toLocaleString("pt-BR")}`,
        },
      })
    }

    const chamado = await prisma.chamado.update({
      where: { id },
      data: updateData,
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

    // Disparar webhooks
    if (status && status !== chamadoAtual.status) {
      // Se houve mudança de status, disparar evento específico
      dispararWebhook("chamado.status_alterado", {
        ...formatarChamadoParaWebhook(chamado),
        statusAnterior: chamadoAtual.status,
        statusNovo: status,
      }).catch((error) => console.error("Erro ao disparar webhook:", error))
    } else {
      // Senão, disparar evento genérico de atualização
      dispararWebhook("chamado.atualizado", formatarChamadoParaWebhook(chamado)).catch(
        (error) => console.error("Erro ao disparar webhook:", error)
      )
    }

    return NextResponse.json(chamado)
  } catch (error) {
    console.error("Erro ao atualizar chamado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
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

  // Apenas supervisores podem deletar chamados
  if (usuario.perfil !== "supervisor") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    // Verificar se o chamado existe
    const chamado = await prisma.chamado.findUnique({
      where: { id },
    })

    if (!chamado) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    // Deletar anexos primeiro (se houver arquivos físicos, você pode adicionar lógica para deletá-los)
    await prisma.chamadoAnexo.deleteMany({
      where: { chamadoId: id },
    })

    // Deletar histórico
    await prisma.chamadoHistorico.deleteMany({
      where: { chamadoId: id },
    })

    // Deletar períodos de impacto
    await prisma.periodoImpacto.deleteMany({
      where: { chamadoId: id },
    })

    // Deletar o chamado
    await prisma.chamado.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Chamado excluído com sucesso" })
  } catch (error) {
    console.error("Erro ao excluir chamado:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

