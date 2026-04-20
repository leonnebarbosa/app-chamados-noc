"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useToast } from "@/components/ui/use-toast"
import { 
  ArrowLeft, 
  Loader2, 
  Cable,
  MapPin,
  Network,
  AlertTriangle,
  Building2,
  Clock,
  Plus
} from "lucide-react"
import { 
  getStatusLabel, 
  getImpactoLabel, 
  calcularTempoAberto, 
  formatDateTime 
} from "@/lib/utils"

interface LinkData {
  id: number
  designador: string
  tipoServico: string | null
  capacidade: string | null
  cliente: string | null
  operadora: { id: number; nome: string } | null
  pop: { cidade: string; estado: string } | null
}

interface ChamadoData {
  id: number
  numero: string
  status: string
  impacto: string
  descricaoProblema: string
  dataAbertura: string
  tipoFalha: { nome: string } | null
  abertoPor: { nome: string } | null
}

interface Transporte {
  id: number
  nome: string
  fornecedor: string
  origem: string
  destino: string
  capacidade: string | null
  tecnologia: string | null
  observacoes: string | null
  ativo: boolean
  links: LinkData[]
  chamados: ChamadoData[]
  _count: {
    links: number
    chamados: number
  }
}

export default function TransporteDetalhesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [transporte, setTransporte] = useState<Transporte | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTransporte()
  }, [params.id])

  const fetchTransporte = async () => {
    try {
      const res = await fetch(`/api/transportes/${params.id}`)
      if (!res.ok) throw new Error("Transporte não encontrado")
      const data = await res.json()
      setTransporte(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Transporte não encontrado",
        variant: "destructive",
      })
      router.push("/transportes")
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!transporte) return null

  const temChamadosAbertos = transporte._count.chamados > 0

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/transportes">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <Cable className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold tracking-tight">{transporte.nome}</h1>
            {temChamadosAbertos && (
              <Badge variant="destructive" className="animate-pulse-slow">
                <AlertTriangle className="h-3 w-3 mr-1" />
                {transporte._count.chamados} incidente(s)
              </Badge>
            )}
            <Badge variant={transporte.ativo ? "default" : "secondary"}>
              {transporte.ativo ? "Ativo" : "Arquivado"}
            </Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2 mt-1">
            <MapPin className="h-4 w-4" />
            {transporte.origem} → {transporte.destino}
          </p>
        </div>
        <Button asChild>
          <Link href={`/chamados/novo?tipo=transporte&transporteId=${transporte.id}`}>
            <Plus className="mr-2 h-4 w-4" />
            Abrir Chamado
          </Link>
        </Button>
      </div>

      {/* Alerta de incidente */}
      {temChamadosAbertos && (
        <Card className="border-destructive bg-destructive/10">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Incidente(s) em Andamento
            </CardTitle>
            <CardDescription>
              Este transporte possui chamados abertos. Os {transporte._count.links} links vinculados podem estar afetados.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transporte.chamados.map((chamado) => (
                <Link
                  key={chamado.id}
                  href={`/chamados/${chamado.id}`}
                  className="block p-3 rounded-lg border bg-background hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <Badge
                      variant={
                        chamado.impacto === "critico" ? "critical" :
                        chamado.impacto === "alto" ? "high" :
                        chamado.impacto === "medio" ? "medium" : "low"
                      }
                    >
                      {getImpactoLabel(chamado.impacto)}
                    </Badge>
                    <span className="font-mono font-semibold text-primary">{chamado.numero}</span>
                    <Badge variant="outline">{getStatusLabel(chamado.status)}</Badge>
                    <span className="text-sm text-muted-foreground ml-auto flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      {calcularTempoAberto(chamado.dataAbertura)}
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1 line-clamp-1">
                    {chamado.tipoFalha?.nome}: {chamado.descricaoProblema}
                  </p>
                </Link>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle>Informações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div>
              <span className="text-muted-foreground">Fornecedor</span>
              <p className="font-medium">{transporte.fornecedor}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Rota</span>
              <p className="font-medium">{transporte.origem} → {transporte.destino}</p>
            </div>
            {transporte.tecnologia && (
              <div>
                <span className="text-muted-foreground">Tecnologia</span>
                <p className="font-medium">{transporte.tecnologia}</p>
              </div>
            )}
            {transporte.capacidade && (
              <div>
                <span className="text-muted-foreground">Capacidade</span>
                <p className="font-medium">{transporte.capacidade}</p>
              </div>
            )}
            {transporte.observacoes && (
              <div>
                <span className="text-muted-foreground">Observações</span>
                <p>{transporte.observacoes}</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Links vinculados */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5" />
              Links Vinculados ({transporte._count.links})
            </CardTitle>
            <CardDescription>
              Circuitos que passam por este transporte
            </CardDescription>
          </CardHeader>
          <CardContent>
            {transporte.links.length === 0 ? (
              <div className="text-center py-8">
                <Network className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <h3 className="mt-4 text-lg font-semibold">Nenhum link vinculado</h3>
                <p className="text-muted-foreground">
                  Vincule links a este transporte na página de cadastro de links
                </p>
                <Button asChild className="mt-4">
                  <Link href="/links">Ir para Links</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-2">
                {transporte.links.map((link) => (
                  <div
                    key={link.id}
                    className={`flex items-center justify-between p-3 rounded-lg border ${temChamadosAbertos ? 'bg-destructive/5 border-destructive/30' : 'bg-card/50'}`}
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold">{link.designador}</span>
                        {temChamadosAbertos && (
                          <Badge variant="destructive" className="text-xs">
                            Afetado
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {link.operadora?.nome} • {link.pop?.cidade}/{link.pop?.estado}
                        {link.tipoServico && ` • ${link.tipoServico}`}
                      </p>
                      {link.cliente && (
                        <p className="text-xs text-muted-foreground">Cliente: {link.cliente}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">{link.operadora?.nome}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

