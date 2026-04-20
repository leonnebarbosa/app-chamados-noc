import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"
import { formatDistanceToNow, format } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatRelativeTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return formatDistanceToNow(d, { addSuffix: true, locale: ptBR })
}

export function formatDateTime(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "dd/MM/yyyy HH:mm", { locale: ptBR })
}

export function formatDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date
  return format(d, "dd/MM/yyyy", { locale: ptBR })
}

export function gerarNumeroChamado(): string {
  const ano = new Date().getFullYear()
  const random = Math.floor(Math.random() * 10000).toString().padStart(4, "0")
  return `INC-${ano}-${random}`
}

export function getImpactoColor(impacto: string): string {
  const colors: Record<string, string> = {
    critico: "bg-red-500 text-white",
    alto: "bg-orange-500 text-white",
    medio: "bg-yellow-500 text-black",
    baixo: "bg-green-500 text-white",
  }
  return colors[impacto] || "bg-gray-500 text-white"
}

export function getImpactoBadgeVariant(impacto: string): "destructive" | "warning" | "default" | "secondary" {
  const variants: Record<string, "destructive" | "warning" | "default" | "secondary"> = {
    critico: "destructive",
    alto: "warning",
    medio: "default",
    baixo: "secondary",
  }
  return variants[impacto] || "default"
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    aberto: "bg-blue-500 text-white",
    em_andamento: "bg-purple-500 text-white",
    aguardando_operadora: "bg-yellow-500 text-black",
    resolvido: "bg-green-500 text-white",
    fechado: "bg-gray-500 text-white",
  }
  return colors[status] || "bg-gray-500 text-white"
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    aberto: "Aberto",
    em_andamento: "Em Andamento",
    aguardando_operadora: "Aguardando Operadora",
    resolvido: "Resolvido",
    fechado: "Fechado",
  }
  return labels[status] || status
}

export function getImpactoLabel(impacto: string): string {
  const labels: Record<string, string> = {
    critico: "Crítico",
    alto: "Alto",
    medio: "Médio",
    baixo: "Baixo",
  }
  return labels[impacto] || impacto
}

export function calcularTempoAberto(dataAbertura: Date | string): string {
  const abertura = typeof dataAbertura === "string" ? new Date(dataAbertura) : dataAbertura
  const agora = new Date()
  const diffMs = agora.getTime() - abertura.getTime()
  
  const horas = Math.floor(diffMs / (1000 * 60 * 60))
  const minutos = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60))
  
  if (horas > 24) {
    const dias = Math.floor(horas / 24)
    return `${dias}d ${horas % 24}h`
  }
  
  return `${horas}h${minutos.toString().padStart(2, "0")}m`
}

