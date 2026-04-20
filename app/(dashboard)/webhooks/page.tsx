"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { Switch } from "@/components/ui/switch"
import { Checkbox } from "@/components/ui/checkbox"
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { useToast } from "@/components/ui/use-toast"
import {
  Webhook,
  Plus,
  Trash2,
  Edit,
  Play,
  Pause,
  Activity,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
} from "lucide-react"
import { EVENTOS_DISPONIVEIS } from "@/lib/webhook"

interface WebhookConfig {
  id: number
  nome: string
  url: string
  ativo: boolean
  eventos: string
  headers: string | null
  metodo: string
  timeout: number
  retentativas: number
  criadoEm: string
  atualizadoEm: string
}

interface WebhookLog {
  id: number
  webhookConfigId: number | null
  evento: string
  url: string
  statusCode: number | null
  sucesso: boolean
  tempoResposta: number | null
  erro: string | null
  criadoEm: string
}

export default function WebhooksPage() {
  const { toast } = useToast()
  const [webhooks, setWebhooks] = useState<WebhookConfig[]>([])
  const [logs, setLogs] = useState<WebhookLog[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogLogsOpen, setDialogLogsOpen] = useState(false)
  const [editingWebhook, setEditingWebhook] = useState<WebhookConfig | null>(null)
  const [saving, setSaving] = useState(false)

  // Form state
  const [nome, setNome] = useState("")
  const [url, setUrl] = useState("")
  const [ativo, setAtivo] = useState(true)
  const [eventosSelecionados, setEventosSelecionados] = useState<string[]>([])
  const [headers, setHeaders] = useState("")
  const [metodo, setMetodo] = useState("POST")
  const [timeout, setTimeout] = useState("30")
  const [retentativas, setRetentativas] = useState("3")

  useEffect(() => {
    carregarWebhooks()
  }, [])

  const carregarWebhooks = async () => {
    try {
      const res = await fetch("/api/webhooks")
      if (!res.ok) throw new Error("Erro ao carregar webhooks")
      const data = await res.json()
      setWebhooks(data)
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os webhooks",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const carregarLogs = async (webhookId?: number) => {
    setLoadingLogs(true)
    try {
      const url = webhookId
        ? `/api/webhooks/logs?webhookId=${webhookId}`
        : "/api/webhooks/logs"
      const res = await fetch(url)
      if (!res.ok) throw new Error("Erro ao carregar logs")
      const data = await res.json()
      setLogs(data)
      setDialogLogsOpen(true)
    } catch (error) {
      console.error(error)
      toast({
        title: "Erro",
        description: "Não foi possível carregar os logs",
        variant: "destructive",
      })
    } finally {
      setLoadingLogs(false)
    }
  }

  const abrirDialogNovo = () => {
    setEditingWebhook(null)
    resetForm()
    setDialogOpen(true)
  }

  const abrirDialogEditar = (webhook: WebhookConfig) => {
    setEditingWebhook(webhook)
    setNome(webhook.nome)
    setUrl(webhook.url)
    setAtivo(webhook.ativo)
    setEventosSelecionados(JSON.parse(webhook.eventos))
    setHeaders(webhook.headers || "")
    setMetodo(webhook.metodo)
    setTimeout(String(webhook.timeout))
    setRetentativas(String(webhook.retentativas))
    setDialogOpen(true)
  }

  const resetForm = () => {
    setNome("")
    setUrl("")
    setAtivo(true)
    setEventosSelecionados([])
    setHeaders("")
    setMetodo("POST")
    setTimeout("30")
    setRetentativas("3")
  }

  const handleSalvar = async () => {
    if (!nome || !url) {
      toast({
        title: "Erro",
        description: "Nome e URL são obrigatórios",
        variant: "destructive",
      })
      return
    }

    if (eventosSelecionados.length === 0) {
      toast({
        title: "Erro",
        description: "Selecione pelo menos um evento",
        variant: "destructive",
      })
      return
    }

    setSaving(true)

    try {
      const payload = {
        nome,
        url,
        ativo,
        eventos: eventosSelecionados,
        headers: headers ? JSON.parse(headers) : null,
        metodo,
        timeout: parseInt(timeout),
        retentativas: parseInt(retentativas),
      }

      const res = editingWebhook
        ? await fetch(`/api/webhooks/${editingWebhook.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })
        : await fetch("/api/webhooks", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          })

      if (!res.ok) {
        const error = await res.json()
        throw new Error(error.error || "Erro ao salvar webhook")
      }

      toast({
        title: "Sucesso",
        description: editingWebhook
          ? "Webhook atualizado com sucesso"
          : "Webhook criado com sucesso",
      })

      setDialogOpen(false)
      resetForm()
      carregarWebhooks()
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  const handleDeletar = async (id: number) => {
    if (!confirm("Tem certeza que deseja deletar este webhook?")) {
      return
    }

    try {
      const res = await fetch(`/api/webhooks/${id}`, {
        method: "DELETE",
      })

      if (!res.ok) throw new Error("Erro ao deletar webhook")

      toast({
        title: "Sucesso",
        description: "Webhook deletado com sucesso",
      })

      carregarWebhooks()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o webhook",
        variant: "destructive",
      })
    }
  }

  const toggleAtivo = async (webhook: WebhookConfig) => {
    try {
      const res = await fetch(`/api/webhooks/${webhook.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ativo: !webhook.ativo }),
      })

      if (!res.ok) throw new Error("Erro ao atualizar webhook")

      toast({
        title: "Sucesso",
        description: `Webhook ${!webhook.ativo ? "ativado" : "desativado"} com sucesso`,
      })

      carregarWebhooks()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível atualizar o webhook",
        variant: "destructive",
      })
    }
  }

  const toggleEvento = (evento: string) => {
    setEventosSelecionados((prev) =>
      prev.includes(evento)
        ? prev.filter((e) => e !== evento)
        : [...prev, evento]
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Webhook className="h-7 w-7" />
            Webhooks
          </h1>
          <p className="text-muted-foreground">
            Configure webhooks para integrar com sistemas externos
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => carregarLogs()}>
            <Activity className="mr-2 h-4 w-4" />
            Ver Logs
          </Button>
          <Button onClick={abrirDialogNovo}>
            <Plus className="mr-2 h-4 w-4" />
            Novo Webhook
          </Button>
        </div>
      </div>

      {webhooks.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <Webhook className="h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground text-center mb-4">
              Nenhum webhook configurado ainda
            </p>
            <Button onClick={abrirDialogNovo}>
              <Plus className="mr-2 h-4 w-4" />
              Criar Primeiro Webhook
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Eventos</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {webhooks.map((webhook) => {
                const eventos = JSON.parse(webhook.eventos)
                return (
                  <TableRow key={webhook.id}>
                    <TableCell className="font-medium">{webhook.nome}</TableCell>
                    <TableCell>
                      <code className="text-xs bg-muted px-2 py-1 rounded">
                        {webhook.url}
                      </code>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {eventos.slice(0, 2).map((evento: string) => (
                          <Badge key={evento} variant="secondary" className="text-xs">
                            {evento.split(".")[1]}
                          </Badge>
                        ))}
                        {eventos.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{eventos.length - 2}
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {webhook.ativo ? (
                        <Badge variant="success" className="gap-1">
                          <CheckCircle2 className="h-3 w-3" />
                          Ativo
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="gap-1">
                          <Pause className="h-3 w-3" />
                          Inativo
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => carregarLogs(webhook.id)}
                        >
                          <Activity className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => toggleAtivo(webhook)}
                        >
                          {webhook.ativo ? (
                            <Pause className="h-4 w-4" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => abrirDialogEditar(webhook)}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeletar(webhook.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </Card>
      )}

      {/* Dialog para criar/editar webhook */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editingWebhook ? "Editar Webhook" : "Novo Webhook"}
            </DialogTitle>
            <DialogDescription>
              Configure um webhook para receber notificações de eventos do sistema
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="nome">Nome do Webhook</Label>
              <Input
                id="nome"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Ex: Notificação Slack"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="url">URL do Endpoint</Label>
              <Input
                id="url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://exemplo.com/webhook"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="ativo"
                checked={ativo}
                onCheckedChange={setAtivo}
              />
              <Label htmlFor="ativo">Webhook ativo</Label>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Eventos</Label>
              <p className="text-sm text-muted-foreground mb-3">
                Selecione os eventos que dispararão este webhook
              </p>
              <div className="space-y-2">
                {EVENTOS_DISPONIVEIS.map((evento) => (
                  <div key={evento.valor} className="flex items-start space-x-2">
                    <Checkbox
                      id={evento.valor}
                      checked={eventosSelecionados.includes(evento.valor)}
                      onCheckedChange={() => toggleEvento(evento.valor)}
                    />
                    <div className="grid gap-1">
                      <Label
                        htmlFor={evento.valor}
                        className="font-medium cursor-pointer"
                      >
                        {evento.label}
                      </Label>
                      <p className="text-xs text-muted-foreground">
                        {evento.descricao}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="metodo">Método HTTP</Label>
                <Select value={metodo} onValueChange={setMetodo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="POST">POST</SelectItem>
                    <SelectItem value="PUT">PUT</SelectItem>
                    <SelectItem value="PATCH">PATCH</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="timeout">Timeout (segundos)</Label>
                <Input
                  id="timeout"
                  type="number"
                  value={timeout}
                  onChange={(e) => setTimeout(e.target.value)}
                  min="5"
                  max="120"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="retentativas">Tentativas em caso de falha</Label>
              <Input
                id="retentativas"
                type="number"
                value={retentativas}
                onChange={(e) => setRetentativas(e.target.value)}
                min="1"
                max="10"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="headers">Headers Customizados (JSON)</Label>
              <Textarea
                id="headers"
                value={headers}
                onChange={(e) => setHeaders(e.target.value)}
                placeholder='{"Authorization": "Bearer token", "X-Custom-Header": "value"}'
                rows={4}
              />
              <p className="text-xs text-muted-foreground">
                Opcional: Headers HTTP adicionais em formato JSON
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancelar
            </Button>
            <Button onClick={handleSalvar} disabled={saving}>
              {saving ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : editingWebhook ? (
                "Atualizar"
              ) : (
                "Criar"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog para visualizar logs */}
      <Dialog open={dialogLogsOpen} onOpenChange={setDialogLogsOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Logs de Webhooks</DialogTitle>
            <DialogDescription>
              Histórico de disparos de webhooks
            </DialogDescription>
          </DialogHeader>

          {loadingLogs ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum log encontrado
            </div>
          ) : (
            <div className="overflow-auto max-h-[60vh]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Evento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tempo</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {logs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        {new Date(log.criadoEm).toLocaleString("pt-BR")}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{log.evento}</Badge>
                      </TableCell>
                      <TableCell>
                        {log.sucesso ? (
                          <div className="flex items-center gap-2">
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                            <span className="text-sm">{log.statusCode}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <XCircle className="h-4 w-4 text-red-500" />
                            <span className="text-sm text-red-500">
                              {log.erro || "Erro"}
                            </span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell>
                        {log.tempoResposta ? `${log.tempoResposta}ms` : "-"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          <DialogFooter>
            <Button onClick={() => setDialogLogsOpen(false)}>Fechar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

