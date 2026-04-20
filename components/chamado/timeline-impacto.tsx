"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
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
import { useToast } from "@/components/ui/use-toast"
import { 
  AlertTriangle, 
  Plus, 
  Pencil, 
  Trash2, 
  Clock, 
  Loader2,
  CheckCircle2
} from "lucide-react"

interface PeriodoImpacto {
  id: number
  inicio: string
  fim: string | null
  descricao: string | null
  criadoPor: { id: number; nome: string }
}

interface TimelineImpactoProps {
  chamadoId: number
  periodos: PeriodoImpacto[]
  dataDeteccao: string
  dataNormalizacao?: string | null
  onUpdate: () => void
}

function formatDateTime(date: string) {
  return new Date(date).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatDuration(inicio: string, fim: string | null) {
  if (!fim) return "Em andamento"
  
  const start = new Date(inicio).getTime()
  const end = new Date(fim).getTime()
  const diff = end - start
  
  const mins = Math.floor(diff / 60000)
  const hrs = Math.floor(mins / 60)
  const m = mins % 60
  
  if (hrs > 24) {
    const dias = Math.floor(hrs / 24)
    const h = hrs % 24
    return `${dias}d ${h}h ${m}min`
  }
  return hrs > 0 ? `${hrs}h ${m}min` : `${m}min`
}

function calcularDuracaoTotal(periodos: PeriodoImpacto[]): string {
  let totalMs = 0
  
  periodos.forEach(p => {
    if (p.fim) {
      const start = new Date(p.inicio).getTime()
      const end = new Date(p.fim).getTime()
      totalMs += end - start
    }
  })
  
  const mins = Math.floor(totalMs / 60000)
  const hrs = Math.floor(mins / 60)
  const m = mins % 60
  
  if (hrs > 24) {
    const dias = Math.floor(hrs / 24)
    const h = hrs % 24
    return `${dias}d ${h}h ${m}min`
  }
  return hrs > 0 ? `${hrs}h ${m}min` : `${m}min`
}

export function TimelineImpacto({ 
  chamadoId, 
  periodos, 
  dataDeteccao,
  dataNormalizacao,
  onUpdate 
}: TimelineImpactoProps) {
  const { toast } = useToast()
  const [dialogOpen, setDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editingPeriodo, setEditingPeriodo] = useState<PeriodoImpacto | null>(null)
  const [deletingPeriodo, setDeletingPeriodo] = useState<PeriodoImpacto | null>(null)
  
  // Form state
  const [inicio, setInicio] = useState("")
  const [fim, setFim] = useState("")
  const [descricao, setDescricao] = useState("")

  const resetForm = () => {
    setInicio("")
    setFim("")
    setDescricao("")
    setEditingPeriodo(null)
  }

  const openNewDialog = () => {
    resetForm()
    // Preencher com hora atual como sugestão
    const now = new Date()
    now.setMinutes(now.getMinutes() - now.getTimezoneOffset())
    setInicio(now.toISOString().slice(0, 16))
    setDialogOpen(true)
  }

  const openEditDialog = (periodo: PeriodoImpacto) => {
    setEditingPeriodo(periodo)
    const inicioDate = new Date(periodo.inicio)
    inicioDate.setMinutes(inicioDate.getMinutes() - inicioDate.getTimezoneOffset())
    setInicio(inicioDate.toISOString().slice(0, 16))
    
    if (periodo.fim) {
      const fimDate = new Date(periodo.fim)
      fimDate.setMinutes(fimDate.getMinutes() - fimDate.getTimezoneOffset())
      setFim(fimDate.toISOString().slice(0, 16))
    } else {
      setFim("")
    }
    setDescricao(periodo.descricao || "")
    setDialogOpen(true)
  }

  const handleSubmit = async () => {
    if (!inicio) {
      toast({
        title: "Erro",
        description: "Data de início é obrigatória",
        variant: "destructive",
      })
      return
    }

    setSaving(true)
    try {
      const url = editingPeriodo 
        ? `/api/chamados/${chamadoId}/periodos-impacto/${editingPeriodo.id}`
        : `/api/chamados/${chamadoId}/periodos-impacto`
      
      const res = await fetch(url, {
        method: editingPeriodo ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inicio: new Date(inicio).toISOString(),
          fim: fim ? new Date(fim).toISOString() : null,
          descricao: descricao || null,
        }),
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao salvar")
      }

      toast({
        title: editingPeriodo ? "Período atualizado" : "Período adicionado",
        description: "O período de impacto foi salvo com sucesso",
      })

      setDialogOpen(false)
      resetForm()
      onUpdate()
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deletingPeriodo) return

    setSaving(true)
    try {
      const res = await fetch(
        `/api/chamados/${chamadoId}/periodos-impacto/${deletingPeriodo.id}`,
        { method: "DELETE" }
      )

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao excluir")
      }

      toast({
        title: "Período excluído",
        description: "O período de impacto foi removido",
      })

      setDeleteDialogOpen(false)
      setDeletingPeriodo(null)
      onUpdate()
    } catch (error) {
      toast({
        title: "Erro",
        description: error instanceof Error ? error.message : "Erro desconhecido",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const openDeleteDialog = (periodo: PeriodoImpacto) => {
    setDeletingPeriodo(periodo)
    setDeleteDialogOpen(true)
  }

  const temPeriodoEmAndamento = periodos.some(p => !p.fim)
  const duracaoTotal = calcularDuracaoTotal(periodos)

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
              Períodos de Impacto
            </CardTitle>
            <Button size="sm" variant="outline" onClick={openNewDialog}>
              <Plus className="h-4 w-4 mr-1" />
              Adicionar
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {periodos.length === 0 ? (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle2 className="h-10 w-10 mx-auto mb-2 text-green-500" />
              <p className="text-sm">Nenhum período de impacto registrado</p>
              <p className="text-xs">Clique em "Adicionar" para registrar quando houve impacto nos clientes</p>
            </div>
          ) : (
            <>
              {/* Timeline Visual */}
              <div className="relative">
                {/* Linha vertical */}
                <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-orange-500 via-orange-400 to-orange-300" />
                
                {/* Períodos */}
                <div className="space-y-4">
                  {periodos.map((periodo, index) => (
                    <div key={periodo.id} className="relative pl-10">
                      {/* Ponto na timeline */}
                      <div className={`absolute left-2.5 top-2 w-3 h-3 rounded-full border-2 ${
                        periodo.fim 
                          ? 'bg-orange-500 border-orange-500' 
                          : 'bg-red-500 border-red-500 animate-pulse'
                      }`} />
                      
                      {/* Card do período */}
                      <div className={`rounded-lg border p-3 transition-colors ${
                        periodo.fim 
                          ? 'bg-orange-500/5 border-orange-500/20 hover:border-orange-500/40' 
                          : 'bg-red-500/10 border-red-500/30 hover:border-red-500/50'
                      }`}>
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            {/* Horários */}
                            <div className="flex items-center gap-2 text-sm">
                              <Clock className="h-4 w-4 text-orange-500 shrink-0" />
                              <span className="font-medium">{formatDateTime(periodo.inicio)}</span>
                              <span className="text-muted-foreground">→</span>
                              {periodo.fim ? (
                                <span className="font-medium">{formatDateTime(periodo.fim)}</span>
                              ) : (
                                <Badge variant="destructive" className="text-xs">
                                  Em andamento
                                </Badge>
                              )}
                            </div>
                            
                            {/* Duração */}
                            <div className="mt-1 flex items-center gap-2">
                              <Badge variant="secondary" className="text-xs">
                                {formatDuration(periodo.inicio, periodo.fim)}
                              </Badge>
                              {periodo.descricao && (
                                <span className="text-xs text-muted-foreground truncate">
                                  {periodo.descricao}
                                </span>
                              )}
                            </div>
                          </div>
                          
                          {/* Ações */}
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7"
                              onClick={() => openEditDialog(periodo)}
                            >
                              <Pencil className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => openDeleteDialog(periodo)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resumo */}
              <div className="pt-3 border-t border-border/50">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-muted-foreground">
                    {periodos.length} período{periodos.length > 1 ? 's' : ''} registrado{periodos.length > 1 ? 's' : ''}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">Duração total:</span>
                    <Badge variant="outline" className="font-semibold text-orange-500 border-orange-500/50">
                      {duracaoTotal}
                    </Badge>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de Adicionar/Editar */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingPeriodo ? "Editar Período de Impacto" : "Novo Período de Impacto"}
            </DialogTitle>
            <DialogDescription>
              Registre o período em que os clientes foram impactados pelo incidente.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="inicio">Início do Impacto *</Label>
                <Input
                  id="inicio"
                  type="datetime-local"
                  value={inicio}
                  onChange={(e) => setInicio(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fim">Fim do Impacto</Label>
                <Input
                  id="fim"
                  type="datetime-local"
                  value={fim}
                  onChange={(e) => setFim(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Deixe vazio se ainda em andamento
                </p>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="descricao">Descrição (opcional)</Label>
              <Input
                id="descricao"
                placeholder="Ex: Impacto durante horário de pico"
                value={descricao}
                onChange={(e) => setDescricao(e.target.value)}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
              Cancelar
            </Button>
            <Button onClick={handleSubmit} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Salvando...
                </>
              ) : editingPeriodo ? (
                "Salvar Alterações"
              ) : (
                "Adicionar Período"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog de Confirmação de Exclusão */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Período de Impacto</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este período de impacto?
              <br />
              <span className="font-medium text-foreground">
                {deletingPeriodo && formatDateTime(deletingPeriodo.inicio)}
                {deletingPeriodo?.fim && ` → ${formatDateTime(deletingPeriodo.fim)}`}
              </span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={saving}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={saving}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Excluindo...
                </>
              ) : (
                "Excluir"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

