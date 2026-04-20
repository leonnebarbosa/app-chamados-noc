"use client"

import { useState, useEffect } from "react"
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
import { useToast } from "@/components/ui/use-toast"
import { Plus, MapPin, Loader2, MoreVertical, Pencil, Archive, RotateCcw } from "lucide-react"

interface Pop {
  id: number
  codigo: string
  nome: string
  cidade: string
  estado: string
  endereco: string | null
  ativo: boolean
}

export default function PopsPage() {
  const { toast } = useToast()
  const [pops, setPops] = useState<Pop[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mostrarArquivados, setMostrarArquivados] = useState(false)

  // Form
  const [editingId, setEditingId] = useState<number | null>(null)
  const [codigo, setCodigo] = useState("")
  const [nome, setNome] = useState("")
  const [cidade, setCidade] = useState("")
  const [estado, setEstado] = useState("")
  const [endereco, setEndereco] = useState("")

  useEffect(() => {
    fetchPops()
  }, [])

  const fetchPops = async () => {
    try {
      const res = await fetch("/api/pops")
      setPops(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setCodigo("")
    setNome("")
    setCidade("")
    setEstado("")
    setEndereco("")
  }

  const openEditDialog = (pop: Pop) => {
    setEditingId(pop.id)
    setCodigo(pop.codigo)
    setNome(pop.nome)
    setCidade(pop.cidade)
    setEstado(pop.estado)
    setEndereco(pop.endereco || "")
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!codigo || !nome || !cidade || !estado) return
    setSaving(true)

    try {
      const url = editingId ? `/api/pops/${editingId}` : "/api/pops"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          codigo,
          nome,
          cidade,
          estado: estado.toUpperCase(),
          endereco: endereco || undefined,
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error)
      }

      toast({ title: editingId ? "POP atualizado!" : "POP criado!" })
      setDialogOpen(false)
      resetForm()
      fetchPops()
    } catch (error: any) {
      toast({ title: "Erro", description: error.message, variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (id: number, ativo: boolean) => {
    try {
      const res = await fetch(`/api/pops/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativo }),
      })

      if (!res.ok) throw new Error("Erro ao atualizar")

      toast({ title: ativo ? "POP arquivado!" : "POP reativado!" })
      fetchPops()
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" })
    }
  }

  const popsFiltrados = pops.filter((pop) => {
    if (!mostrarArquivados && !pop.ativo) return false
    if (mostrarArquivados && pop.ativo) return false
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">POPs</h1>
          <p className="text-muted-foreground">Pontos de Presença</p>
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
                Novo POP
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar POP" : "Novo POP"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Atualize os dados do POP" : "Cadastre um novo ponto de presença"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Código *</Label>
                    <Input
                      placeholder="Ex: SP-01"
                      value={codigo}
                      onChange={(e) => setCodigo(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Estado *</Label>
                    <Input
                      placeholder="Ex: SP"
                      maxLength={2}
                      value={estado}
                      onChange={(e) => setEstado(e.target.value.toUpperCase())}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Ex: POP São Paulo Centro"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Cidade *</Label>
                  <Input
                    placeholder="Ex: São Paulo"
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Endereço</Label>
                  <Textarea
                    placeholder="Endereço completo"
                    value={endereco}
                    onChange={(e) => setEndereco(e.target.value)}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => { setDialogOpen(false); resetForm(); }}>
                  Cancelar
                </Button>
                <Button onClick={handleSubmit} disabled={saving || !codigo || !nome || !cidade || !estado}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (editingId ? "Salvar" : "Criar")}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {loading ? (
          <div className="col-span-full flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : popsFiltrados.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <MapPin className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              {mostrarArquivados ? "Nenhum POP arquivado" : "Nenhum POP"}
            </h3>
          </div>
        ) : (
          popsFiltrados.map((pop) => (
            <Card key={pop.id} className={!pop.ativo ? "opacity-75" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-primary" />
                    {pop.codigo}
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={pop.ativo ? "default" : "secondary"}>
                      {pop.ativo ? "Ativo" : "Arquivado"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(pop)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchive(pop.id, pop.ativo)}>
                          {pop.ativo ? (
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
              <CardContent className="space-y-1">
                <p className="font-medium">{pop.nome}</p>
                <p className="text-sm text-muted-foreground">
                  {pop.cidade}/{pop.estado}
                </p>
                {pop.endereco && (
                  <p className="text-xs text-muted-foreground">{pop.endereco}</p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
