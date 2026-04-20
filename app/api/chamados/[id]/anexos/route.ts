import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import { writeFile, mkdir } from "fs/promises"
import { join } from "path"
import { existsSync } from "fs"

// GET - Listar anexos de um chamado
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuarioLogado = await getUsuarioLogado()
    
    if (!usuarioLogado) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const chamadoId = parseInt(params.id)

    const anexos = await prisma.chamadoAnexo.findMany({
      where: { chamadoId },
      orderBy: { criadoEm: "desc" },
      include: {
        usuario: { select: { id: true, nome: true } },
      },
    })

    // Transformar para formato esperado pelo frontend
    const anexosFormatados = anexos.map(a => ({
      id: a.id,
      nome: a.nomeArquivo,
      tipo: a.tipoArquivo,
      tamanho: a.tamanhoBytes,
      url: a.caminhoArquivo,
      criadoEm: a.criadoEm.toISOString(),
      usuario: a.usuario,
    }))

    return NextResponse.json(anexosFormatados)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar anexos" }, { status: 500 })
  }
}

// POST - Upload de anexo
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuarioLogado = await getUsuarioLogado()
    
    if (!usuarioLogado) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const chamadoId = parseInt(params.id)

    // Verificar se chamado existe
    const chamado = await prisma.chamado.findUnique({
      where: { id: chamadoId },
    })

    if (!chamado) {
      return NextResponse.json({ error: "Chamado não encontrado" }, { status: 404 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "Nenhum arquivo enviado" }, { status: 400 })
    }

    // Validar tamanho (máximo 10MB)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      return NextResponse.json({ error: "Arquivo muito grande. Máximo 10MB" }, { status: 400 })
    }

    // Validar extensão do arquivo (prevenir executáveis)
    const fileName = file.name.toLowerCase()
    const allowedExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.txt', '.csv', '.doc', '.docx', '.xls', '.xlsx']
    const hasValidExtension = allowedExtensions.some(ext => fileName.endsWith(ext))
    
    if (!hasValidExtension) {
      return NextResponse.json({ error: "Extensão de arquivo não permitida" }, { status: 400 })
    }

    // Bloquear extensões perigosas explicitamente
    const dangerousExtensions = ['.exe', '.bat', '.cmd', '.sh', '.ps1', '.vbs', '.jar', '.scr', '.com', '.pif']
    const hasDangerousExtension = dangerousExtensions.some(ext => fileName.endsWith(ext))
    
    if (hasDangerousExtension) {
      return NextResponse.json({ error: "Tipo de arquivo não permitido por motivos de segurança" }, { status: 400 })
    }

    // Validar MIME type
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/gif",
      "image/webp",
      "application/pdf",
      "text/plain",
      "text/csv",
      "application/msword",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ]

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ error: "Tipo de arquivo não permitido" }, { status: 400 })
    }

    // Criar diretório de uploads se não existir
    const uploadsDir = join(process.cwd(), "public", "uploads", "chamados", String(chamadoId))
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }

    // Gerar nome único e seguro para o arquivo (UUID + extensão original)
    const fileExtension = file.name.substring(file.name.lastIndexOf('.')).toLowerCase()
    const randomName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}${fileExtension}`
    const filePath = join(uploadsDir, randomName)

    // Salvar arquivo
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    await writeFile(filePath, buffer)

    // Caminho relativo para acesso via URL
    const url = `/uploads/chamados/${chamadoId}/${randomName}`

    // Salvar no banco
    const anexo = await prisma.chamadoAnexo.create({
      data: {
        chamadoId,
        usuarioId: usuarioLogado.userId,
        nomeArquivo: file.name,
        tipoArquivo: file.type,
        tamanhoBytes: file.size,
        caminhoArquivo: url,
      },
    })

    // Registrar no histórico
    await prisma.chamadoHistorico.create({
      data: {
        chamadoId,
        usuarioId: usuarioLogado.userId,
        tipoAcao: "atualizacao",
        descricao: `Anexou arquivo: ${file.name}`,
      },
    })

    // Retornar no formato esperado pelo frontend
    return NextResponse.json({
      id: anexo.id,
      nome: anexo.nomeArquivo,
      tipo: anexo.tipoArquivo,
      tamanho: anexo.tamanhoBytes,
      url: anexo.caminhoArquivo,
      criadoEm: anexo.criadoEm.toISOString(),
    }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao fazer upload" }, { status: 500 })
  }
}
