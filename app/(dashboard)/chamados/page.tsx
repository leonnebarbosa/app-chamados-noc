"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { 
  Plus, 
  Search, 
  Clock, 
  Filter,
  Loader2,
  Ticket
} from "lucide-react"
import { 
  getStatusLabel, 
  getImpactoLabel, 
  calcularTempoAberto,
  formatDateTime 
} from "@/lib/utils"

interface Chamado {
  id: number
  numero: string
  status: string
  impacto: string
  descricaoProblema: string
  dataDeteccao: string
  dataAbertura: string
  dataNormalizacao: string | null
  protocoloOperadora: string | null
  link: {
    designador: string
    operadora: { nome: string } | null
    pop: { cidade: string; estado: string } | null
  } | null
  transporte: {
    nome: string
  } | null
  tipoFalha: { nome: string } | null
  abertoPor: { nome: string } | null
}

export default function ChamadosPage() {
  const [chamados, setChamados] = useState<Chamado[]>([])
  const [loading, setLoading] = useState(true)
  const [busca, setBusca] = useState("")
  const [filtroStatus, setFiltroStatus] = useState("todos")
  const [filtroImpacto, setFiltroImpacto] = useState("todos")

  useEffect(() => {
    fetchChamados()
  }, [filtroStatus, filtroImpacto])

  const fetchChamados = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroStatus !== "todos") params.set("status", filtroStatus)
      if (filtroImpacto !== "todos") params.set("impacto", filtroImpacto)
      
      const res = await fetch(`/api/chamados?${params}`)
      const data = await res.json()
      setChamados(data)
    } catch (error) {
      console.error("Erro ao carregar chamados:", error)
    } finally {
      setLoading(false)
    }
  }

  const chamadosFiltrados = chamados.filter((c) => {
    if (!busca) return true
    
    // Separa os termos por espaço e faz AND entre eles
    const termos = busca.toLowerCase().split(/\s+/).filter(t => t.length > 0)
    
    // Função para verificar se um termo está em algum campo
    const contemTermo = (termo: string) => {
      return (
        c.numero.toLowerCase().includes(termo) ||
        c.link?.designador?.toLowerCase().includes(termo) ||
        c.link?.operadora?.nome?.toLowerCase().includes(termo) ||
        c.link?.pop?.cidade?.toLowerCase().includes(termo) ||
        c.protocoloOperadora?.toLowerCase().includes(termo) ||
        c.descricaoProblema?.toLowerCase().includes(termo) ||
        c.transporte?.nome?.toLowerCase().includes(termo)
      )
    }
    
    // Todos os termos devem estar presentes (AND)
    return termos.every(termo => contemTermo(termo))
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Chamados</h1>
          <p className="text-muted-foreground">
            Gerencie todos os chamados de incidentes
          </p>
        </div>
        <Button asChild>
          <Link href="/chamados/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Chamado
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por múltiplos termos (ex: vivo santarem)"
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <div className="flex gap-2">
              <Select value={filtroStatus} onValueChange={setFiltroStatus}>
                <SelectTrigger className="w-[180px]">
                  <Filter className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos os Status</SelectItem>
                  <SelectItem value="aberto">Aberto</SelectItem>
                  <SelectItem value="em_andamento">Em Andamento</SelectItem>
                  <SelectItem value="aguardando_operadora">Aguardando Operadora</SelectItem>
                  <SelectItem value="resolvido">Resolvido</SelectItem>
                  <SelectItem value="fechado">Fechado</SelectItem>
                </SelectContent>
              </Select>

              <Select value={filtroImpacto} onValueChange={setFiltroImpacto}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Impacto" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todos">Todos</SelectItem>
                  <SelectItem value="critico">Crítico</SelectItem>
                  <SelectItem value="alto">Alto</SelectItem>
                  <SelectItem value="medio">Médio</SelectItem>
                  <SelectItem value="baixo">Baixo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5" />
            {chamadosFiltrados.length} chamado(s) encontrado(s)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : chamadosFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Ticket className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum chamado encontrado</h3>
              <p className="text-muted-foreground">
                Tente ajustar os filtros ou criar um novo chamado.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {chamadosFiltrados.map((chamado) => (
                <Link
                  key={chamado.id}
                  href={`/chamados/${chamado.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                    {/* Impacto */}
                    <div className="hidden sm:block">
                      <Badge
                        variant={
                          chamado.impacto === "critico" ? "impacto-critico" :
                          chamado.impacto === "alto" ? "impacto-alto" :
                          chamado.impacto === "medio" ? "impacto-medio" : "impacto-baixo"
                        }
                        className="w-20 justify-center"
                      >
                        {getImpactoLabel(chamado.impacto)}
                      </Badge>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      {/* Link/Transporte com destaque */}
                      <div className="flex items-center gap-2 mb-1">
                        {chamado.transporte ? (
                          <>
                            <Badge variant="secondary" className="text-xs">Transporte</Badge>
                            <span className="font-bold text-base text-foreground">
                              {chamado.transporte.nome}
                            </span>
                          </>
                        ) : chamado.link ? (
                          <>
                            <span className="font-bold text-base text-foreground">
                              {chamado.link.designador}
                            </span>
                            {chamado.link.operadora?.nome && (
                              <span className="text-sm text-muted-foreground">
                                • {chamado.link.operadora.nome}
                              </span>
                            )}
                          </>
                        ) : (
                          <span className="font-bold text-base text-muted-foreground">
                            Sem link ou transporte
                          </span>
                        )}
                      </div>
                      
                      {/* Protocolo e Status */}
                      <div className="flex flex-wrap items-center gap-2">
                        {chamado.protocoloOperadora ? (
                          <span className="font-mono text-sm font-semibold text-primary">
                            {chamado.protocoloOperadora}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            {chamado.numero}
                          </span>
                        )}
                        <Badge
                          variant={
                            chamado.status === "aberto" ? "status-aberto" :
                            chamado.status === "em_andamento" ? "status-andamento" :
                            chamado.status === "aguardando_operadora" ? "status-aguardando" :
                            chamado.status === "resolvido" ? "status-resolvido" : "status-fechado"
                          }
                        >
                          {getStatusLabel(chamado.status)}
                        </Badge>
                        <Badge
                          variant={
                            chamado.impacto === "critico" ? "impacto-critico" :
                            chamado.impacto === "alto" ? "impacto-alto" :
                            chamado.impacto === "medio" ? "impacto-medio" : "impacto-baixo"
                          }
                          className="sm:hidden"
                        >
                          {getImpactoLabel(chamado.impacto)}
                        </Badge>
                      </div>
                      
                      {/* Descrição e localização */}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {chamado.link?.pop ? (
                          <>{chamado.link.pop.cidade}/{chamado.link.pop.estado} • </>
                        ) : null}
                        {chamado.tipoFalha?.nome}: {chamado.descricaoProblema}
                      </p>
                    </div>

                    {/* Meta */}
                    <div className="text-right shrink-0 hidden md:block">
                      {/* Data de Detecção */}
                      <div className="flex items-center justify-end gap-1.5 text-muted-foreground">
                        <Clock className="h-3.5 w-3.5" />
                        <span className="text-xs">
                          {formatDateTime(chamado.dataDeteccao)}
                        </span>
                      </div>
                      
                      {/* Tempo de indisponibilidade */}
                      <div className={`flex items-center justify-end gap-1.5 mt-1 px-2 py-0.5 rounded text-xs font-medium ${
                        chamado.status === "fechado" 
                          ? "bg-green-500/10 text-green-500" 
                          : "bg-primary/10 text-primary"
                      }`}>
                        {chamado.status === "fechado" && chamado.dataNormalizacao ? (
                          <>
                            <span>
                              {(() => {
                                const inicio = new Date(chamado.dataDeteccao).getTime()
                                const fim = new Date(chamado.dataNormalizacao).getTime()
                                const diff = fim - inicio
                                const mins = Math.floor(diff / 60000)
                                const hrs = Math.floor(mins / 60)
                                const m = mins % 60
                                if (hrs > 24) {
                                  const dias = Math.floor(hrs / 24)
                                  const h = hrs % 24
                                  return `${dias}d ${h}h ${m}min`
                                }
                                return hrs > 0 ? `${hrs}h ${m}min` : `${m}min`
                              })()}
                            </span>
                          </>
                        ) : (
                          <span>{calcularTempoAberto(chamado.dataDeteccao)}</span>
                        )}
                      </div>
                      
                      <p className="text-xs text-muted-foreground mt-1">
                        {chamado.abertoPor?.nome}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

