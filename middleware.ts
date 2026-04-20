import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Rotas que não precisam de autenticação
const publicRoutes = ["/login", "/api/auth/login"]

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl

  // Permite rotas públicas
  if (publicRoutes.some((route) => pathname.startsWith(route))) {
    return NextResponse.next()
  }

  // Permite arquivos estáticos específicos
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.startsWith("/api-docs") ||
    pathname === "/openapi.yaml" ||
    pathname.match(/\.(ico|svg|css)$/)
  ) {
    return NextResponse.next()
  }

  // CRÍTICO: Bloquear acesso direto a uploads (requer autenticação)
  if (pathname.startsWith("/uploads/")) {
    // Verificar se tem token
    const token = request.cookies.get("auth-token")
    if (!token) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }
    // Permitir acesso se autenticado
    return NextResponse.next()
  }

  // Verifica token para rotas protegidas
  const token = request.cookies.get("auth-token")

  if (!token && !pathname.startsWith("/api")) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  if (!token && pathname.startsWith("/api")) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
}

