"use client"

import { useState, useEffect, useMemo } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
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
import { Plus, Network, Search, Loader2, MoreVertical, Pencil, Archive, RotateCcw, Cable, Trash2, AlertTriangle } from "lucide-react"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { TIPOS_SERVICO, formatarCapacidade, parsearCapacidade, getTipoServicoLabel } from "@/lib/constants"

interface Link {
  id: number
  designador: string
  tipoServico: string | null
  capacidade: string | null
  diaVencimento: number | null
  observacoes: string | null
  ativo: boolean
  operadora: { id: number; nome: string } | null
  pop: { id: number; codigo: string; cidade: string; estado: string } | null
  transporte: { id: number; nome: string } | null
}

interface Operadora {
  id: number
  nome: string
}

interface Pop {
  id: number
  codigo: string
  cidade: string
  estado: string
}

interface Transporte {
  id: number
  nome: string
  origem: string
  destino: string
}

interface Usuario {
  id: number
  nome: string
  perfil: string
}

export default function LinksPage() {
  const { toast } = useToast()
  const [links, setLinks] = useState<Link[]>([])
  const [operadoras, setOperadoras] = useState<Operadora[]>([])
  const [pops, setPops] = useState<Pop[]>([])
  const [transportes, setTransportes] = useState<Transporte[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [busca, setBusca] = useState("")
  const [mostrarArquivados, setMostrarArquivados] = useState(false)
  
  // Estado do usuário e exclusão
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [linkToDelete, setLinkToDelete] = useState<Link | null>(null)
  const [deleting, setDeleting] = useState(false)
  
  const isSupervisor = usuario?.perfil === 'supervisor'

  // Form state
  const [editingId, setEditingId] = useState<number | null>(null)
  const [designador, setDesignador] = useState("")
  const [operadoraId, setOperadoraId] = useState("")
  const [popId, setPopId] = useState("")
  const [transporteId, setTransporteId] = useState("")
  const [tipoServico, setTipoServico] = useState("")
  const [capacidadeValor, setCapacidadeValor] = useState("")
  const [capacidadeUnidade, setCapacidadeUnidade] = useState("Mbps")
  const [diaVencimento, setDiaVencimento] = useState("")
  const [observacoes, setObservacoes] = useState("")

  // Converter para options do Combobox
  const operadorasOptions: ComboboxOption[] = useMemo(() => 
    operadoras.map(op => ({
      value: op.id.toString(),
      label: op.nome,
    }))
  , [operadoras])

  const popsOptions: ComboboxOption[] = useMemo(() => 
    pops.map(pop => ({
      value: pop.id.toString(),
      label: `${pop.codigo} - ${pop.cidade}/${pop.estado}`,
      description: pop.cidade,
    }))
  , [pops])

  const transportesOptions: ComboboxOption[] = useMemo(() => [
    { value: "none", label: "Nenhum transporte" },
    ...transportes.map(t => ({
      value: t.id.toString(),
      label: t.nome,
      description: `${t.origem} → ${t.destino}`,
    }))
  ], [transportes])

  const tiposServicoOptions: ComboboxOption[] = useMemo(() => 
    TIPOS_SERVICO.map(t => ({
      value: t.value,
      label: t.label,
    }))
  , [])

  useEffect(() => {
    fetchDados()
  }, [])

  const fetchDados = async () => {
    try {
      const [linksRes, operadorasRes, popsRes, transportesRes, usuarioRes] = await Promise.all([
        fetch("/api/links"),
        fetch("/api/operadoras?ativo=true"),
        fetch("/api/pops?ativo=true"),
        fetch("/api/transportes?ativo=true"),
        fetch("/api/auth/me"),
      ])
      setLinks(await linksRes.json())
      setOperadoras(await operadorasRes.json())
      setPops(await popsRes.json())
      setTransportes(await transportesRes.json())
      if (usuarioRes.ok) {
        setUsuario(await usuarioRes.json())
      }
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }
  
  const handleDeleteClick = (link: Link) => {
    setLinkToDelete(link)
    setDeleteDialogOpen(true)
  }
  
  const handleDelete = async () => {
    if (!linkToDelete) return
    
    setDeleting(true)
    try {
      const res = await fetch(`/api/links/${linkToDelete.id}?permanent=true`, {
        method: "DELETE",
      })
      
      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao excluir link")
      }
      
      toast({
        title: "Link excluído",
        description: `O link ${linkToDelete.designador} foi excluído permanentemente.`,
      })
      
      fetchDados()
    } catch (error) {
      toast({
        title: "Erro ao excluir",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setDeleting(false)
      setDeleteDialogOpen(false)
      setLinkToDelete(null)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setDesignador("")
    setOperadoraId("")
    setPopId("")
    setTransporteId("")
    setTipoServico("")
    setCapacidadeValor("")
    setCapacidadeUnidade("Mbps")
    setDiaVencimento("")
    setObservacoes("")
  }

  const openEditDialog = (link: Link) => {
    setEditingId(link.id)
    setDesignador(link.designador)
    setOperadoraId(link.operadora?.id?.toString() || "")
    setPopId(link.pop?.id?.toString() || "")
    setTransporteId(link.transporte?.id?.toString() || "")
    setTipoServico(link.tipoServico || "")
    
    // Parsear capacidade existente
    const cap = parsearCapacidade(link.capacidade)
    setCapacidadeValor(cap.valor)
    setCapacidadeUnidade(cap.unidade)
    
    setDiaVencimento(link.diaVencimento?.toString() || "")
    setObservacoes(link.observacoes || "")
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!designador) return
    setSaving(true)

    try {
      const url = editingId ? `/api/links/${editingId}` : "/api/links"
      const method = editingId ? "PUT" : "POST"

      // Formatar capacidade
      const capacidade = capacidadeValor 
        ? formatarCapacidade(capacidadeValor, capacidadeUnidade)
        : undefined

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          designador,
          operadoraId: operadoraId ? parseInt(operadoraId) : undefined,
          popId: popId ? parseInt(popId) : undefined,
          transporteId: transporteId && transporteId !== "none" ? parseInt(transporteId) : undefined,
          tipoServico: tipoServico || undefined,
          capacidade,
          diaVencimento: diaVencimento ? parseInt(diaVencimento) : undefined,
          observacoes: observacoes || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      toast({ title: editingId ? "Link atualizado!" : "Link criado!" })
      setDialogOpen(false)
      resetForm()
      fetchDados()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (id: number, ativo: boolean) => {
    try {
      const res = await fetch(`/api/links/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativo }),
      })

      if (!res.ok) throw new Error("Erro ao atualizar")

      toast({ title: ativo ? "Link arquivado!" : "Link reativado!" })
      fetchDados()
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" })
    }
  }

  const linksFiltrados = links.filter((l) => {
    if (!mostrarArquivados && !l.ativo) return false
    if (mostrarArquivados && l.ativo) return false
    
    if (!busca) return true
    const termo = busca.toLowerCase()
    return (
      l.designador.toLowerCase().includes(termo) ||
      l.operadora?.nome.toLowerCase().includes(termo) ||
      l.pop?.cidade.toLowerCase().includes(termo) ||
      l.transporte?.nome.toLowerCase().includes(termo)
    )
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Links/Circuitos</h1>
          <p className="text-muted-foreground">
            Gerencie os links monitorados
          </p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Novo Link
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingId ? "Editar Link" : "Novo Link"}</DialogTitle>
              <DialogDescription>
                {editingId ? "Atualize os dados do link" : "Cadastre um novo link/circuito"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
              <div className="space-y-2">
                <Label>Designador *</Label>
                <Input
                  placeholder="Ex: VIVO-SP-001"
                  value={designador}
                  onChange={(e) => setDesignador(e.target.value)}
                />
              </div>

              {/* Operadora com busca */}
              <div className="space-y-2">
                <Label>Operadora</Label>
                <Combobox
                  options={operadorasOptions}
                  value={operadoraId}
                  onValueChange={setOperadoraId}
                  placeholder="Buscar operadora..."
                  searchPlaceholder="Digite para buscar..."
                  emptyMessage="Nenhuma operadora encontrada"
                />
              </div>

              {/* POP com busca */}
              <div className="space-y-2">
                <Label>POP</Label>
                <Combobox
                  options={popsOptions}
                  value={popId}
                  onValueChange={setPopId}
                  placeholder="Buscar POP..."
                  searchPlaceholder="Buscar por código ou cidade..."
                  emptyMessage="Nenhum POP encontrado"
                />
              </div>

              {/* Transporte com busca */}
              <div className="space-y-2">
                <Label className="flex items-center gap-2">
                  <Cable className="h-4 w-4" />
                  Transporte (Backbone)
                </Label>
                <Combobox
                  options={transportesOptions}
                  value={transporteId || "none"}
                  onValueChange={(v) => setTransporteId(v === "none" ? "" : v)}
                  placeholder="Buscar transporte..."
                  searchPlaceholder="Buscar por nome ou rota..."
                  emptyMessage="Nenhum transporte encontrado"
                />
                <p className="text-xs text-muted-foreground">
                  Se este link passa por um transporte de backbone, vincule aqui
                </p>
              </div>

              {/* Tipo de Serviço - Seleção fixa */}
              <div className="space-y-2">
                <Label>Tipo de Serviço</Label>
                <Combobox
                  options={tiposServicoOptions}
                  value={tipoServico}
                  onValueChange={setTipoServico}
                  placeholder="Selecionar tipo..."
                  searchPlaceholder="Buscar tipo de serviço..."
                  emptyMessage="Nenhum tipo encontrado"
                />
              </div>

              {/* Capacidade - Valor + Unidade */}
              <div className="space-y-2">
                <Label>Capacidade</Label>
                <CapacityInput
                  value={capacidadeValor}
                  unidade={capacidadeUnidade}
                  onValueChange={setCapacidadeValor}
                  onUnidadeChange={setCapacidadeUnidade}
                  placeholder="Ex: 100"
                />
              </div>

              <div className="space-y-2">
                <Label>Dia Vencimento</Label>
                <Input
                  type="number"
                  min="1"
                  max="31"
                  placeholder="Dia (1-31)"
                  value={diaVencimento}
                  onChange={(e) => setDiaVencimento(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label>Observações</Label>
                <Textarea
                  placeholder="Observações adicionais..."
                  value={observacoes}
                  onChange={(e) => setObservacoes(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                Cancelar
              </Button>
              <Button onClick={handleSubmit} disabled={saving || !designador}>
                {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Salvar" : "Criar")}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por designador, operadora, cidade, transporte..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button
              variant={mostrarArquivados ? "secondary" : "outline"}
              onClick={() => setMostrarArquivados(!mostrarArquivados)}
            >
              <Archive className="mr-2 h-4 w-4" />
              {mostrarArquivados ? "Ver Ativos" : "Ver Arquivados"}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5" />
            {linksFiltrados.length} link(s) {mostrarArquivados ? "arquivado(s)" : "ativo(s)"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : linksFiltrados.length === 0 ? (
            <div className="text-center py-12">
              <Network className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-semibold">Nenhum link encontrado</h3>
            </div>
          ) : (
            <div className="space-y-2">
              {linksFiltrados.map((link) => (
                <div
                  key={link.id}
                  className={`flex items-center justify-between p-4 rounded-lg border ${link.ativo ? 'bg-card/50' : 'bg-muted/30 opacity-75'}`}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-mono font-semibold">{link.designador}</span>
                      <Badge variant={link.ativo ? "default" : "secondary"}>
                        {link.ativo ? "Ativo" : "Arquivado"}
                      </Badge>
                      {link.tipoServico && (
                        <Badge variant="outline">
                          {getTipoServicoLabel(link.tipoServico)}
                        </Badge>
                      )}
                      {link.transporte && (
                        <Badge variant="outline" className="flex items-center gap-1">
                          <Cable className="h-3 w-3" />
                          {link.transporte.nome}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {link.operadora?.nome || "Sem operadora"} • {link.pop?.cidade}/{link.pop?.estado || "Sem POP"}
                      {link.capacidade && ` • ${link.capacidade}`}
                    </p>
                    {link.diaVencimento && (
                      <p className="text-xs text-muted-foreground">Vencimento: dia {link.diaVencimento}</p>
                    )}
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => openEditDialog(link)}>
                        <Pencil className="mr-2 h-4 w-4" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleArchive(link.id, link.ativo)}>
                        {link.ativo ? (
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
                      {/* Opção de excluir - só para supervisor e link arquivado */}
                      {!link.ativo && isSupervisor && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteClick(link)}
                            className="text-destructive focus:text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Excluir Permanentemente
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Dialog de confirmação de exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Confirmar Exclusão Permanente
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>
                Você está prestes a excluir permanentemente o link:
              </p>
              <p className="font-semibold text-foreground">
                {linkToDelete?.designador}
              </p>
              <p className="text-destructive font-medium">
                Esta ação não pode ser desfeita. Todos os dados relacionados a este link serão perdidos.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                <>
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Permanentemente
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
