"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { useToast } from "@/components/ui/use-toast"
import { ArrowLeft, Loader2, AlertTriangle, Network, Building2, Cable, Clock } from "lucide-react"
import Link from "next/link"
import { getTipoServicoLabel } from "@/lib/constants"

interface LinkData {
  id: number
  designador: string
  tipoServico: string | null
  capacidade: string | null
  cliente: string | null
  operadora: { id: number; nome: string } | null
  pop: { cidade: string; estado: string } | null
  transporte: { id: number; nome: string } | null
}

interface Operadora {
  id: number
  nome: string
}

interface Transporte {
  id: number
  nome: string
  fornecedor: string
  origem: string
  destino: string
  _count?: { links: number }
}

interface TipoFalha {
  id: number
  nome: string
}

export default function NovoChamadoPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [links, setLinks] = useState<LinkData[]>([])
  const [operadoras, setOperadoras] = useState<Operadora[]>([])
  const [transportes, setTransportes] = useState<Transporte[]>([])
  const [tiposFalha, setTiposFalha] = useState<TipoFalha[]>([])
  const [loadingDados, setLoadingDados] = useState(true)

  // Tipo de chamado: 'link' ou 'transporte'
  const tipoInicial = searchParams.get("tipo") || "link"
  const transporteIdInicial = searchParams.get("transporteId") || ""

  const [tipoChamado, setTipoChamado] = useState<"link" | "transporte">(tipoInicial as "link" | "transporte")

  // Form state - Link
  const [operadoraId, setOperadoraId] = useState("")
  const [linkId, setLinkId] = useState("")

  // Form state - Transporte  
  const [transporteId, setTransporteId] = useState(transporteIdInicial)

  // Form state - Comum
  const [tipoFalhaId, setTipoFalhaId] = useState("")
  const [dataDeteccao, setDataDeteccao] = useState("")
  const [impacto, setImpacto] = useState("")
  const [descricaoProblema, setDescricaoProblema] = useState("")
  const [protocoloOperadora, setProtocoloOperadora] = useState("")
  
  // Período de Impacto (opcional no cadastro)
  const [adicionarImpacto, setAdicionarImpacto] = useState(false)
  const [dataInicioImpacto, setDataInicioImpacto] = useState("")
  const [dataFimImpacto, setDataFimImpacto] = useState("")

  useEffect(() => {
    Promise.all([
      fetch("/api/links?ativo=true").then((r) => r.json()),
      fetch("/api/operadoras?ativo=true").then((r) => r.json()),
      fetch("/api/transportes?ativo=true").then((r) => r.json()),
      fetch("/api/tipos-falha").then((r) => r.json()),
    ])
      .then(([linksData, operadorasData, transportesData, tiposData]) => {
        setLinks(linksData)
        setOperadoras(operadorasData)
        setTransportes(transportesData)
        setTiposFalha(tiposData)
      })
      .catch(console.error)
      .finally(() => setLoadingDados(false))

    // Set default date to now
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setDataDeteccao(now.toISOString().slice(0, 16))
  }, [])

  // Opções para Combobox
  const operadorasOptions: ComboboxOption[] = useMemo(() => 
    operadoras.map((op) => ({
      value: op.id.toString(),
      label: op.nome,
    }))
  , [operadoras])

  // Filtra links pela operadora selecionada
  const linksFiltrados = useMemo(() => {
    if (!operadoraId) return []
    return links.filter((link) => link.operadora?.id === parseInt(operadoraId))
  }, [links, operadoraId])

  const linksOptions: ComboboxOption[] = useMemo(() => 
    linksFiltrados.map((link) => ({
      value: link.id.toString(),
      label: link.designador,
      description: `${link.pop?.cidade || ""}/${link.pop?.estado || ""} ${link.tipoServico ? `- ${getTipoServicoLabel(link.tipoServico)}` : ""}`,
    }))
  , [linksFiltrados])

  const transportesOptions: ComboboxOption[] = useMemo(() => 
    transportes.map((t) => ({
      value: t.id.toString(),
      label: t.nome,
      description: `${t.origem} → ${t.destino}`,
    }))
  , [transportes])

  const tiposFalhaOptions: ComboboxOption[] = useMemo(() => 
    tiposFalha.map((tipo) => ({
      value: tipo.id.toString(),
      label: tipo.nome,
    }))
  , [tiposFalha])

  // Links afetados pelo transporte selecionado
  const linksAfetados = useMemo(() => {
    if (!transporteId) return []
    return links.filter((link) => link.transporte?.id === parseInt(transporteId))
  }, [links, transporteId])

  // Reset link quando mudar operadora, mas auto-seleciona se houver apenas 1 link
  useEffect(() => {
    if (linksFiltrados.length === 1) {
      // Auto-seleciona o único link disponível
      setLinkId(linksFiltrados[0].id.toString())
    } else {
      // Limpa a seleção se houver mais de um link ou nenhum
      setLinkId("")
    }
  }, [operadoraId, linksFiltrados])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const body: any = {
        tipoChamado,
        tipoFalhaId: parseInt(tipoFalhaId),
        dataDeteccao,
        impacto,
        descricaoProblema,
        protocoloOperadora: protocoloOperadora || undefined,
      }

      if (tipoChamado === "link") {
        body.linkId = parseInt(linkId)
      } else {
        body.transporteId = parseInt(transporteId)
      }

      const res = await fetch("/api/chamados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || "Erro ao criar chamado")
      }

      // Se adicionou período de impacto, criar agora
      if (adicionarImpacto && dataInicioImpacto) {
        try {
          await fetch(`/api/chamados/${data.id}/periodos-impacto`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              inicio: new Date(dataInicioImpacto).toISOString(),
              fim: dataFimImpacto ? new Date(dataFimImpacto).toISOString() : null,
            }),
          })
        } catch (err) {
          console.error("Erro ao criar período de impacto:", err)
        }
      }

      toast({
        title: "Chamado criado!",
        description: `Chamado ${data.numero} aberto com sucesso.`,
        variant: "default",
      })

      router.push(`/chamados/${data.id}`)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const selectedLink = links.find((l) => l.id === parseInt(linkId))
  const selectedTransporte = transportes.find((t) => t.id === parseInt(transporteId))

  const canSubmit = tipoChamado === "link" 
    ? linkId && tipoFalhaId && impacto && descricaoProblema
    : transporteId && tipoFalhaId && impacto && descricaoProblema

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chamados">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Novo Chamado</h1>
          <p className="text-muted-foreground">
            Registre um novo incidente
          </p>
        </div>
      </div>

      {loadingDados ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          {/* Tipo de Chamado */}
          <Card className="mb-6">
            <CardHeader>
              <CardTitle>Tipo de Incidente</CardTitle>
              <CardDescription>
                Selecione se o problema é em um link específico ou em um transporte (backbone)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setTipoChamado("link")}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    tipoChamado === "link"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <Network className={`h-6 w-6 mb-2 ${tipoChamado === "link" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="font-medium">Link/Circuito</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Problema em um circuito específico de uma operadora
                  </p>
                </button>
                <button
                  type="button"
                  onClick={() => setTipoChamado("transporte")}
                  className={`p-4 rounded-lg border-2 transition-all text-left ${
                    tipoChamado === "transporte"
                      ? "border-primary bg-primary/10"
                      : "border-border hover:border-muted-foreground"
                  }`}
                >
                  <Cable className={`h-6 w-6 mb-2 ${tipoChamado === "transporte" ? "text-primary" : "text-muted-foreground"}`} />
                  <div className="font-medium">Transporte</div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Problema no backbone que afeta múltiplos links
                  </p>
                </button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {tipoChamado === "link" ? <Network className="h-5 w-5" /> : <Cable className="h-5 w-5" />}
                Informações do Incidente
              </CardTitle>
              <CardDescription>
                Preencha os dados do incidente detectado
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {tipoChamado === "link" ? (
                <>
                  {/* Operadora Selection com busca */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Building2 className="h-4 w-4" />
                      Operadora *
                    </Label>
                    <Combobox
                      options={operadorasOptions}
                      value={operadoraId}
                      onValueChange={setOperadoraId}
                      placeholder="Buscar operadora..."
                      searchPlaceholder="Digite para buscar..."
                      emptyMessage="Nenhuma operadora encontrada"
                    />
                  </div>

                  {/* Link Selection com busca */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Network className="h-4 w-4" />
                      Link/Circuito *
                    </Label>
                    <Combobox
                      options={linksOptions}
                      value={linkId}
                      onValueChange={setLinkId}
                      placeholder={
                        !operadoraId 
                          ? "Selecione a operadora primeiro" 
                          : linksFiltrados.length === 0 
                            ? "Nenhum link desta operadora" 
                            : "Buscar link..."
                      }
                      searchPlaceholder="Buscar por designador..."
                      emptyMessage="Nenhum link encontrado"
                      disabled={!operadoraId || linksFiltrados.length === 0}
                    />
                    {selectedLink && (
                      <p className="text-xs text-muted-foreground">
                        {selectedLink.tipoServico && `Tipo: ${getTipoServicoLabel(selectedLink.tipoServico)}`}
                        {selectedLink.capacidade && ` | Capacidade: ${selectedLink.capacidade}`}
                        {selectedLink.transporte && (
                          <span className="text-primary"> | Transporte: {selectedLink.transporte.nome}</span>
                        )}
                      </p>
                    )}
                  </div>
                </>
              ) : (
                <>
                  {/* Transporte Selection com busca */}
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <Cable className="h-4 w-4" />
                      Transporte *
                    </Label>
                    <Combobox
                      options={transportesOptions}
                      value={transporteId}
                      onValueChange={setTransporteId}
                      placeholder="Buscar transporte..."
                      searchPlaceholder="Buscar por nome ou rota..."
                      emptyMessage="Nenhum transporte encontrado"
                    />
                    {selectedTransporte && (
                      <p className="text-xs text-muted-foreground">
                        Fornecedor: {selectedTransporte.fornecedor} | Rota: {selectedTransporte.origem} → {selectedTransporte.destino}
                      </p>
                    )}
                  </div>

                  {/* Links afetados */}
                  {linksAfetados.length > 0 && (
                    <div className="p-4 rounded-lg border border-destructive/30 bg-destructive/5">
                      <div className="flex items-center gap-2 text-destructive font-medium mb-2">
                        <AlertTriangle className="h-4 w-4" />
                        {linksAfetados.length} link(s) serão afetados
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {linksAfetados.slice(0, 10).map((link) => (
                          <Badge key={link.id} variant="outline" className="text-xs">
                            {link.designador}
                          </Badge>
                        ))}
                        {linksAfetados.length > 10 && (
                          <Badge variant="secondary" className="text-xs">
                            +{linksAfetados.length - 10} mais
                          </Badge>
                        )}
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* Data Detection */}
              <div className="space-y-2">
                <Label htmlFor="dataDeteccao">Data/Hora da Detecção *</Label>
                <Input
                  id="dataDeteccao"
                  type="datetime-local"
                  value={dataDeteccao}
                  onChange={(e) => setDataDeteccao(e.target.value)}
                  required
                />
              </div>

              {/* Tipo de Falha com busca */}
              <div className="space-y-2">
                <Label htmlFor="tipoFalha">Tipo de Falha *</Label>
                <Combobox
                  options={tiposFalhaOptions}
                  value={tipoFalhaId}
                  onValueChange={setTipoFalhaId}
                  placeholder="Buscar tipo de falha..."
                  searchPlaceholder="Digite para buscar..."
                  emptyMessage="Nenhum tipo de falha encontrado"
                />
              </div>

              {/* Impacto */}
              <div className="space-y-2">
                <Label>Impacto *</Label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  {[
                    { value: "critico", label: "Crítico", color: "border-red-500 bg-red-500/10 text-red-500" },
                    { value: "alto", label: "Alto", color: "border-orange-500 bg-orange-500/10 text-orange-500" },
                    { value: "medio", label: "Médio", color: "border-yellow-500 bg-yellow-500/10 text-yellow-500" },
                    { value: "baixo", label: "Baixo", color: "border-green-500 bg-green-500/10 text-green-500" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setImpacto(option.value)}
                      className={`p-3 rounded-lg border-2 transition-all ${
                        impacto === option.value
                          ? option.color
                          : "border-border hover:border-muted-foreground"
                      }`}
                    >
                      <span className="font-medium">{option.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Período de Impacto (opcional) */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <Label className="flex items-center gap-2">
                    <Clock className="h-4 w-4 text-orange-500" />
                    Período de Impacto
                  </Label>
                  <Button
                    type="button"
                    variant={adicionarImpacto ? "default" : "outline"}
                    size="sm"
                    onClick={() => {
                      setAdicionarImpacto(!adicionarImpacto)
                      if (!adicionarImpacto && !dataInicioImpacto) {
                        // Usar a mesma hora da detecção como sugestão
                        setDataInicioImpacto(dataDeteccao)
                      }
                    }}
                  >
                    {adicionarImpacto ? "Remover" : "Adicionar"}
                  </Button>
                </div>
                
                {adicionarImpacto && (
                  <div className="grid grid-cols-2 gap-4 p-4 rounded-lg border border-orange-500/20 bg-orange-500/5">
                    <div className="space-y-2">
                      <Label htmlFor="inicioImpacto">Início do Impacto</Label>
                      <Input
                        id="inicioImpacto"
                        type="datetime-local"
                        value={dataInicioImpacto}
                        onChange={(e) => setDataInicioImpacto(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="fimImpacto">Fim do Impacto (opcional)</Label>
                      <Input
                        id="fimImpacto"
                        type="datetime-local"
                        value={dataFimImpacto}
                        onChange={(e) => setDataFimImpacto(e.target.value)}
                      />
                      <p className="text-xs text-muted-foreground">
                        Deixe vazio se ainda em andamento
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Descrição */}
              <div className="space-y-2">
                <Label htmlFor="descricao">Descrição do Problema *</Label>
                <Textarea
                  id="descricao"
                  placeholder="Descreva o problema detectado..."
                  value={descricaoProblema}
                  onChange={(e) => setDescricaoProblema(e.target.value)}
                  required
                  rows={4}
                />
              </div>

              {/* Protocolo */}
              <div className="space-y-2">
                <Label htmlFor="protocolo">
                  Protocolo {tipoChamado === "transporte" ? "do Fornecedor" : "da Operadora"} (opcional)
                </Label>
                <Input
                  id="protocolo"
                  placeholder="Ex: 123456789"
                  value={protocoloOperadora}
                  onChange={(e) => setProtocoloOperadora(e.target.value)}
                />
              </div>

              {/* Submit */}
              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" asChild className="flex-1">
                  <Link href="/chamados">Cancelar</Link>
                </Button>
                <Button 
                  type="submit" 
                  className="flex-1"
                  disabled={loading || !canSubmit}
                >
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Criando...
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Abrir Chamado
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </form>
      )}
    </div>
  )
}
