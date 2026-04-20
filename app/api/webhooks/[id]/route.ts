import { NextRequest, NextResponse } from "next/server"
import { getUsuarioLogado } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { validarURLWebhook } from "@/lib/webhook"

// GET /api/webhooks/:id - Obter webhook específico
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioLogado()
  
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  if (usuario.perfil !== "supervisor") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    const webhook = await prisma.webhookConfig.findUnique({
      where: { id },
    })

    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook não encontrado" },
        { status: 404 }
      )
    }

    return NextResponse.json(webhook)
  } catch (error) {
    console.error("Erro ao buscar webhook:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// PUT /api/webhooks/:id - Atualizar webhook
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioLogado()
  
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  if (usuario.perfil !== "supervisor") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    const body = await request.json()
    const {
      nome,
      url,
      ativo,
      eventos,
      headers,
      metodo,
      timeout,
      retentativas,
    } = body

    // Verificar se webhook existe
    const webhookExistente = await prisma.webhookConfig.findUnique({
      where: { id },
    })

    if (!webhookExistente) {
      return NextResponse.json(
        { error: "Webhook não encontrado" },
        { status: 404 }
      )
    }

    // Validações (prevenir SSRF)
    if (url) {
      const urlValidation = validarURLWebhook(url)
      if (!urlValidation.valid) {
        return NextResponse.json(
          { error: urlValidation.error || "URL inválida" },
          { status: 400 }
        )
      }
    }

    if (eventos && eventos.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um evento" },
        { status: 400 }
      )
    }

    // Atualizar webhook
    const webhook = await prisma.webhookConfig.update({
      where: { id },
      data: {
        ...(nome !== undefined && { nome }),
        ...(url !== undefined && { url }),
        ...(ativo !== undefined && { ativo }),
        ...(eventos !== undefined && { eventos: JSON.stringify(eventos) }),
        ...(headers !== undefined && { headers: headers ? JSON.stringify(headers) : null }),
        ...(metodo !== undefined && { metodo }),
        ...(timeout !== undefined && { timeout }),
        ...(retentativas !== undefined && { retentativas }),
      },
    })

    return NextResponse.json(webhook)
  } catch (error) {
    console.error("Erro ao atualizar webhook:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// DELETE /api/webhooks/:id - Deletar webhook
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const usuario = await getUsuarioLogado()
  
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  if (usuario.perfil !== "supervisor") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  const id = parseInt(params.id)
  if (isNaN(id)) {
    return NextResponse.json({ error: "ID inválido" }, { status: 400 })
  }

  try {
    // Verificar se webhook existe
    const webhook = await prisma.webhookConfig.findUnique({
      where: { id },
    })

    if (!webhook) {
      return NextResponse.json(
        { error: "Webhook não encontrado" },
        { status: 404 }
      )
    }

    // Deletar webhook
    await prisma.webhookConfig.delete({
      where: { id },
    })

    return NextResponse.json({ message: "Webhook deletado com sucesso" })
  } catch (error) {
    console.error("Erro ao deletar webhook:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

