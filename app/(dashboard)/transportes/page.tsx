"use client"

import { useState, useEffect, useMemo } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Combobox, type ComboboxOption } from "@/components/ui/combobox"
import { CapacityInput } from "@/components/ui/capacity-input"
import { useToast } from "@/components/ui/use-toast"
import { 
  Plus, 
  Loader2, 
  MoreVertical, 
  Pencil, 
  Archive, 
  RotateCcw, 
  Search,
  Cable,
  MapPin,
  Network,
  AlertTriangle
} from "lucide-react"
import { TECNOLOGIAS_TRANSPORTE, formatarCapacidade, parsearCapacidade } from "@/lib/constants"

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
  _count: {
    links: number
    chamados: number
  }
}

export default function TransportesPage() {
  const { toast } = useToast()
  const [transportes, setTransportes] = useState<Transporte[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState("")
  const [mostrarArquivados, setMostrarArquivados] = useState(false)

  // Form
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState("")
  const [fornecedor, setFornecedor] = useState("")
  const [origem, setOrigem] = useState("")
  const [destino, setDestino] = useState("")
  const [capacidadeValor, setCapacidadeValor] = useState("")
  const [capacidadeUnidade, setCapacidadeUnidade] = useState("Gbps")
  const [tecnologia, setTecnologia] = useState("")
  const [observacoes, setObservacoes] = useState("")

  const tecnologiasOptions: ComboboxOption[] = useMemo(() => 
    TECNOLOGIAS_TRANSPORTE.map(t => ({
      value: t.value,
      label: t.label,
    }))
  , [])

  useEffect(() => {
    fetchTransportes()
  }, [])

  const fetchTransportes = async () => {
    try {
      const res = await fetch("/api/transportes")
      setTransportes(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setNome("")
    setFornecedor("")
    setOrigem("")
    setDestino("")
    setCapacidadeValor("")
    setCapacidadeUnidade("Gbps")
    setTecnologia("")
    setObservacoes("")
  }

  const openEditDialog = (t: Transporte) => {
    setEditingId(t.id)
    setNome(t.nome)
    setFornecedor(t.fornecedor)
    setOrigem(t.origem)
    setDestino(t.destino)
    
    // Parse capacidade existente
    const cap = parsearCapacidade(t.capacidade)
    setCapacidadeValor(cap.valor)
    setCapacidadeUnidade(cap.unidade)
    
    setTecnologia(t.tecnologia || "")
    setObservacoes(t.observacoes || "")
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!nome || !fornecedor || !origem || !destino) return
    setSaving(true)

    try {
      const url = editingId ? `/api/transportes/${editingId}` : "/api/transportes"
      const method = editingId ? "PUT" : "POST"

      // Formatar capacidade
      const capacidade = capacidadeValor 
        ? formatarCapacidade(capacidadeValor, capacidadeUnidade)
        : undefined

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          fornecedor,
          origem,
          destino,
          capacidade,
          tecnologia: tecnologia || undefined,
          observacoes: observacoes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      toast({ title: editingId ? "Transporte atualizado!" : "Transporte criado!" })
      setDialogOpen(false)
      resetForm()
      fetchTransportes()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (id: number, ativo: boolean) => {
    try {
      const res = await fetch(`/api/transportes/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativo }),
      })

      if (!res.ok) throw new Error("Erro ao atualizar")

      toast({ title: ativo ? "Transporte arquivado!" : "Transporte reativado!" })
      fetchTransportes()
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" })
    }
  }

  // Função para exibir a tecnologia
  const getTecnologiaLabel = (value: string | null) => {
    if (!value) return ""
    const tec = TECNOLOGIAS_TRANSPORTE.find(t => t.value === value)
    return tec?.label || value
  }

  const transportesFiltrados = transportes.filter((t) => {
    if (!mostrarArquivados && !t.ativo) return false
    if (mostrarArquivados && t.ativo) return false
    
    if (!busca) return true
    const termo = busca.toLowerCase()
    return (
      t.nome.toLowerCase().includes(termo) ||
      t.fornecedor.toLowerCase().includes(termo) ||
      t.origem.toLowerCase().includes(termo) ||
      t.destino.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transportes</h1>
          <p className="text-muted-foreground">Backbone e infraestrutura de transporte de dados</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mostrarArquivados ? "secondary" : "outline"}
            onClick={() => setMostrarArquivados(!mostrarArquivados)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {mostrarArquivados ? "Ver Ativos" : "Ver Arquivados"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Novo Transporte
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Transporte" : "Novo Transporte"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Atualize os dados do transporte" : "Cadastre um novo transporte de dados"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Ex: Eletronorte STM-BSB"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Fornecedor *</Label>
                  <Input
                    placeholder="Ex: Eletronorte, Chesf, Copel"
                    value={fornecedor}
                    onChange={(e) => setFornecedor(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Origem *</Label>
                    <Input
                      placeholder="Ex: Santarém-PA"
                      value={origem}
                      onChange={(e) => setOrigem(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Destino *</Label>
                    <Input
                      placeholder="Ex: Brasília-DF"
                      value={destino}
                      onChange={(e) => setDestino(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Capacidade</Label>
                  <CapacityInput
                    value={capacidadeValor}
                    unidade={capacidadeUnidade}
                    onValueChange={setCapacidadeValor}
                    onUnidadeChange={setCapacidadeUnidade}
                    placeholder="Ex: 10"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Tecnologia</Label>
                  <Combobox
                    options={tecnologiasOptions}
                    value={tecnologia}
                    onValueChange={setTecnologia}
                    placeholder="Selecionar tecnologia..."
                    searchPlaceholder="Buscar tecnologia..."
                    emptyMessage="Nenhuma tecnologia encontrada"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Informações adicionais..."
                    value={observacoes}
                    onChange={(e) => setObservacoes(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={saving || !nome || !fornecedor || !origem || !destino}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Salvar" : "Criar")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nome, fornecedor, origem ou destino..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : transportesFiltrados.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Cable className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              {mostrarArquivados ? "Nenhum transporte arquivado" : "Nenhum transporte cadastrado"}
            </h3>
            <p className="text-muted-foreground mt-1">
              Cadastre transportes para vincular links
            </p>
          </div>
        ) : (
          transportesFiltrados.map((t) => (
            <Card key={t.id} className={`${!t.ativo ? "opacity-75" : ""} ${t._count.chamados > 0 ? "border-destructive/50" : ""}`}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Cable className="h-4 w-4 text-primary" />
                    {t.nome}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {t._count.chamados > 0 && (
                      <Badge variant="destructive" className="animate-pulse-slow">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        {t._count.chamados}
                      </Badge>
                    )}
                    <Badge variant={t.ativo ? "default" : "secondary"}>
                      {t.ativo ? "Ativo" : "Arquivado"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/transportes/${t.id}`}>
                            <Network className="mr-2 h-4 w-4" />
                            Ver Detalhes
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(t)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchive(t.id, t.ativo)}>
                          {t.ativo ? (
                            <>
                              <Archive className="mr-2 h-4 w-4" />
                              Arquivar
                            </>
                          ) : (
                            <>
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Reativar
                            </>
                          )}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="h-4 w-4 shrink-0" />
                  <span className="truncate">{t.origem} → {t.destino}</span>
                </div>
                <div className="text-muted-foreground">
                  <span className="font-medium">Fornecedor:</span> {t.fornecedor}
                </div>
                {t.tecnologia && (
                  <div className="text-muted-foreground">
                    <span className="font-medium">Tecnologia:</span> {getTecnologiaLabel(t.tecnologia)}
                    {t.capacidade && ` (${t.capacidade})`}
                  </div>
                )}
                <div className="flex items-center gap-4 pt-2 border-t">
                  <div className="flex items-center gap-1 text-muted-foreground">
                    <Network className="h-4 w-4" />
                    <span>{t._count.links} links</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
