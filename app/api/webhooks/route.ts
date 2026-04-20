import { NextRequest, NextResponse } from "next/server"
import { getUsuarioLogado } from "@/lib/auth"
import { prisma } from "@/lib/db"
import { validarURLWebhook } from "@/lib/webhook"
import { rateLimit } from "@/lib/security"

// GET /api/webhooks - Listar webhooks
export async function GET(request: NextRequest) {
  // Rate limiting: 100 requisições por minuto
  const ip = request.ip ?? "unknown"
  const { allowed, remaining, reset } = rateLimit(ip, 100, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente mais tarde." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "100",
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(reset / 1000).toString(),
        },
      }
    )
  }

  const usuario = await getUsuarioLogado()
  
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  // Apenas supervisores podem gerenciar webhooks
  if (usuario.perfil !== "supervisor") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  try {
    const webhooks = await prisma.webhookConfig.findMany({
      orderBy: { criadoEm: "desc" },
    })

    return NextResponse.json(webhooks)
  } catch (error) {
    console.error("Erro ao listar webhooks:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

// POST /api/webhooks - Criar webhook
export async function POST(request: NextRequest) {
  // Rate limiting: 20 criações por minuto
  const ip = request.ip ?? "unknown"
  const { allowed, remaining, reset } = rateLimit(ip, 20, 60 * 1000)

  if (!allowed) {
    return NextResponse.json(
      { error: "Muitas requisições. Tente novamente mais tarde." },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": "20",
          "X-RateLimit-Remaining": remaining.toString(),
          "X-RateLimit-Reset": Math.ceil(reset / 1000).toString(),
        },
      }
    )
  }

  const usuario = await getUsuarioLogado()
  
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  if (usuario.perfil !== "supervisor") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
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

    // Validações
    if (!nome || !url) {
      return NextResponse.json(
        { error: "Nome e URL são obrigatórios" },
        { status: 400 }
      )
    }

    if (!eventos || eventos.length === 0) {
      return NextResponse.json(
        { error: "Selecione pelo menos um evento" },
        { status: 400 }
      )
    }

    // Validar URL (prevenir SSRF)
    const urlValidation = validarURLWebhook(url)
    if (!urlValidation.valid) {
      return NextResponse.json(
        { error: urlValidation.error || "URL inválida" },
        { status: 400 }
      )
    }

    // Criar webhook
    const webhook = await prisma.webhookConfig.create({
      data: {
        nome,
        url,
        ativo: ativo !== undefined ? ativo : true,
        eventos: JSON.stringify(eventos),
        headers: headers ? JSON.stringify(headers) : null,
        metodo: metodo || "POST",
        timeout: timeout || 30,
        retentativas: retentativas || 3,
      },
    })

    return NextResponse.json(webhook, { status: 201 })
  } catch (error) {
    console.error("Erro ao criar webhook:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

