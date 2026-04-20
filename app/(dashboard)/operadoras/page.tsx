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
import { Plus, Building2, Loader2, Phone, Clock, MoreVertical, Pencil, Archive, RotateCcw, Mail, Globe } from "lucide-react"

interface Operadora {
  id: number
  nome: string
  telefoneSuporte: string | null
  emailSuporte: string | null
  portalUrl: string | null
  slaHoras: number | null
  observacoes: string | null
  ativo: boolean
}

export default function OperadorasPage() {
  const { toast } = useToast()
  const [operadoras, setOperadoras] = useState<Operadora[]>([])
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [mostrarArquivados, setMostrarArquivados] = useState(false)

  // Form
  const [editingId, setEditingId] = useState<number | null>(null)
  const [nome, setNome] = useState("")
  const [telefoneSuporte, setTelefoneSuporte] = useState("")
  const [emailSuporte, setEmailSuporte] = useState("")
  const [portalUrl, setPortalUrl] = useState("")
  const [slaHoras, setSlaHoras] = useState("")
  const [observacoes, setObservacoes] = useState("")

  useEffect(() => {
    fetchOperadoras()
  }, [])

  const fetchOperadoras = async () => {
    try {
      const res = await fetch("/api/operadoras")
      setOperadoras(await res.json())
    } catch (error) {
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setEditingId(null)
    setNome("")
    setTelefoneSuporte("")
    setEmailSuporte("")
    setPortalUrl("")
    setSlaHoras("")
    setObservacoes("")
  }

  const openEditDialog = (op: Operadora) => {
    setEditingId(op.id)
    setNome(op.nome)
    setTelefoneSuporte(op.telefoneSuporte || "")
    setEmailSuporte(op.emailSuporte || "")
    setPortalUrl(op.portalUrl || "")
    setSlaHoras(op.slaHoras?.toString() || "")
    setObservacoes(op.observacoes || "")
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!nome) return
    setSaving(true)

    try {
      const url = editingId ? `/api/operadoras/${editingId}` : "/api/operadoras"
      const method = editingId ? "PUT" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome,
          telefoneSuporte: telefoneSuporte || undefined,
          emailSuporte: emailSuporte || undefined,
          portalUrl: portalUrl || undefined,
          slaHoras: slaHoras ? parseInt(slaHoras) : undefined,
          observacoes: observacoes || undefined,
        }),
      })

      if (!res.ok) throw new Error("Erro ao salvar")

      toast({ title: editingId ? "Operadora atualizada!" : "Operadora criada!" })
      setDialogOpen(false)
      resetForm()
      fetchOperadoras()
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" })
    } finally {
      setSaving(false)
    }
  }

  const handleArchive = async (id: number, ativo: boolean) => {
    try {
      const res = await fetch(`/api/operadoras/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !ativo }),
      })

      if (!res.ok) throw new Error("Erro ao atualizar")

      toast({ title: ativo ? "Operadora arquivada!" : "Operadora reativada!" })
      fetchOperadoras()
    } catch (error) {
      toast({ title: "Erro", variant: "destructive" })
    }
  }

  const operadorasFiltradas = operadoras.filter((op) => {
    if (!mostrarArquivados && !op.ativo) return false
    if (mostrarArquivados && op.ativo) return false
    return true
  })

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Operadoras</h1>
          <p className="text-muted-foreground">Gerencie as operadoras de telecom</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant={mostrarArquivados ? "secondary" : "outline"}
            onClick={() => setMostrarArquivados(!mostrarArquivados)}
          >
            <Archive className="mr-2 h-4 w-4" />
            {mostrarArquivados ? "Ver Ativas" : "Ver Arquivadas"}
          </Button>
          <Dialog open={dialogOpen} onOpenChange={(open) => { setDialogOpen(open); if (!open) resetForm(); }}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Nova Operadora
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Operadora" : "Nova Operadora"}</DialogTitle>
                <DialogDescription>
                  {editingId ? "Atualize os dados da operadora" : "Cadastre uma nova operadora"}
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label>Nome *</Label>
                  <Input
                    placeholder="Ex: Vivo, Claro"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Telefone Suporte</Label>
                    <Input
                      placeholder="Ex: 0800-xxx-xxxx"
                      value={telefoneSuporte}
                      onChange={(e) => setTelefoneSuporte(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>SLA (horas)</Label>
                    <Input
                      type="number"
                      placeholder="Ex: 4"
                      value={slaHoras}
                      onChange={(e) => setSlaHoras(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label>Email Suporte</Label>
                  <Input
                    type="email"
                    placeholder="suporte@operadora.com"
                    value={emailSuporte}
                    onChange={(e) => setEmailSuporte(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Portal/URL</Label>
                  <Input
                    placeholder="https://portal.operadora.com"
                    value={portalUrl}
                    onChange={(e) => setPortalUrl(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label>Observações</Label>
                  <Textarea
                    placeholder="Observações..."
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
                <Button onClick={handleSubmit} disabled={saving || !nome}>
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
        ) : operadorasFiltradas.length === 0 ? (
          <div className="col-span-full text-center py-12">
            <Building2 className="mx-auto h-12 w-12 text-muted-foreground/50" />
            <h3 className="mt-4 text-lg font-semibold">
              {mostrarArquivados ? "Nenhuma operadora arquivada" : "Nenhuma operadora"}
            </h3>
          </div>
        ) : (
          operadorasFiltradas.map((op) => (
            <Card key={op.id} className={!op.ativo ? "opacity-75" : ""}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{op.nome}</CardTitle>
                  <div className="flex items-center gap-2">
                    <Badge variant={op.ativo ? "default" : "secondary"}>
                      {op.ativo ? "Ativa" : "Arquivada"}
                    </Badge>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openEditDialog(op)}>
                          <Pencil className="mr-2 h-4 w-4" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => handleArchive(op.id, op.ativo)}>
                          {op.ativo ? (
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
                {op.telefoneSuporte && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Phone className="h-4 w-4" />
                    {op.telefoneSuporte}
                  </div>
                )}
                {op.emailSuporte && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="h-4 w-4" />
                    {op.emailSuporte}
                  </div>
                )}
                {op.portalUrl && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Globe className="h-4 w-4" />
                    <a href={op.portalUrl} target="_blank" rel="noopener" className="text-primary hover:underline truncate">
                      Portal
                    </a>
                  </div>
                )}
                {op.slaHoras && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    SLA: {op.slaHoras}h
                  </div>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  )
}
