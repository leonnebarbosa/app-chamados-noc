import { SignJWT, jwtVerify } from "jose"
import { cookies } from "next/headers"
import bcrypt from "bcryptjs"
import { prisma } from "./db"

// Validar JWT_SECRET apenas em runtime (não durante build)
function getJWTSecret(): Uint8Array {
  // Durante build, usar um valor dummy
  if (process.env.NEXT_PHASE === "phase-production-build") {
    return new TextEncoder().encode("build-time-dummy-secret-not-used-in-production")
  }

  if (!process.env.JWT_SECRET) {
    throw new Error(
      "SECURITY ERROR: JWT_SECRET must be defined in environment variables. " +
      "Generate a strong secret with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    )
  }

  if (process.env.JWT_SECRET.length < 32) {
    throw new Error(
      "SECURITY ERROR: JWT_SECRET must be at least 32 characters long. " +
      "Generate a strong secret with: node -e \"console.log(require('crypto').randomBytes(64).toString('hex'))\""
    )
  }

  return new TextEncoder().encode(process.env.JWT_SECRET)
}

const JWT_SECRET = getJWTSecret()

export interface JWTPayload {
  userId: number
  email: string
  nome: string
  perfil: string
}

export async function hashSenha(senha: string): Promise<string> {
  return bcrypt.hash(senha, 12)
}

export async function verificarSenha(senha: string, hash: string): Promise<boolean> {
  return bcrypt.compare(senha, hash)
}

export async function criarToken(payload: JWTPayload): Promise<string> {
  return new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("8h")
    .sign(JWT_SECRET)
}

export async function verificarToken(token: string): Promise<JWTPayload | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as unknown as JWTPayload
  } catch {
    return null
  }
}

export async function getUsuarioLogado(): Promise<JWTPayload | null> {
  const cookieStore = cookies()
  const token = cookieStore.get("auth-token")?.value

  if (!token) return null

  return verificarToken(token)
}

export async function login(email: string, senha: string): Promise<{ success: boolean; error?: string }> {
  const usuario = await prisma.usuario.findUnique({
    where: { email },
  })

  // Usar mensagem genérica para prevenir enumeração de usuários
  if (!usuario || !usuario.ativo) {
    return { success: false, error: "Email ou senha incorretos" }
  }

  const senhaValida = await verificarSenha(senha, usuario.senhaHash)
  if (!senhaValida) {
    return { success: false, error: "Email ou senha incorretos" }
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
    sameSite: "strict", // Proteção contra CSRF
    maxAge: 60 * 60 * 8, // 8 horas
    path: "/",
  })

  return { success: true }
}

export function logout() {
  cookies().delete("auth-token")
}

