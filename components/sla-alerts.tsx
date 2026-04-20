"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Bell, AlertTriangle, Clock, ExternalLink } from "lucide-react"
import { cn } from "@/lib/utils"

interface Alerta {
  id: number
  numero: string
  status: string
  impacto: string
  link: string
  operadora: string
  horasAberto: number
  slaHoras: number
  horasRestantes: number
  percentualSLA: number
  estourado: boolean
  criticidade: string
}

interface AlertasResponse {
  total: number
  estourados: number
  emAtencao: number
  alertas: Alerta[]
}

export function SLAAlerts() {
  const [alertas, setAlertas] = useState<AlertasResponse | null>(null)
  const [open, setOpen] = useState(false)

  const fetchAlertas = async () => {
    try {
      const res = await fetch("/api/chamados/alertas")
      if (res.ok) {
        setAlertas(await res.json())
      }
    } catch (error) {
      console.error("Erro ao buscar alertas:", error)
    }
  }

  useEffect(() => {
    fetchAlertas()
    // Atualizar a cada 5 minutos
    const interval = setInterval(fetchAlertas, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [])

  const total = alertas?.total || 0
  const estourados = alertas?.estourados || 0

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {total > 0 && (
            <span
              className={cn(
                "absolute -top-1 -right-1 h-5 w-5 rounded-full text-xs flex items-center justify-center text-white font-bold",
                estourados > 0 ? "bg-red-500 animate-pulse" : "bg-orange-500"
              )}
            >
              {total > 9 ? "9+" : total}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-96 p-0" align="end">
        <div className="p-4 border-b">
          <h3 className="font-semibold flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-orange-500" />
            Alertas de SLA
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            {total === 0
              ? "Nenhum chamado em risco"
              : `${total} chamado(s) precisam de atenção`}
          </p>
        </div>

        <ScrollArea className="max-h-[400px]">
          {alertas?.alertas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">
              <Clock className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>Todos os chamados estão dentro do SLA</p>
            </div>
          ) : (
            <div className="divide-y">
              {alertas?.alertas.map((alerta) => (
                <Link
                  key={alerta.id}
                  href={`/chamados/${alerta.id}`}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "flex items-start gap-3 p-4 hover:bg-muted/50 transition-colors",
                    alerta.estourado && "bg-red-500/5"
                  )}
                >
                  <div
                    className={cn(
                      "mt-1 h-2 w-2 rounded-full shrink-0",
                      alerta.estourado
                        ? "bg-red-500 animate-pulse"
                        : alerta.criticidade === "critico"
                        ? "bg-orange-500"
                        : "bg-yellow-500"
                    )}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono font-medium text-sm">
                        {alerta.numero}
                      </span>
                      <Badge
                        variant={alerta.estourado ? "destructive" : "warning"}
                        className="text-xs"
                      >
                        {alerta.estourado
                          ? "SLA Estourado"
                          : `${alerta.percentualSLA}% do SLA`}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate mt-1">
                      {alerta.link} • {alerta.operadora}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />
                      {alerta.estourado ? (
                        <span className="text-red-500 font-medium">
                          Excedeu {Math.abs(alerta.horasRestantes)}h
                        </span>
                      ) : (
                        <span>
                          {alerta.horasRestantes}h restantes de {alerta.slaHoras}h
                        </span>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground shrink-0 mt-1" />
                </Link>
              ))}
            </div>
          )}
        </ScrollArea>

        {total > 0 && (
          <div className="p-3 border-t bg-muted/30">
            <Link href="/chamados?filtro=sla" onClick={() => setOpen(false)}>
              <Button variant="outline" size="sm" className="w-full">
                Ver todos os alertas
              </Button>
            </Link>
          </div>
        )}
      </PopoverContent>
    </Popover>
  )
}


