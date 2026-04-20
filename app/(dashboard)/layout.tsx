import { redirect } from "next/navigation"
import { getUsuarioLogado } from "@/lib/auth"
import { Sidebar } from "@/components/layout/sidebar"
import { Header } from "@/components/layout/header"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const usuario = await getUsuarioLogado()

  if (!usuario) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen bg-background">
      <Sidebar usuario={usuario} />
      <div className="lg:pl-64">
        <Header usuario={usuario} />
        <main className="p-4 lg:p-6">{children}</main>
      </div>
    </div>
  )
}

