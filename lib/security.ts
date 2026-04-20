// Utilitários de Segurança

import { NextRequest, NextResponse } from "next/server"

// Rate Limiting simples baseado em memória
// NOTA: Para produção, use Redis ou similar para rate limiting distribuído
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

interface RateLimitOptions {
  maxRequests?: number
  windowMinutes?: number
}

/**
 * Rate limiting simples
 * @param identifier - Identificador único (IP, user ID, etc)
 * @param options - Configurações de rate limit
 * @returns true se dentro do limite, false se excedeu
 */
export function checkRateLimit(
  identifier: string,
  options: RateLimitOptions = {}
): { allowed: boolean; remaining: number; resetTime: number } {
  const maxRequests = options.maxRequests || 
    parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || "10")
  const windowMs = (options.windowMinutes || 
    parseInt(process.env.RATE_LIMIT_WINDOW_MINUTES || "15")) * 60 * 1000

  const now = Date.now()
  const record = rateLimitStore.get(identifier)

  // Limpar registros expirados periodicamente
  if (Math.random() < 0.01) {
    cleanupExpiredRecords()
  }

  if (!record || now > record.resetTime) {
    // Primeira requisição ou janela expirou
    rateLimitStore.set(identifier, {
      count: 1,
      resetTime: now + windowMs,
    })
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetTime: now + windowMs,
    }
  }

  if (record.count >= maxRequests) {
    // Limite excedido
    return {
      allowed: false,
      remaining: 0,
      resetTime: record.resetTime,
    }
  }

  // Incrementar contador
  record.count++
  rateLimitStore.set(identifier, record)

  return {
    allowed: true,
    remaining: maxRequests - record.count,
    resetTime: record.resetTime,
  }
}

function cleanupExpiredRecords() {
  const now = Date.now()
  const entries = Array.from(rateLimitStore.entries())
  for (const [key, value] of entries) {
    if (now > value.resetTime) {
      rateLimitStore.delete(key)
    }
  }
}

/**
 * Rate limiting simples (versão compacta para uso em APIs)
 * @param key - Identificador único (IP, user ID, etc)
 * @param limit - Número máximo de requisições
 * @param windowMs - Janela de tempo em milissegundos
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number
): { allowed: boolean; remaining: number; reset: number } {
  cleanupExpiredRecords()

  const now = Date.now()
  let record = rateLimitStore.get(key)

  if (!record) {
    record = { count: 0, resetTime: now + windowMs }
    rateLimitStore.set(key, record)
  }

  if (record.count < limit) {
    record.count++
    return { allowed: true, remaining: limit - record.count, reset: record.resetTime }
  } else {
    return { allowed: false, remaining: 0, reset: record.resetTime }
  }
}

/**
 * Middleware helper para rate limiting
 */
export function withRateLimit(
  handler: (req: NextRequest) => Promise<NextResponse>,
  options?: RateLimitOptions
) {
  return async (req: NextRequest) => {
    // Usar IP como identificador (em produção, considere X-Forwarded-For)
    const ip = req.ip || req.headers.get("x-forwarded-for") || "unknown"
    
    const rateLimit = checkRateLimit(ip, options)

    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000)
      return NextResponse.json(
        { 
          error: "Muitas tentativas. Tente novamente mais tarde.",
          retryAfter 
        },
        { 
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
            "X-RateLimit-Limit": options?.maxRequests?.toString() || "10",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": new Date(rateLimit.resetTime).toISOString(),
          }
        }
      )
    }

    const response = await handler(req)
    
    // Adicionar headers de rate limit
    response.headers.set("X-RateLimit-Limit", options?.maxRequests?.toString() || "10")
    response.headers.set("X-RateLimit-Remaining", rateLimit.remaining.toString())
    response.headers.set("X-RateLimit-Reset", new Date(rateLimit.resetTime).toISOString())

    return response
  }
}

/**
 * Sanitizar nome de arquivo para upload
 */
export function sanitizeFileName(fileName: string): string {
  return fileName
    .replace(/[^a-zA-Z0-9.-]/g, "_") // Substitui caracteres especiais
    .replace(/\.{2,}/g, ".") // Remove múltiplos pontos consecutivos
    .slice(0, 255) // Limita tamanho do nome
}

/**
 * Validar magic bytes de arquivo (primeiros bytes que identificam o tipo)
 * Previne bypass de validação alterando apenas a extensão
 */
export async function validateFileMagicBytes(
  buffer: ArrayBuffer,
  expectedType: string
): Promise<boolean> {
  const bytes = new Uint8Array(buffer).slice(0, 12)
  
  const signatures: Record<string, number[][]> = {
    "image/jpeg": [[0xFF, 0xD8, 0xFF]],
    "image/png": [[0x89, 0x50, 0x4E, 0x47]],
    "image/gif": [[0x47, 0x49, 0x46, 0x38]],
    "image/webp": [[0x52, 0x49, 0x46, 0x46]], // Começa com RIFF
    "application/pdf": [[0x25, 0x50, 0x44, 0x46]], // %PDF
  }

  const expectedSignatures = signatures[expectedType]
  if (!expectedSignatures) {
    // Tipo não tem validação de magic bytes, aceitar
    return true
  }

  return expectedSignatures.some(signature => 
    signature.every((byte, index) => bytes[index] === byte)
  )
}

/**
 * Headers de segurança para Next.js
 */
export const securityHeaders = [
  {
    key: "X-DNS-Prefetch-Control",
    value: "on"
  },
  {
    key: "Strict-Transport-Security",
    value: "max-age=31536000; includeSubDomains"
  },
  {
    key: "X-Frame-Options",
    value: "SAMEORIGIN"
  },
  {
    key: "X-Content-Type-Options",
    value: "nosniff"
  },
  {
    key: "X-XSS-Protection",
    value: "1; mode=block"
  },
  {
    key: "Referrer-Policy",
    value: "strict-origin-when-cross-origin"
  },
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=()"
  }
]

