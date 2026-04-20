import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { verificarSenha, criarToken } from "@/lib/auth"
import { loginSchema } from "@/lib/validations"
import { cookies } from "next/headers"
import { checkRateLimit } from "@/lib/security"

export async function POST(request: NextRequest) {
  try {
    // Rate limiting por IP
    const ip = request.ip || request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "unknown"
    const rateLimit = checkRateLimit(`login:${ip}`, { maxRequests: 5, windowMinutes: 15 })

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        { 
          error: "Muitas tentativas de login. Tente novamente mais tarde.",
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
          }
        }
      )
    }

    const body = await request.json()
    
    const parsed = loginSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Dados inválidos" },
        { status: 400 }
      )
    }

    const { email, senha } = parsed.data

    const usuario = await prisma.usuario.findUnique({
      where: { email },
    })

    // Mensagem genérica para não revelar se usuário existe
    if (!usuario || !usuario.ativo) {
      // Delay artificial para dificultar timing attacks
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 100))
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    const senhaValida = await verificarSenha(senha, usuario.senhaHash)
    if (!senhaValida) {
      // Delay artificial para dificultar timing attacks
      await new Promise(resolve => setTimeout(resolve, Math.random() * 100 + 100))
      return NextResponse.json(
        { error: "Email ou senha incorretos" },
        { status: 401 }
      )
    }

    // Atualiza último acesso
    await prisma.usuario.update({
      where: { id: usuario.id },
      data: { ultimoAcesso: new Date() },
    })

    const token = await criarToken({
      userId: usuario.id,
      email: usuario.email,
      nome: usuario.nome,
      perfil: usuario.perfil,
    })

    cookies().set("auth-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge: 60 * 60 * 8, // 8 horas
      path: "/",
    })

    return NextResponse.json({
      success: true,
      nome: usuario.nome,
      perfil: usuario.perfil,
    })
  } catch (error) {
    console.error("Erro no login:", error)
    return NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    )
  }
}

