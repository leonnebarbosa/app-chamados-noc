import { NextResponse } from "next/server"
import { getUsuarioLogado } from "@/lib/auth"

export async function GET() {
  const usuario = await getUsuarioLogado()
  
  if (!usuario) {
    return NextResponse.json(
      { error: "Não autenticado" },
      { status: 401 }
    )
  }

  return NextResponse.json(usuario)
}

