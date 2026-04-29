"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Separator } from "@/components/ui/separator"
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog"
import { useToast } from "@/components/ui/use-toast"
import { 
  ArrowLeft, 
  Loader2, 
  Clock, 
  User,
  Building2,
  MapPin,
  Network,
  MessageSquare,
  CheckCircle2,
  Send,
  Paperclip,
  AlertTriangle,
  Pencil,
  Plus
} from "lucide-react"
import { FileUpload } from "@/components/file-upload"
import { TimelineImpacto } from "@/components/chamado/timeline-impacto"
import {
  getStatusLabel,
  getImpactoLabel,
  calcularDuracao,
  formatDateTime,
  formatRelativeTime,
} from "@/lib/utils"

interface Chamado {
  id: number
  numero: string
  status: string
  impacto: string
  descricaoProblema: string
  protocoloOperadora: string | null
  causaRaiz: string | null
  solucao: string | null
  dataDeteccao: string
  dataAbertura: string
  dataContatoOperadora: string | null
  dataResolucao: string | null
  dataFechamento: string | null
  dataInicioImpacto: string | null
  dataFimImpacto: string | null
  dataNormalizacao: string | null
  link: {
    designador: string
    tipoServico: string | null
    capacidade: string | null
    operadora: { nome: string; telefoneSuporte: string | null } | null
    pop: { nome: string; cidade: string; estado: string } | null
  } | null
  transporte: {
    nome: string
    operadora: { id: number; nome: string } | null
  } | null
  tipoFalha: { nome: string } | null
  abertoPor: { id: number; nome: string } | null
  fechadoPor: { id: number; nome: string } | null
  historicos: Array<{
    id: number
    tipoAcao: string
    descricao: string
    statusAnterior: string | null
    statusNovo: string | null
    criadoEm: string
    usuario: { id: number; nome: string }
  }>
  anexos: Array<{
    id: number
    nome: string
    tipo: string
    tamanho: number
    url: string
    criadoEm: string
  }>
  periodosImpacto: Array<{
    id: number
    inicio: string
    fim: string | null
    descricao: string | null
    criadoPor: { id: number; nome: string }
  }>
}

