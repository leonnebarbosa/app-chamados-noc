"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { useToast } from "@/components/ui/use-toast"
import { 
  Settings, 
  Clock, 
  Bell, 
  Shield, 
  Database,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Code2,
  ExternalLink,
  BookOpen
} from "lucide-react"
import Link from "next/link"

interface ConfiguracaoSLA {
  impactoCritico: number
  impactoAlto: number
  impactoMedio: number
  impactoBaixo: number
  alertaPercentual: number
}

export default function ConfiguracoesPage() {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  
  // SLA por impacto (em horas)
  const [slaCritico, setSlaCritico] = useState("4")
  const [slaAlto, setSlaAlto] = useState("8")
  const [slaMedio, setSlaMedio] = useState("16")
  const [slaBaixo, setSlaBaixo] = useState("24")
  const [alertaPercentual, setAlertaPercentual] = useState("70")

  // Sistema
  const [nomeEmpresa, setNomeEmpresa] = useState("NOC Chamados")
  const [fusoHorario, setFusoHorario] = useState("America/Sao_Paulo")

  const handleSave = async () => {
    setSaving(true)
    
    // Simular salvamento (em produção, salvaria no banco)
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // Salvar no localStorage por enquanto
    localStorage.setItem("config_sla", JSON.stringify({
      critico: parseInt(slaCritico),
      alto: parseInt(slaAlto),
      medio: parseInt(slaMedio),
      baixo: parseInt(slaBaixo),
      alertaPercentual: parseInt(alertaPercentual),
    }))
    
    localStorage.setItem("config_sistema", JSON.stringify({
      nomeEmpresa,
      fusoHorario,
    }))
    
    toast({ title: "Configurações salvas!", description: "As alterações foram aplicadas com sucesso." })
    setSaving(false)
  }

  useEffect(() => {
    // Carregar configurações do localStorage
    try {
      const slaConfig = localStorage.getItem("config_sla")
      if (slaConfig) {
        const config = JSON.parse(slaConfig)
        setSlaCritico(String(config.critico || 4))
        setSlaAlto(String(config.alto || 8))
        setSlaMedio(String(config.medio || 16))
        setSlaBaixo(String(config.baixo || 24))
        setAlertaPercentual(String(config.alertaPercentual || 70))
      }
      
      const sistemaConfig = localStorage.getItem("config_sistema")
      if (sistemaConfig) {
        const config = JSON.parse(sistemaConfig)
        setNomeEmpresa(config.nomeEmpresa || "NOC Chamados")
        setFusoHorario(config.fusoHorario || "America/Sao_Paulo")
      }
    } catch (e) {
      console.error("Erro ao carregar configurações:", e)
    }
  }, [])

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Configurações</h1>
          <p className="text-muted-foreground">Configurações gerais do sistema</p>
        </div>
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Save className="mr-2 h-4 w-4" />
          )}
          Salvar Alterações
        </Button>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* SLA */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              SLA por Impacto
            </CardTitle>
            <CardDescription>
              Define o tempo máximo (em horas) para resolução de chamados por nível de impacto
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="critical">Crítico</Badge>
                  <span className="text-sm text-muted-foreground">
                    Serviço totalmente indisponível
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="168"
                    value={slaCritico}
                    onChange={(e) => setSlaCritico(e.target.value)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="high">Alto</Badge>
                  <span className="text-sm text-muted-foreground">
                    Impacto significativo
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="168"
                    value={slaAlto}
                    onChange={(e) => setSlaAlto(e.target.value)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="medium">Médio</Badge>
                  <span className="text-sm text-muted-foreground">
                    Impacto moderado
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="168"
                    value={slaMedio}
                    onChange={(e) => setSlaMedio(e.target.value)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Badge variant="low">Baixo</Badge>
                  <span className="text-sm text-muted-foreground">
                    Impacto mínimo
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min="1"
                    max="168"
                    value={slaBaixo}
                    onChange={(e) => setSlaBaixo(e.target.value)}
                    className="w-20 text-center"
                  />
                  <span className="text-sm text-muted-foreground">horas</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Alertas */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Alertas de SLA
            </CardTitle>
            <CardDescription>
              Configure quando os alertas de SLA devem ser disparados
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Percentual de alerta</Label>
              <div className="flex items-center gap-4">
                <Input
                  type="number"
                  min="50"
                  max="95"
                  value={alertaPercentual}
                  onChange={(e) => setAlertaPercentual(e.target.value)}
                  className="w-24"
                />
                <span className="text-sm text-muted-foreground">% do SLA</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Um alerta será exibido quando o chamado atingir este percentual do tempo de SLA
              </p>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Níveis de alerta</Label>
              <div className="grid gap-2 text-sm">
                <div className="flex items-center gap-2 p-2 rounded bg-yellow-500/10">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-yellow-700 dark:text-yellow-300">
                    Atenção: {alertaPercentual}% a 89% do SLA
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-orange-500/10">
                  <AlertTriangle className="h-4 w-4 text-orange-500" />
                  <span className="text-orange-700 dark:text-orange-300">
                    Crítico: 90% a 99% do SLA
                  </span>
                </div>
                <div className="flex items-center gap-2 p-2 rounded bg-red-500/10">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  <span className="text-red-700 dark:text-red-300">
                    Estourado: 100%+ do SLA
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sistema */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Sistema
            </CardTitle>
            <CardDescription>
              Configurações gerais do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da Empresa/Sistema</Label>
              <Input
                value={nomeEmpresa}
                onChange={(e) => setNomeEmpresa(e.target.value)}
                placeholder="NOC Chamados"
              />
            </div>

            <div className="space-y-2">
              <Label>Fuso Horário</Label>
              <Select value={fusoHorario} onValueChange={setFusoHorario}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="America/Sao_Paulo">Brasília (GMT-3)</SelectItem>
                  <SelectItem value="America/Manaus">Manaus (GMT-4)</SelectItem>
                  <SelectItem value="America/Cuiaba">Cuiabá (GMT-4)</SelectItem>
                  <SelectItem value="America/Fortaleza">Fernando de Noronha (GMT-2)</SelectItem>
                  <SelectItem value="America/Rio_Branco">Rio Branco (GMT-5)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Informações do Sistema
            </CardTitle>
            <CardDescription>
              Informações técnicas do sistema
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Versão</span>
                <span className="font-mono">1.2.3</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Framework</span>
                <span className="font-mono">Next.js 14</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Banco de Dados</span>
                <span className="font-mono">SQLite / PostgreSQL</span>
              </div>
              <Separator />
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="success" className="gap-1">
                  <CheckCircle2 className="h-3 w-3" />
                  Operacional
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* API */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code2 className="h-5 w-5" />
              Documentação da API REST
            </CardTitle>
            <CardDescription>
              Acesse a documentação interativa para integrar com sistemas externos
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <Link href="/api-docs" target="_blank">
                <Button variant="outline" className="w-full h-full flex flex-col gap-2 p-6">
                  <BookOpen className="h-6 w-6 text-primary" />
                  <div className="text-center">
                    <p className="font-semibold">Swagger UI</p>
                    <p className="text-xs text-muted-foreground">Documentação interativa</p>
                  </div>
                  <ExternalLink className="h-3 w-3 text-muted-foreground" />
                </Button>
              </Link>

              <div className="flex flex-col gap-2 p-6 border rounded-lg">
                <Code2 className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">Base URL</p>
                  <p className="text-xs text-muted-foreground font-mono break-all">
                    https://chamados.xmov.com.br/api
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-2 p-6 border rounded-lg">
                <Shield className="h-6 w-6 text-muted-foreground" />
                <div>
                  <p className="font-semibold text-sm">Autenticação</p>
                  <p className="text-xs text-muted-foreground">
                    JWT via HTTPOnly Cookie
                  </p>
                </div>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <p className="text-sm font-medium">Recursos Disponíveis:</p>
              <div className="grid gap-2 text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>70+ endpoints documentados (Chamados, Links, Operadoras, Relatórios, etc.)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Teste de endpoints direto no navegador com interface interativa</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Especificação OpenAPI 3.0 para gerar clientes em 60+ linguagens</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Exemplos de requisições e respostas para cada endpoint</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Coleção Postman disponível para download</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}


