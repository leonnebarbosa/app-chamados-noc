"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { JWTPayload } from "@/lib/auth"
import {
  LayoutDashboard,
  Ticket,
  Plus,
  Network,
  Building2,
  MapPin,
  Users,
  BarChart3,
  Settings,
  Cable,
  Webhook,
} from "lucide-react"

interface SidebarProps {
  usuario: JWTPayload
}

interface MenuItem {
  label: string
  href: string
  icon: typeof LayoutDashboard
  supervisorOnly?: boolean
}

interface MenuSection {
  title: string
  items: MenuItem[]
}

const menuItems: MenuSection[] = [
  {
    title: "Principal",
    items: [
      { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
      { label: "Chamados", href: "/chamados", icon: Ticket },
      { label: "Novo Chamado", href: "/chamados/novo", icon: Plus },
    ],
  },
  {
    title: "Cadastros",
    items: [
      { label: "Links", href: "/links", icon: Network },
      { label: "Transportes", href: "/transportes", icon: Cable },
      { label: "Operadoras", href: "/operadoras", icon: Building2 },
      { label: "POPs", href: "/pops", icon: MapPin },
    ],
  },
  {
    title: "Administração",
    items: [
      { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
      { label: "Usuários", href: "/usuarios", icon: Users, supervisorOnly: true },
      { label: "Webhooks", href: "/webhooks", icon: Webhook, supervisorOnly: true },
      { label: "Configurações", href: "/configuracoes", icon: Settings, supervisorOnly: true },
    ],
  },
]

export function Sidebar({ usuario }: SidebarProps) {
  const pathname = usePathname()

  return (
    <aside className="hidden lg:fixed lg:inset-y-0 lg:flex lg:w-64 lg:flex-col">
      <div className="flex grow flex-col gap-y-5 overflow-y-auto border-r border-border bg-card px-6 pb-4">
        {/* Logo */}
        <div className="flex h-16 shrink-0 items-center gap-3">
          <div className="w-10 h-10 bg-primary/20 rounded-xl flex items-center justify-center">
            <Network className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-foreground">NOC</h1>
            <p className="text-xs text-muted-foreground">Chamados</p>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex flex-1 flex-col">
          <ul role="list" className="flex flex-1 flex-col gap-y-7">
            {menuItems.map((section) => (
              <li key={section.title}>
                <div className="text-xs font-semibold leading-6 text-muted-foreground uppercase tracking-wider">
                  {section.title}
                </div>
                <ul role="list" className="-mx-2 mt-2 space-y-1">
                  {section.items.map((item) => {
                    // Skip supervisor-only items for operators
                    if (item.supervisorOnly && usuario.perfil !== "supervisor") {
                      return null
                    }

                    const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
                    const Icon = item.icon

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={cn(
                            "group flex gap-x-3 rounded-lg p-2 text-sm leading-6 font-medium transition-colors",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent"
                          )}
                        >
                          <Icon
                            className={cn(
                              "h-5 w-5 shrink-0",
                              isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-foreground"
                            )}
                          />
                          {item.label}
                        </Link>
                      </li>
                    )
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </aside>
  )
}