export default function ChamadoDetalhesPage({ params }: { params: { id: string } }) {
  const router = useRouter()
  const { toast } = useToast()
  const [chamado, setChamado] = useState<Chamado | null>(null)
  const [loading, setLoading] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [fechando, setFechando] = useState(false)

  // Update form
  const [novaAtualizacao, setNovaAtualizacao] = useState("")
  const [novoStatus, setNovoStatus] = useState("")

  // Close form
  const [dialogFechamento, setDialogFechamento] = useState(false)
  const [dataResolucao, setDataResolucao] = useState("")
  const [semConfirmacaoOperadora, setSemConfirmacaoOperadora] = useState(false)
  const [observacaoFechamento, setObservacaoFechamento] = useState("")

  // Delete
  const [dialogDelete, setDialogDelete] = useState(false)
  const [deletando, setDeletando] = useState(false)
  const [isSupervisor, setIsSupervisor] = useState(false)

  // Edição de campos individuais
  const [dialogEditDataDeteccao, setDialogEditDataDeteccao] = useState(false)
  const [dialogEditProtocolo, setDialogEditProtocolo] = useState(false)
  const [novaDataDeteccao, setNovaDataDeteccao] = useState("")
  const [novoProtocolo, setNovoProtocolo] = useState("")
  const [salvandoDataDeteccao, setSalvandoDataDeteccao] = useState(false)
  const [salvandoProtocolo, setSalvandoProtocolo] = useState(false)

  useEffect(() => {
    fetchChamado()
    checkUserRole()
  }, [params.id])

  const checkUserRole = async () => {
    try {
      const res = await fetch('/api/auth/me')
      if (res.ok) {
        const user = await res.json()
        setIsSupervisor(user.perfil === 'supervisor')
      }
    } catch (error) {
      console.error('Erro ao verificar perfil do usuário:', error)
    }
  }

  const fetchChamado = async () => {
    try {
      const res = await fetch(`/api/chamados/${params.id}`)
      if (!res.ok) throw new Error("Chamado não encontrado")
      const data = await res.json()
      setChamado(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Chamado não encontrado",
        variant: "destructive",
      })
      router.push("/chamados")
    } finally {
      setLoading(false)
    }
  }

  const handleAtualizacao = async () => {
    if (!novaAtualizacao.trim()) return
    setAtualizando(true)

    try {
      const res = await fetch(`/api/chamados/${params.id}/historico`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          descricao: novaAtualizacao,
          novoStatus: novoStatus || undefined,
        }),
      })

      if (!res.ok) throw new Error("Erro ao adicionar atualização")

      toast({ title: "Atualização adicionada!" })
      setNovaAtualizacao("")
      setNovoStatus("")
      fetchChamado()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível adicionar a atualização",
        variant: "destructive",
      })
    } finally {
      setAtualizando(false)
    }
  }

  const handleSalvarDataDeteccao = async () => {
    if (!novaDataDeteccao) return

    if (
      chamado?.dataNormalizacao &&
      new Date(novaDataDeteccao).getTime() > new Date(chamado.dataNormalizacao).getTime()
    ) {
      toast({
        title: "Data inválida",
        description:
          "O início do incidente não pode ser posterior à normalização já registrada.",
        variant: "destructive",
      })
      return
    }

    setSalvandoDataDeteccao(true)
    try {
      const res = await fetch(`/api/chamados/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataDeteccao: new Date(novaDataDeteccao).toISOString(),
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erro ao atualizar data de detecção")
      }

      toast({ title: "Data de detecção atualizada!" })
      fetchChamado()
      setDialogEditDataDeteccao(false)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível atualizar a data de detecção",
        variant: "destructive",
      })
    } finally {
      setSalvandoDataDeteccao(false)
    }
  }

  const handleSalvarProtocolo = async () => {
    setSalvandoProtocolo(true)
    try {
      const res = await fetch(`/api/chamados/${params.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          protocoloOperadora: novoProtocolo || null,
        }),
      })

      if (!res.ok) throw new Error("Erro ao atualizar protocolo")

      toast({ title: "Protocolo atualizado!" })
      fetchChamado()
      setDialogEditProtocolo(false)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o protocolo",
        variant: "destructive",
      })
    } finally {
      setSalvandoProtocolo(false)
    }
  }

  const handleDelete = async () => {
    setDeletando(true)
    try {
      const res = await fetch(`/api/chamados/${params.id}`, {
        method: "DELETE",
      })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao excluir chamado")
      }

      toast({ 
        title: "Chamado excluído!", 
        description: "O chamado foi removido com sucesso" 
      })
      router.push("/chamados")
    } catch (error: any) {
      toast({
        title: "Erro ao excluir",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setDeletando(false)
      setDialogDelete(false)
    }
  }

  const handleFechamento = async () => {
    if (!dataResolucao) return

    if (
      chamado &&
      new Date(dataResolucao).getTime() < new Date(chamado.dataDeteccao).getTime()
    ) {
      toast({
        title: "Data inválida",
        description:
          "A normalização do incidente não pode ser anterior ao início do incidente.",
        variant: "destructive",
      })
      return
    }

    if (chamado?.periodosImpacto?.some((p) => !p.fim)) {
      toast({
        title: "Período de impacto em aberto",
        description:
          "Encerre o período de impacto ainda em andamento antes de fechar o chamado.",
        variant: "destructive",
      })
      return
    }

    setFechando(true)

    try {
      const res = await fetch(`/api/chamados/${params.id}/fechar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dataResolucao,
          semConfirmacaoOperadora,
          observacao: observacaoFechamento || null,
        }),
      })

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.error || "Erro ao fechar chamado")
      }

      toast({ title: "Chamado fechado com sucesso!" })
      setDialogFechamento(false)
      fetchChamado()
    } catch (error: any) {
      toast({
        title: "Erro ao fechar chamado",
        description: error.message || "Não foi possível fechar o chamado",
        variant: "destructive",
      })
    } finally {
      setFechando(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (!chamado) return null

  const isFechado = chamado.status === "fechado"
  const temPeriodoImpactoAberto = (chamado.periodosImpacto || []).some((p) => !p.fim)

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/chamados">
            <ArrowLeft className="h-5 w-5" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold tracking-tight font-mono">
              {chamado.transporte?.nome || chamado.link?.designador || "Sem identificação"}
            </h1>
            {chamado.transporte && (
              <Badge variant="secondary">Transporte</Badge>
            )}
            <Badge
              variant={
                chamado.impacto === "critico" ? "critical" :
                chamado.impacto === "alto" ? "high" :
                chamado.impacto === "medio" ? "medium" : "low"
              }
            >
              {getImpactoLabel(chamado.impacto)}
            </Badge>
            <Badge variant="outline">{getStatusLabel(chamado.status)}</Badge>
          </div>
          <p className="text-muted-foreground flex items-center gap-2">
            <span className="font-mono font-medium">{chamado.numero}</span>
            <span className="text-muted-foreground/50">•</span>
            <span className="px-2 py-0.5 rounded bg-muted text-foreground font-medium text-sm">
              {chamado.tipoFalha?.nome}
            </span>
          </p>
        </div>
        <div className="flex gap-2">
          {!isFechado && (
            <>
              {/* Dialog de Fechamento */}
              <Dialog open={dialogFechamento} onOpenChange={setDialogFechamento}>
              <DialogTrigger asChild>
                <Button variant="success">
                  <CheckCircle2 className="mr-2 h-4 w-4" />
                  Fechar Chamado
                </Button>
              </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Fechar Chamado {chamado.numero}</DialogTitle>
                <DialogDescription>
                  Preencha as informações de resolução
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                {temPeriodoImpactoAberto && (
                  <div className="flex items-start gap-2 rounded-md border border-orange-500/40 bg-orange-500/10 p-3 text-sm text-orange-200">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-orange-400" />
                    <div>
                      Existe um período de impacto em andamento. Encerre o período
                      antes de fechar o chamado.
                    </div>
                  </div>
                )}
                <div className="space-y-2">
                  <Label>Data/Hora de Normalização do Incidente *</Label>
                  <Input
                    type="datetime-local"
                    value={dataResolucao}
                    min={new Date(chamado.dataDeteccao).toISOString().slice(0, 16)}
                    onChange={(e) => setDataResolucao(e.target.value)}
                  />
                  {dataResolucao &&
                    new Date(dataResolucao).getTime() <
                      new Date(chamado.dataDeteccao).getTime() && (
                      <p className="text-xs text-destructive">
                        Não pode ser anterior ao início do incidente (
                        {formatDateTime(chamado.dataDeteccao)}).
                      </p>
                    )}
                </div>
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="semConfirmacao"
                    checked={semConfirmacaoOperadora}
                    onChange={(e) => setSemConfirmacaoOperadora(e.target.checked)}
                    className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <Label htmlFor="semConfirmacao" className="cursor-pointer">
                    Sem confirmação da operadora
                  </Label>
                </div>
                <div className="space-y-2">
                  <Label>Observação</Label>
                  <Textarea
                    placeholder="Observações sobre o fechamento..."
                    value={observacaoFechamento}
                    onChange={(e) => setObservacaoFechamento(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setDialogFechamento(false)}>
                  Cancelar
                </Button>
                <Button
                  variant="success"
                  onClick={handleFechamento}
                  disabled={
                    fechando ||
                    !dataResolucao ||
                    temPeriodoImpactoAberto ||
                    new Date(dataResolucao).getTime() <
                      new Date(chamado.dataDeteccao).getTime()
                  }
                >
                  {fechando ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    "Confirmar Fechamento"
                  )}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
            </>
          )}

          {/* Botão de Deletar - Apenas Supervisor */}
          {isSupervisor && (
            <>
              <AlertDialog open={dialogDelete} onOpenChange={setDialogDelete}>
                <AlertDialogTrigger asChild>
                  <Button variant="destructive">
                    <AlertTriangle className="mr-2 h-4 w-4" />
                    Excluir
                  </Button>
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Excluir Chamado</AlertDialogTitle>
                    <AlertDialogDescription>
                      Tem certeza que deseja excluir este chamado? Esta ação não pode ser desfeita.
                      Todos os dados relacionados (histórico, anexos, períodos de impacto) serão removidos permanentemente.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                    <AlertDialogAction
                      onClick={handleDelete}
                      disabled={deletando}
                      className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    >
                      {deletando ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        "Confirmar Exclusão"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Description */}
          <Card>
            <CardHeader>
              <CardTitle>Descrição do Problema</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{chamado.descricaoProblema}</p>
            </CardContent>
          </Card>

          {/* Closure Info */}
          {isFechado && chamado.causaRaiz && (
            <Card className="border-green-500/30 bg-green-500/5">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-green-500">
                  <CheckCircle2 className="h-5 w-5" />
                  Resolução
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Causa Raiz</h4>
                  <p className="mt-1">{chamado.causaRaiz}</p>
                </div>
                <div>
                  <h4 className="text-sm font-medium text-muted-foreground">Solução Aplicada</h4>
                  <p className="mt-1">{chamado.solucao}</p>
                </div>
                <div className="text-sm text-muted-foreground">
                  Fechado por {chamado.fechadoPor?.nome} em {formatDateTime(chamado.dataFechamento!)}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Timeline */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="h-5 w-5" />
                Timeline
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Add update form */}
              {!isFechado && (
                <div className="mb-6 space-y-3">
                  <Textarea
                    placeholder="Adicione uma atualização..."
                    value={novaAtualizacao}
                    onChange={(e) => setNovaAtualizacao(e.target.value)}
                    rows={2}
                  />
                  <div className="flex gap-2">
                    <Select value={novoStatus} onValueChange={setNovoStatus}>
                      <SelectTrigger className="w-[200px]">
                        <SelectValue placeholder="Alterar status (opcional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="em_andamento">Em Andamento</SelectItem>
                        <SelectItem value="aguardando_operadora">Aguardando Operadora</SelectItem>
                        <SelectItem value="resolvido">Resolvido</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button
                      onClick={handleAtualizacao}
                      disabled={atualizando || !novaAtualizacao.trim()}
                    >
                      {atualizando ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>
                          <Send className="mr-2 h-4 w-4" />
                          Enviar
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              )}

              {/* History */}
              <div className="space-y-4">
                {chamado.historicos.map((h) => (
                  <div key={h.id} className="flex gap-3 text-sm">
                    <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0">
                      <User className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{h.usuario.nome}</span>
                        <span className="text-muted-foreground text-xs">
                          {formatRelativeTime(h.criadoEm)}
                        </span>
                      </div>
                      <p className="text-muted-foreground mt-1">{h.descricao}</p>
                      {h.statusNovo && (
                        <Badge variant="outline" className="mt-2">
                          Status: {getStatusLabel(h.statusNovo)}
                        </Badge>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Anexos */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="h-5 w-5" />
                Anexos
              </CardTitle>
              <CardDescription>
                Anexe arquivos relacionados ao chamado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <FileUpload
                chamadoId={chamado.id}
                anexos={chamado.anexos || []}
                onUploadComplete={fetchChamado}
                disabled={isFechado}
              />
            </CardContent>
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Times */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Tempos
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Abertura</span>
                <span>{formatDateTime(chamado.dataAbertura)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Início do Incidente</span>
                <div className="flex items-center gap-2">
                  <span>{formatDateTime(chamado.dataDeteccao)}</span>
                  {!isFechado && (
                    <Dialog open={dialogEditDataDeteccao} onOpenChange={setDialogEditDataDeteccao}>
                      <DialogTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => setNovaDataDeteccao(new Date(chamado.dataDeteccao).toISOString().slice(0, 16))}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Início do Incidente</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="editDataDeteccao">Data e Hora de Início do Incidente</Label>
                            <Input
                              id="editDataDeteccao"
                              type="datetime-local"
                              value={novaDataDeteccao}
                              onChange={(e) => setNovaDataDeteccao(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogEditDataDeteccao(false)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSalvarDataDeteccao}
                            disabled={salvandoDataDeteccao || !novaDataDeteccao}
                          >
                            {salvandoDataDeteccao ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Salvar"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
              {chamado.dataResolucao && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Normalização do Incidente</span>
                  <span>{formatDateTime(chamado.dataResolucao)}</span>
                </div>
              )}
              {chamado.dataFechamento && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Fechamento</span>
                  <span>{formatDateTime(chamado.dataFechamento)}</span>
                </div>
              )}
              <Separator />
              <div className="rounded-md border border-primary/30 bg-primary/5 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-xs uppercase tracking-wide text-muted-foreground">
                      Tempo de Incidente
                    </span>
                    <span className="text-[11px] text-muted-foreground/80">
                      {chamado.dataNormalizacao
                        ? "Início → Normalização"
                        : "Em andamento"}
                    </span>
                  </div>
                  <span
                    className={`text-2xl font-bold tabular-nums ${
                      chamado.dataNormalizacao ? "" : "text-primary"
                    }`}
                  >
                    {calcularDuracao(
                      chamado.dataDeteccao,
                      chamado.dataNormalizacao
                    )}
                  </span>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>Tempo do chamado (até fechamento)</span>
                <span className="tabular-nums">
                  {calcularDuracao(chamado.dataAbertura, chamado.dataFechamento)}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Timeline de Períodos de Impacto */}
          <TimelineImpacto
            chamadoId={chamado.id}
            periodos={chamado.periodosImpacto || []}
            dataDeteccao={chamado.dataDeteccao}
            dataNormalizacao={chamado.dataNormalizacao}
            onUpdate={fetchChamado}
          />

          {/* Link Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Network className="h-5 w-5" />
                Link
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Designador</span>
                <p className="font-mono font-medium">{chamado.link?.designador}</p>
              </div>
              {chamado.link?.tipoServico && (
                <div>
                  <span className="text-muted-foreground">Tipo</span>
                  <p>{chamado.link.tipoServico} {chamado.link.capacidade && `(${chamado.link.capacidade})`}</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Operadora */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Operadora
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Nome</span>
                <p className="font-medium">{chamado.link?.operadora?.nome}</p>
              </div>
              {chamado.link?.operadora?.telefoneSuporte && (
                <div>
                  <span className="text-muted-foreground">Suporte</span>
                  <p>{chamado.link.operadora.telefoneSuporte}</p>
                </div>
              )}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-muted-foreground">Protocolo</span>
                  {!isFechado && (
                    <Dialog open={dialogEditProtocolo} onOpenChange={setDialogEditProtocolo}>
                      <DialogTrigger asChild>
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          className="h-6 w-6"
                          onClick={() => setNovoProtocolo(chamado.protocoloOperadora || "")}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Editar Protocolo da Operadora</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="editProtocolo">Protocolo da Operadora</Label>
                            <Input
                              id="editProtocolo"
                              type="text"
                              placeholder="Ex: INC123456"
                              value={novoProtocolo}
                              onChange={(e) => setNovoProtocolo(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setDialogEditProtocolo(false)}>
                            Cancelar
                          </Button>
                          <Button
                            onClick={handleSalvarProtocolo}
                            disabled={salvandoProtocolo}
                          >
                            {salvandoProtocolo ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              "Salvar"
                            )}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
                <p className="font-mono font-medium text-primary">
                  {chamado.protocoloOperadora || <span className="text-muted-foreground italic">Sem protocolo</span>}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* POP */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                POP
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Nome</span>
                <p className="font-medium">{chamado.link?.pop?.nome}</p>
              </div>
              <div>
                <span className="text-muted-foreground">Localização</span>
                <p>{chamado.link?.pop?.cidade}/{chamado.link?.pop?.estado}</p>
              </div>
            </CardContent>
          </Card>

          {/* Responsáveis */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Responsáveis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="text-muted-foreground">Aberto por</span>
                <p className="font-medium">{chamado.abertoPor?.nome}</p>
              </div>
              {chamado.fechadoPor && (
                <div>
                  <span className="text-muted-foreground">Fechado por</span>
                  <p className="font-medium">{chamado.fechadoPor.nome}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

