import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db"
import { getUsuarioLogado } from "@/lib/auth"
import bcrypt from "bcryptjs"

// GET - Listar usuários (apenas supervisores)
export async function GET(request: NextRequest) {
  try {
    const usuarioLogado = await getUsuarioLogado()
    
    if (!usuarioLogado) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (usuarioLogado.perfil !== "supervisor") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const busca = searchParams.get("busca") || ""
    const mostrarInativos = searchParams.get("inativos") === "true"

    const usuarios = await prisma.usuario.findMany({
      where: {
        ativo: mostrarInativos ? false : true,
        OR: busca ? [
          { nome: { contains: busca, mode: "insensitive" } },
          { email: { contains: busca, mode: "insensitive" } },
        ] : undefined,
      },
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
      orderBy: { nome: "asc" },
    })

    // Mapear perfil para role no retorno (compatibilidade com frontend)
    const usuariosFormatados = usuarios.map(u => ({
      ...u,
      role: u.perfil,
    }))

    return NextResponse.json(usuariosFormatados)
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao buscar usuários" }, { status: 500 })
  }
}

// POST - Criar usuário (apenas supervisores)
export async function POST(request: NextRequest) {
  try {
    const usuarioLogado = await getUsuarioLogado()
    
    if (!usuarioLogado) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (usuarioLogado.perfil !== "supervisor") {
      return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
    }

    const body = await request.json()
    const { nome, email, senha, role } = body

    if (!nome || !email || !senha) {
      return NextResponse.json(
        { error: "Nome, email e senha são obrigatórios" },
        { status: 400 }
      )
    }

    // Verificar se email já existe
    const existente = await prisma.usuario.findUnique({
      where: { email },
    })

    if (existente) {
      return NextResponse.json(
        { error: "Este email já está em uso" },
        { status: 400 }
      )
    }

    // Hash da senha
    const senhaHash = await bcrypt.hash(senha, 10)

    const usuario = await prisma.usuario.create({
      data: {
        nome,
        email,
        senhaHash,
        perfil: role || "operador",
      },
      select: {
        id: true,
        nome: true,
        email: true,
        perfil: true,
        ativo: true,
        criadoEm: true,
      },
    })

    return NextResponse.json({ ...usuario, role: usuario.perfil }, { status: 201 })
  } catch (error) {
    console.error(error)
    return NextResponse.json({ error: "Erro ao criar usuário" }, { status: 500 })
  }
}
