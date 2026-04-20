import { redirect } from "next/navigation"
import { getUsuarioLogado } from "@/lib/auth"

export default async function HomePage() {
  const usuario = await getUsuarioLogado()

  if (usuario) {
    redirect("/dashboard")
  } else {
    redirect("/login")
  }
}

