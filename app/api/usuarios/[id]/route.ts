import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import bcrypt from "bcryptjs"

// GET - Obter usuário por ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuarioLogado = await getUsuarioLogado()
    
    if (!usuarioLogado) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (usuarioLogado.perfil !== "supervisor") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const id = parseInt(params.id)

    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
        _count: {
          select: {
            chamadosAbertos: true,
            chamadosFechados: true,
          },
        },
      },
    })

    if (!usuario) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json(usuario)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar usuário" }, { status: 500 })
  }
}

// PUT - Atualizar usuário
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuarioLogado = await getUsuarioLogado()
    
    if (!usuarioLogado) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (usuarioLogado.perfil !== "supervisor") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const id = parseInt(params.id)
    const body = await request.json()
    const { nome, email, senha, perfil, ativo } = body

    // Verificar se usuário existe
    const usuarioExistente = await prisma.usuario.findUnique({
      where: { id },
    })

    if (!usuarioExistente) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    // Verificar se email já está em uso por outro usuário
    if (email && email !== usuarioExistente.email) {
      const emailEmUso = await prisma.usuario.findUnique({
        where: { email },
      })

      if (emailEmUso) {
        return NextResponse.json(
          { error: "Este email já está em uso" },
          { status: 400 }
        )
      }
    }

    // Preparar dados para atualização
    const dadosAtualizacao: any = {}
    
    if (nome !== undefined) dadosAtualizacao.nome = nome
    if (email !== undefined) dadosAtualizacao.email = email
    if (perfil !== undefined) dadosAtualizacao.perfil = perfil
    if (ativo !== undefined) dadosAtualizacao.ativo = ativo
    
    // Se senha foi fornecida, fazer hash
    if (senha) {
      dadosAtualizacao.senhaHash = await bcrypt.hash(senha, 10)
    }

    const usuario = await prisma.usuario.update({
      where: { id },
      data: dadosAtualizacao,
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
      },
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao atualizar usuário" }, { status: 500 })
  }
}

// DELETE - Desativar ou excluir usuário
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const usuarioLogado = await getUsuarioLogado()
    
    if (!usuarioLogado) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (usuarioLogado.perfil !== "supervisor") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const id = parseInt(params.id)

    // Não permitir excluir a si mesmo
    if (id === usuarioLogado.userId) {
      return NextResponse.json(
        { error: "Você não pode excluir sua própria conta" },
        { status: 400 }
      )
    }

    // Verificar se o usuário tem chamados criados
    const usuarioComChamados = await prisma.usuario.findUnique({
      where: { id },
      select: {
        id: true,
        nome: true,
        _count: {
          select: {
            chamadosAbertos: true,
            chamadosFechados: true,
            historicos: true,
          },
        },
      },
    })

    if (!usuarioComChamados) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const totalChamados = 
      usuarioComChamados._count.chamadosAbertos + 
      usuarioComChamados._count.chamadosFechados +
      usuarioComChamados._count.historicos

    // Se não tem chamados, pode excluir permanentemente
    if (totalChamados === 0) {
      await prisma.usuario.delete({
        where: { id },
      })
      return NextResponse.json({ 
        message: "Usuário excluído permanentemente",
        deleted: true,
      })
    }

    // Se tem chamados, apenas desativa (soft delete)
    const usuario = await prisma.usuario.update({
      where: { id },
      data: { ativo: false },
      select: {
        id: true,
        nome: true,
        email: true,
        ativo: true,
      },
    })

    return NextResponse.json({ 
      ...usuario,
      message: "Usuário desativado (possui chamados vinculados)",
      deleted: false,
    })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao excluir/desativar usuário" }, { status: 500 })
  }
}


