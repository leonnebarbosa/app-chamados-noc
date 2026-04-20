import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import bcrypt from "bcryptjs"

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuario = await getUsuarioLogado()
    if (!usuario) {
      return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
    }

    const userId = parseInt(params.id)
    
    // Usuário só pode trocar sua própria senha
    if (usuario.userId !== userId) {
      return NextResponse.json(
        { error: "Você só pode alterar sua própria senha" },
        { status: 403 }
      )
    }

    const { senhaAtual, novaSenha } = await req.json()

    if (!senhaAtual || !novaSenha) {
      return NextResponse.json(
        { error: "Senha atual e nova senha são obrigatórias" },
        { status: 400 }
      )
    }

    if (novaSenha.length < 6) {
      return NextResponse.json(
        { error: "A nova senha deve ter no mínimo 6 caracteres" },
        { status: 400 }
      )
    }

    // Buscar usuário
    const usuarioDB = await prisma.usuario.findUnique({
      where: { id: userId },
      select: { senhaHash: true },
    })

    if (!usuarioDB) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Verificar senha atual
    const senhaCorreta = await bcrypt.compare(senhaAtual, usuarioDB.senhaHash)
    if (!senhaCorreta) {
      return NextResponse.json(
        { error: "Senha atual incorreta" },
        { status: 400 }
      )
    }

    // Hash da nova senha
    const novaSenhaHash = await bcrypt.hash(novaSenha, 10)

    // Atualizar senha
    await prisma.usuario.update({
      where: { id: userId },
      data: { senhaHash: novaSenhaHash },
    })

    return NextResponse.json({ message: "Senha alterada com sucesso" })
  } catch (error) {
    console.error("Erro ao trocar senha:", error)
    return NextResponse.json(
      { error: "Erro ao trocar senha" },
      { status: 500 }
    )
  }
}

