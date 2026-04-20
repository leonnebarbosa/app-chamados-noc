import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import { unlink } from "fs/promises"
import { join } from "path"

// DELETE - Excluir anexo
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; anexoId: string } }
) {
  try {
    const usuarioLogado = await getUsuarioLogado()
    
    if (!usuarioLogado) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const chamadoId = parseInt(params.id)
    const anexoId = parseInt(params.anexoId)

    // Buscar anexo
    const anexo = await prisma.chamadoAnexo.findFirst({
      where: {
        id: anexoId,
        chamadoId,
      },
    })

    if (!anexo) {
      return NextResponse.json({ error: "Anexo não encontrado" }, { status: 404 })
    }

    // Tentar excluir arquivo físico
    try {
      const filePath = join(process.cwd(), "public", anexo.caminhoArquivo)
      await unlink(filePath)
    } catch (e) {
      console.error("Erro ao excluir arquivo físico:", e)
    }

    // Excluir do banco
    await prisma.chamadoAnexo.delete({
      where: { id: anexoId },
    })

    // Registrar no histórico
    await prisma.chamadoHistorico.create({
      data: {
        chamadoId,
        usuarioId: usuarioLogado.userId,
        tipoAcao: "atualizacao",
        descricao: `Removeu anexo: ${anexo.nomeArquivo}`,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir anexo" }, { status: 500 })
  }
}
