"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@/lib/utils"
import type { JWTPayload } from "@/lib/auth"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  LayoutDashboard,
  Ticket,
  Plus,
  Network,
  Building2,
  MapPin,
  Users,
  BarChart3,
  X,
  Cable,
} from "lucide-react"
import { Button } from "@/components/ui/button"

interface MobileNavProps {
  open: boolean
  onClose: () => void
  usuario: JWTPayload
}

const menuItems = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Chamados", href: "/chamados", icon: Ticket },
  { label: "Novo Chamado", href: "/chamados/novo", icon: Plus },
  { label: "Links", href: "/links", icon: Network },
  { label: "Transportes", href: "/transportes", icon: Cable },
  { label: "Operadoras", href: "/operadoras", icon: Building2 },
  { label: "POPs", href: "/pops", icon: MapPin },
  { label: "Relatórios", href: "/relatorios", icon: BarChart3 },
  { label: "Usuários", href: "/usuarios", icon: Users, supervisorOnly: true },
]

export function MobileNav({ open, onClose, usuario }: MobileNavProps) {
  const pathname = usePathname()

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[300px] p-0">
        <DialogHeader className="p-4 border-b">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary/20 rounded-lg flex items-center justify-center">
                <Network className="w-4 h-4 text-primary" />
              </div>
              <DialogTitle className="text-lg font-bold">NOC Chamados</DialogTitle>
            </div>
          </div>
        </DialogHeader>
        <nav className="p-4">
          <ul className="space-y-1">
            {menuItems.map((item) => {
              if (item.supervisorOnly && usuario.perfil !== "supervisor") {
                return null
              }

              const isActive = pathname === item.href || pathname.startsWith(item.href + "/")
              const Icon = item.icon

              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
                      isActive
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:text-foreground hover:bg-accent"
                    )}
                  >
                    <Icon className="h-5 w-5" />
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>
      </DialogContent>
    </Dialog>
  )
}

