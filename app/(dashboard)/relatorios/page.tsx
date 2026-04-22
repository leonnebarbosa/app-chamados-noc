"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/components/ui/use-toast"
import { 
  BarChart3, 
  Loader2, 
  TrendingUp, 
  Clock, 
  CheckCircle2,
  AlertTriangle,
  Building2,
  MapPin,
  Filter,
  Download,
  FileSpreadsheet,
  FileText
} from "lucide-react"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from "recharts"
import { 
  exportToExcel, 
  exportToPDF,
  formatMTTRForExport,
  formatIncidentesPorPOPForExport,
  formatIncidentesPorTipoForExport,
  exportRelatorioLinkPDF,
  exportRelatorioDashboardPDF,
} from "@/lib/export"
import { Checkbox } from "@/components/ui/checkbox"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

interface ResumoData {
  totalChamados: number
  chamadosAbertos: number
  chamadosFechados: number
  mttrHoras: number
  taxaResolucao: number
  impactoData: Array<{ name: string; value: number; color: string }>
}

interface OperadoraData {
  nome: string
  total: number
  fechados: number
  abertos: number
  criticos: number
  mttr: number
  taxaResolucao: number
}

interface PopData {
  nome: string
  cidade: string
  estado: string
  total: number
  criticos: number
}

interface TendenciaData {
  mes: string
  abertos: number
  fechados: number
  criticos: number
}

interface TipoFalhaData {
  nome: string
  total: number
}

interface KPIData {
  valor: number
  unidade: string
  label: string
  descricao: string
  amostra: number
  totalPeriodos?: number
}

interface KPIsData {
  mttr: KPIData
  mtti: KPIData
  totalHorasIncidente: KPIData
  disponibilidade: KPIData
}

interface LinkProblematico {
  id: number
  designador: string
  operadora: string
  pop: string
  capacidade: string | null
  totalChamados: number
  chamadosCriticos: number
  tempoIndisponivel: number
  chamadosAbertos: number
}

export default function RelatoriosPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [periodo, setPeriodo] = useState("30")
  const [dataInicio, setDataInicio] = useState("")
  const [dataFim, setDataFim] = useState("")

  const [resumo, setResumo] = useState<ResumoData | null>(null)
  const [kpis, setKpis] = useState<KPIsData | null>(null)
  const [operadoras, setOperadoras] = useState<OperadoraData[]>([])
  const [pops, setPops] = useState<PopData[]>([])
  const [tendencia, setTendencia] = useState<TendenciaData[]>([])
  const [tiposFalha, setTiposFalha] = useState<TipoFalhaData[]>([])
  const [linksProblematicos, setLinksProblematicos] = useState<LinkProblematico[]>([])
  
  // Estados para exportação por link/transporte
  const [todosLinks, setTodosLinks] = useState<{id: number, designador: string, operadora: string, diaVencimento: number | null}[]>([])
  const [todosTransportes, setTodosTransportes] = useState<{id: number, designador: string, operadora: string, diaVencimento: number | null}[]>([])
  const [linksSelecionados, setLinksSelecionados] = useState<number[]>([])
  const [transportesSelecionados, setTransportesSelecionados] = useState<number[]>([])
  const [exportandoLinks, setExportandoLinks] = useState(false)
  const [todasOperadoras, setTodasOperadoras] = useState<{id: number, nome: string}[]>([])
  const [operadoraFiltro, setOperadoraFiltro] = useState<string>("todas")
  
  // Estado para mês de referência na exportação
  const [mesReferencia, setMesReferencia] = useState(() => {
    const hoje = new Date()
    return `${hoje.getFullYear()}-${String(hoje.getMonth() + 1).padStart(2, "0")}`
  })

  useEffect(() => {
    // Calcular datas baseado no período
    const hoje = new Date()
    let inicio = new Date()
    
    if (periodo !== "custom") {
      inicio.setDate(hoje.getDate() - parseInt(periodo))
      setDataInicio(inicio.toISOString().split("T")[0])
      setDataFim(hoje.toISOString().split("T")[0])
    }
  }, [periodo])

  useEffect(() => {
    if (dataInicio && dataFim) {
      fetchRelatorios()
    }
  }, [dataInicio, dataFim])

  const fetchRelatorios = async () => {
    setLoading(true)
    try {
      const params = `dataInicio=${dataInicio}&dataFim=${dataFim}`
      
      const [resumoRes, kpisRes, operadorasRes, popsRes, tendenciaRes, tiposRes, linksRes] = await Promise.all([
        fetch(`/api/relatorios?tipo=resumo&${params}`),
        fetch(`/api/relatorios?tipo=kpis&${params}`),
        fetch(`/api/relatorios?tipo=operadoras&${params}`),
        fetch(`/api/relatorios?tipo=pops&${params}`),
        fetch(`/api/relatorios?tipo=mensal`),
        fetch(`/api/relatorios?tipo=tiposFalha&${params}`),
        fetch(`/api/relatorios?tipo=linksProblematicos&${params}`),
      ])

      if (resumoRes.ok) setResumo(await resumoRes.json())
      if (kpisRes.ok) setKpis(await kpisRes.json())
      if (operadorasRes.ok) setOperadoras(await operadorasRes.json())
      if (popsRes.ok) setPops(await popsRes.json())
      if (tendenciaRes.ok) setTendencia(await tendenciaRes.json())
      if (tiposRes.ok) setTiposFalha(await tiposRes.json())
      if (linksRes.ok) setLinksProblematicos(await linksRes.json())
      
      // Buscar lista de todos os links para exportação
      const linksListRes = await fetch("/api/links")
      if (linksListRes.ok) {
        const linksList = await linksListRes.json()
        setTodosLinks(linksList.map((l: any) => ({
          id: l.id,
          designador: l.designador,
          operadora: l.operadora?.nome || "Sem operadora",
          diaVencimento: l.diaVencimento
        })))
      }
      
      // Buscar lista de todos os transportes para exportação
      const transportesListRes = await fetch("/api/transportes")
      let transportesList: any[] = []
      if (transportesListRes.ok) {
        transportesList = await transportesListRes.json()
        setTodosTransportes(transportesList.map((t: any) => ({
          id: t.id,
          designador: t.nome,
          operadora: t.fornecedor || "Sem fornecedor",
          diaVencimento: null // Transportes não têm dia de vencimento
        })))
      }
      
      // Buscar lista de operadoras
      const operadorasListRes = await fetch("/api/operadoras")
      if (operadorasListRes.ok) {
        const operadorasList = await operadorasListRes.json()
        const operadorasDeLinks = operadorasList.map((o: any) => o.nome)
        
        // Incluir fornecedores de transportes como "operadoras" para filtro
        const fornecedoresUnicos = Array.from(new Set(transportesList.map((t: any) => t.fornecedor).filter(Boolean)))
        const todasOperadorasEFornecedores = Array.from(new Set([...operadorasDeLinks, ...fornecedoresUnicos])).sort()
        
        setTodasOperadoras(todasOperadorasEFornecedores.map((nome, idx) => ({
          id: idx,
          nome: nome
        })))
      }
    } catch (error) {
      console.error("Erro ao carregar relatórios:", error)
    } finally {
      setLoading(false)
    }
  }

  // Função para exportar relatórios por link
  // Calcular período baseado no mês de referência
  const calcularPeriodoMesReferencia = () => {
    const [ano, mes] = mesReferencia.split("-").map(Number)
    // Primeiro dia do mês
    const inicio = new Date(ano, mes - 1, 1)
    // Último dia do mês
    const fim = new Date(ano, mes, 0)
    return {
      dataInicio: inicio.toISOString().split("T")[0],
      dataFim: fim.toISOString().split("T")[0],
      mesNome: inicio.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })
    }
  }

  const exportarRelatoriosLinks = async () => {
    if (totalSelecionados === 0) {
      toast({ title: "Selecione ao menos um link ou transporte", variant: "destructive" })
      return
    }

    setExportandoLinks(true)
    const periodoExport = calcularPeriodoMesReferencia()
    const params = `dataInicio=${periodoExport.dataInicio}&dataFim=${periodoExport.dataFim}`
    let exportados = 0
    let erros = 0

    // Exportar links selecionados
    for (const linkId of linksSelecionados) {
      try {
        const res = await fetch(`/api/relatorios?tipo=relatorioLink&linkId=${linkId}&${params}`)
        if (res.ok) {
          const relatorio = await res.json()
          exportRelatorioLinkPDF(relatorio, "NOC")
          exportados++
          // Pequeno delay entre downloads para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          erros++
        }
      } catch (error) {
        console.error(`Erro ao exportar link ${linkId}:`, error)
        erros++
      }
    }
    
    // Exportar transportes selecionados
    for (const transporteId of transportesSelecionados) {
      try {
        const res = await fetch(`/api/relatorios?tipo=relatorioTransporte&transporteId=${transporteId}&${params}`)
        if (res.ok) {
          const relatorio = await res.json()
          exportRelatorioLinkPDF(relatorio, "NOC")
          exportados++
          // Pequeno delay entre downloads para não sobrecarregar
          await new Promise(resolve => setTimeout(resolve, 500))
        } else {
          erros++
        }
      } catch (error) {
        console.error(`Erro ao exportar transporte ${transporteId}:`, error)
        erros++
      }
    }

    setExportandoLinks(false)
    setLinksSelecionados([])
    setTransportesSelecionados([])
    
    if (erros > 0) {
      toast({ 
        title: `${exportados} relatório(s) exportado(s)`, 
        description: `${erros} erro(s) ocorreram`,
        variant: "destructive"
      })
    } else {
      toast({ title: `${exportados} relatório(s) exportado(s) com sucesso!` })
    }
  }

  const toggleLinkSelecionado = (linkId: number) => {
    setLinksSelecionados(prev => 
      prev.includes(linkId) 
        ? prev.filter(id => id !== linkId)
        : [...prev, linkId]
    )
  }
  
  const toggleTransporteSelecionado = (transporteId: number) => {
    setTransportesSelecionados(prev => 
      prev.includes(transporteId) 
        ? prev.filter(id => id !== transporteId)
        : [...prev, transporteId]
    )
  }

  const selecionarTodos = () => {
    const linksFiltrados = linksFiltradosPorOperadora()
    const transportesFiltrados = transportesFiltradosPorOperadora()
    const todosLinksSelecionados = linksFiltrados.every(l => linksSelecionados.includes(l.id))
    const todosTransportesSelecionados = transportesFiltrados.every(t => transportesSelecionados.includes(t.id))
    
    if (todosLinksSelecionados && todosTransportesSelecionados) {
      setLinksSelecionados([])
      setTransportesSelecionados([])
    } else {
      setLinksSelecionados(linksFiltrados.map(l => l.id))
      setTransportesSelecionados(transportesFiltrados.map(t => t.id))
    }
  }
  
  const linksFiltradosPorOperadora = () => {
    if (operadoraFiltro === "todas") return todosLinks
    return todosLinks.filter(l => l.operadora === operadoraFiltro)
  }
  
  const transportesFiltradosPorOperadora = () => {
    if (operadoraFiltro === "todas") return todosTransportes
    return todosTransportes.filter(t => t.operadora === operadoraFiltro)
  }
  
  const totalSelecionados = linksSelecionados.length + transportesSelecionados.length
  const totalItens = linksFiltradosPorOperadora().length + transportesFiltradosPorOperadora().length

  // Funções de exportação
  const exportarOperadoras = (formato: "excel" | "pdf") => {
    const data = operadoras.map(op => ({
      operadora: op.nome,
      mttrHoras: op.mttr,
      totalChamados: op.total,
      chamadosFechados: op.fechados,
    }))

    if (formato === "excel") {
      exportToExcel(formatMTTRForExport(data), `relatorio-operadoras-${dataInicio}-${dataFim}`, "Operadoras")
      toast({ title: "Excel exportado!", description: "O arquivo foi baixado com sucesso" })
    } else {
      exportToPDF(
        formatMTTRForExport(data),
        [
          { header: "Operadora", dataKey: "Operadora" },
          { header: "MTTR (horas)", dataKey: "MTTR (horas)" },
          { header: "Total de Chamados", dataKey: "Total de Chamados" },
          { header: "Chamados Fechados", dataKey: "Chamados Fechados" },
        ],
        `relatorio-operadoras-${dataInicio}-${dataFim}`,
        `Relatório de Performance por Operadora - ${dataInicio} a ${dataFim}`
      )
      toast({ title: "PDF exportado!", description: "O arquivo foi baixado com sucesso" })
    }
  }

  const exportarPOPs = (formato: "excel" | "pdf") => {
    const data = pops.map(p => ({
      pop: p.nome,
      cidade: p.cidade,
      estado: p.estado,
      total: p.total,
    }))

    if (formato === "excel") {
      exportToExcel(formatIncidentesPorPOPForExport(data), `relatorio-pops-${dataInicio}-${dataFim}`, "POPs")
      toast({ title: "Excel exportado!", description: "O arquivo foi baixado com sucesso" })
    } else {
      exportToPDF(
        formatIncidentesPorPOPForExport(data),
        [
          { header: "POP", dataKey: "POP" },
          { header: "Cidade", dataKey: "Cidade" },
          { header: "Estado", dataKey: "Estado" },
          { header: "Total de Incidentes", dataKey: "Total de Incidentes" },
        ],
        `relatorio-pops-${dataInicio}-${dataFim}`,
        `Relatório de Incidentes por POP - ${dataInicio} a ${dataFim}`
      )
      toast({ title: "PDF exportado!", description: "O arquivo foi baixado com sucesso" })
    }
  }

  const exportarTiposFalha = (formato: "excel" | "pdf") => {
    const total = tiposFalha.reduce((acc, t) => acc + t.total, 0)
    const data = tiposFalha.map(t => ({
      tipo: t.nome,
      total: t.total,
      percentual: (t.total / total) * 100,
    }))

    if (formato === "excel") {
      exportToExcel(formatIncidentesPorTipoForExport(data), `relatorio-tipos-falha-${dataInicio}-${dataFim}`, "Tipos de Falha")
      toast({ title: "Excel exportado!", description: "O arquivo foi baixado com sucesso" })
    } else {
      exportToPDF(
        formatIncidentesPorTipoForExport(data),
        [
          { header: "Tipo de Falha", dataKey: "Tipo de Falha" },
          { header: "Total de Incidentes", dataKey: "Total de Incidentes" },
          { header: "Percentual", dataKey: "Percentual" },
        ],
        `relatorio-tipos-falha-${dataInicio}-${dataFim}`,
        `Relatório de Incidentes por Tipo de Falha - ${dataInicio} a ${dataFim}`
      )
      toast({ title: "PDF exportado!", description: "O arquivo foi baixado com sucesso" })
    }
  }

  const exportarTendencia = (formato: "excel" | "pdf") => {
    const data = tendencia.map(t => ({
      Mês: t.mes,
      "Chamados Abertos": t.abertos,
      "Chamados Fechados": t.fechados,
      "Chamados Críticos": t.criticos,
    }))

    if (formato === "excel") {
      exportToExcel(data, `relatorio-tendencia-mensal`, "Tendência")
      toast({ title: "Excel exportado!", description: "O arquivo foi baixado com sucesso" })
    } else {
      exportToPDF(
        data,
        [
          { header: "Mês", dataKey: "Mês" },
          { header: "Chamados Abertos", dataKey: "Chamados Abertos" },
          { header: "Chamados Fechados", dataKey: "Chamados Fechados" },
          { header: "Chamados Críticos", dataKey: "Chamados Críticos" },
        ],
        `relatorio-tendencia-mensal`,
        `Relatório de Tendência Mensal`
      )
      toast({ title: "PDF exportado!", description: "O arquivo foi baixado com sucesso" })
    }
  }

  const exportarResumoGeral = (formato: "excel" | "pdf") => {
    if (!resumo) return

    const data = [
      { Métrica: "Total de Chamados", Valor: resumo.totalChamados },
      { Métrica: "Chamados Abertos", Valor: resumo.chamadosAbertos },
      { Métrica: "Chamados Fechados", Valor: resumo.chamadosFechados },
      { Métrica: "MTTR (horas)", Valor: resumo.mttrHoras },
      { Métrica: "Taxa de Resolução (%)", Valor: resumo.taxaResolucao },
    ]

    if (formato === "excel") {
      exportToExcel(data, `relatorio-resumo-${dataInicio}-${dataFim}`, "Resumo")
      toast({ title: "Excel exportado!", description: "O arquivo foi baixado com sucesso" })
    } else {
      exportToPDF(
        data,
        [
          { header: "Métrica", dataKey: "Métrica" },
          { header: "Valor", dataKey: "Valor" },
        ],
        `relatorio-resumo-${dataInicio}-${dataFim}`,
        `Relatório Resumo - ${dataInicio} a ${dataFim}`
      )
      toast({ title: "PDF exportado!", description: "O arquivo foi baixado com sucesso" })
    }
  }

  const exportarRelatorioExecutivo = () => {
    if (!resumo) {
      toast({ title: "Carregando dados...", description: "Aguarde o carregamento completo", variant: "destructive" })
      return
    }

    try {
      exportRelatorioDashboardPDF({
        resumo,
        kpis,
        operadoras,
        pops,
        tiposFalha,
        linksProblematicos,
        tendencia,
        periodo: {
          inicio: new Date(dataInicio).toLocaleDateString("pt-BR"),
          fim: new Date(dataFim).toLocaleDateString("pt-BR")
        }
      }, "NOC")
      
      toast({ title: "Relatório exportado!", description: "PDF executivo gerado com sucesso" })
    } catch (error) {
      toast({ title: "Erro ao exportar", description: "Tente novamente", variant: "destructive" })
    }
  }

  if (loading && !resumo) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Relatórios</h1>
          <p className="text-muted-foreground">
            Análise de performance e métricas do NOC
          </p>
        </div>
        
        {/* Botão Exportar */}
        <div className="flex gap-2">
          <Button onClick={exportarRelatorioExecutivo} className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700">
            <FileText className="mr-2 h-4 w-4" />
            PDF Executivo
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Exportar
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportarResumoGeral("excel")}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Resumo (Excel)
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportarResumoGeral("pdf")}>
                <FileText className="mr-2 h-4 w-4 text-red-600" />
                Resumo (PDF)
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="relatorios" className="space-y-6">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="relatorios" className="gap-2">
            <BarChart3 className="h-4 w-4" />
            Relatórios
          </TabsTrigger>
          <TabsTrigger value="exportacao" className="gap-2">
            <FileText className="h-4 w-4" />
            Exportar para Operadora
          </TabsTrigger>
        </TabsList>

        <TabsContent value="relatorios" className="space-y-6">
          {/* Filtros - apenas na aba Relatórios */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4 items-end">
                <div className="space-y-2">
                  <Label>Período</Label>
                  <Select value={periodo} onValueChange={setPeriodo}>
                    <SelectTrigger className="w-[180px]">
                      <Filter className="mr-2 h-4 w-4" />
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="7">Últimos 7 dias</SelectItem>
                      <SelectItem value="30">Últimos 30 dias</SelectItem>
                      <SelectItem value="90">Últimos 90 dias</SelectItem>
                      <SelectItem value="365">Último ano</SelectItem>
                      <SelectItem value="custom">Personalizado</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {periodo === "custom" && (
                  <>
                    <div className="space-y-2">
                      <Label>Data Início</Label>
                      <Input
                        type="date"
                        value={dataInicio}
                        onChange={(e) => setDataInicio(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Data Fim</Label>
                      <Input
                        type="date"
                        value={dataFim}
                        onChange={(e) => setDataFim(e.target.value)}
                      />
                    </div>
                  </>
                )}
                <Button onClick={fetchRelatorios} disabled={loading}>
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Atualizar"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* KPIs */}
      {resumo && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="bg-gradient-to-br from-card to-blue-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Chamados</CardTitle>
              <BarChart3 className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{resumo.totalChamados}</div>
              <p className="text-xs text-muted-foreground">
                {resumo.chamadosAbertos} abertos • {resumo.chamadosFechados} fechados
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-green-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Taxa de Resolução</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-500">{resumo.taxaResolucao}%</div>
              <p className="text-xs text-muted-foreground">
                dos chamados foram resolvidos
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-orange-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">MTTR</CardTitle>
              <Clock className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-orange-500">{resumo.mttrHoras}h</div>
              <p className="text-xs text-muted-foreground">
                tempo médio de resolução
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-red-500/5">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Em Aberto</CardTitle>
              <AlertTriangle className="h-4 w-4 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-red-500">{resumo.chamadosAbertos}</div>
              <p className="text-xs text-muted-foreground">
                chamados ativos
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* KPIs Avançados */}
      {kpis && (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-card to-purple-500/5 border-purple-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpis.mtti.label}</CardTitle>
              <Clock className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-purple-500">
                {kpis.mtti.valor}{kpis.mtti.unidade}
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.mtti.descricao}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                ({kpis.mtti.amostra} períodos analisados)
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-cyan-500/5 border-cyan-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpis.totalHorasIncidente.label}</CardTitle>
              <Clock className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-cyan-500">
                {kpis.totalHorasIncidente.valor}{kpis.totalHorasIncidente.unidade}
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.totalHorasIncidente.descricao}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                {kpis.totalHorasIncidente.totalPeriodos && kpis.totalHorasIncidente.totalPeriodos !== kpis.totalHorasIncidente.amostra
                  ? `(${kpis.totalHorasIncidente.amostra} períodos únicos de ${kpis.totalHorasIncidente.totalPeriodos} totais)`
                  : `(${kpis.totalHorasIncidente.amostra} períodos únicos)`
                }
              </p>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-card to-emerald-500/5 border-emerald-500/20">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpis.disponibilidade.label}</CardTitle>
              <TrendingUp className="h-4 w-4 text-emerald-500" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-emerald-500">
                {kpis.disponibilidade.valor}{kpis.disponibilidade.unidade}
              </div>
              <p className="text-xs text-muted-foreground">
                {kpis.disponibilidade.descricao}
              </p>
              <p className="text-xs text-muted-foreground/70 mt-1">
                ({kpis.disponibilidade.amostra} links monitorados)
              </p>
            </CardContent>
          </Card>

        </div>
      )}

      {/* Gráficos - Linha 1 */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Gráfico de Pizza - Impacto */}
        {resumo && (
          <Card>
            <CardHeader>
              <CardTitle>Chamados por Impacto</CardTitle>
              <CardDescription>Distribuição por nível de criticidade</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={resumo.impactoData.filter(d => d.value > 0)}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={100}
                      paddingAngle={5}
                      dataKey="value"
                      label={({ name, value }) => `${name}: ${value}`}
                    >
                      {resumo.impactoData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="flex justify-center gap-4 mt-4">
                {resumo.impactoData.map((item) => (
                  <div key={item.name} className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full" 
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="text-sm text-muted-foreground">{item.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Gráfico de Barras - Tipos de Falha */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Tipos de Falha</CardTitle>
              <CardDescription>Incidentes por tipo de problema</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportarTiposFalha("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                  Exportar Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportarTiposFalha("pdf")}>
                  <FileText className="mr-2 h-4 w-4 text-red-600" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tiposFalha.slice(0, 6)} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis 
                    dataKey="nome" 
                    type="category" 
                    width={120}
                    stroke="hsl(var(--muted-foreground))"
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px"
                    }}
                  />
                  <Bar dataKey="total" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Gráfico de Tendência */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Tendência Mensal
            </CardTitle>
            <CardDescription>Evolução dos chamados nos últimos 12 meses</CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <Download className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportarTendencia("excel")}>
                <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                Exportar Excel
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportarTendencia("pdf")}>
                <FileText className="mr-2 h-4 w-4 text-red-600" />
                Exportar PDF
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </CardHeader>
        <CardContent>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={tendencia}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis 
                  dataKey="mes" 
                  stroke="hsl(var(--muted-foreground))"
                  tick={{ fontSize: 12 }}
                />
                <YAxis stroke="hsl(var(--muted-foreground))" />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px"
                  }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="abertos" 
                  name="Abertos"
                  stroke="hsl(var(--primary))" 
                  strokeWidth={2}
                  dot={{ fill: "hsl(var(--primary))" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="fechados" 
                  name="Fechados"
                  stroke="#22c55e" 
                  strokeWidth={2}
                  dot={{ fill: "#22c55e" }}
                />
                <Line 
                  type="monotone" 
                  dataKey="criticos" 
                  name="Críticos"
                  stroke="#ef4444" 
                  strokeWidth={2}
                  dot={{ fill: "#ef4444" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Links Mais Problemáticos */}
      {linksProblematicos.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-500" />
              Links Mais Problemáticos
            </CardTitle>
            <CardDescription>Top 15 links com mais incidentes no período</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Link</th>
                    <th className="text-left py-2 px-3 font-medium">Operadora</th>
                    <th className="text-left py-2 px-3 font-medium">POP</th>
                    <th className="text-center py-2 px-3 font-medium">Chamados</th>
                    <th className="text-center py-2 px-3 font-medium">Críticos</th>
                    <th className="text-center py-2 px-3 font-medium">Abertos</th>
                    <th className="text-right py-2 px-3 font-medium">Tempo Indisp.</th>
                  </tr>
                </thead>
                <tbody>
                  {linksProblematicos.map((link, idx) => (
                    <tr key={link.id} className={`border-b ${idx < 3 ? 'bg-red-500/5' : ''}`}>
                      <td className="py-2 px-3">
                        <span className="font-mono font-medium">{link.designador}</span>
                        {link.capacidade && (
                          <span className="text-xs text-muted-foreground ml-2">({link.capacidade})</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-muted-foreground">{link.operadora}</td>
                      <td className="py-2 px-3 text-muted-foreground">{link.pop}</td>
                      <td className="py-2 px-3 text-center">
                        <Badge variant="outline">{link.totalChamados}</Badge>
                      </td>
                      <td className="py-2 px-3 text-center">
                        {link.chamadosCriticos > 0 ? (
                          <Badge variant="destructive">{link.chamadosCriticos}</Badge>
                        ) : (
                          <span className="text-muted-foreground">0</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-center">
                        {link.chamadosAbertos > 0 ? (
                          <Badge className="bg-amber-500">{link.chamadosAbertos}</Badge>
                        ) : (
                          <span className="text-green-500">0</span>
                        )}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-orange-500">
                        {link.tempoIndisponivel}h
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Tabelas - Performance */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Performance por Operadora */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5" />
                Performance por Operadora
              </CardTitle>
              <CardDescription>Ranking de operadoras por volume e MTTR</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportarOperadoras("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                  Exportar Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportarOperadoras("pdf")}>
                  <FileText className="mr-2 h-4 w-4 text-red-600" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            {operadoras.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Sem dados para o período selecionado
              </p>
            ) : (
              <div className="space-y-3">
                {operadoras.slice(0, 5).map((op, idx) => (
                  <div key={op.nome} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium">{op.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {op.total} chamados • {op.criticos} críticos
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={op.mttr <= 4 ? "success" : op.mttr <= 8 ? "warning" : "destructive"}>
                        MTTR: {op.mttr}h
                      </Badge>
                      <p className="text-xs text-muted-foreground mt-1">
                        {op.taxaResolucao}% resolvidos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Incidentes por POP */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MapPin className="h-5 w-5" />
                Incidentes por POP
              </CardTitle>
              <CardDescription>Localidades com mais ocorrências</CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <Download className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => exportarPOPs("excel")}>
                  <FileSpreadsheet className="mr-2 h-4 w-4 text-green-600" />
                  Exportar Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => exportarPOPs("pdf")}>
                  <FileText className="mr-2 h-4 w-4 text-red-600" />
                  Exportar PDF
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </CardHeader>
          <CardContent>
            {pops.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">
                Sem dados para o período selecionado
              </p>
            ) : (
              <div className="space-y-3">
                {pops.slice(0, 5).map((pop, idx) => (
                  <div key={pop.nome} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-bold">
                        {idx + 1}
                      </div>
                      <div>
                        <p className="font-medium">{pop.nome}</p>
                        <p className="text-xs text-muted-foreground">
                          {pop.cidade}/{pop.estado}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-lg font-bold">{pop.total}</span>
                      <p className="text-xs text-muted-foreground">
                        {pop.criticos} críticos
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

        </TabsContent>

        <TabsContent value="exportacao" className="space-y-6">
          {/* Exportar Relatório por Link (para operadora) */}
          <Card className="border-primary/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Exportar Relatório por Circuito
              </CardTitle>
              <CardDescription>
                Gere relatórios individuais em PDF para enviar às operadoras solicitando descontos por indisponibilidade.
                Cada link ou transporte selecionado gerará um arquivo PDF separado. Filtre por operadora para gerar relatórios de todos os circuitos de uma vez.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Filtro por Operadora */}
                <div className="bg-primary/5 rounded-lg p-4 border border-primary/20">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <Label htmlFor="operadoraFiltro" className="whitespace-nowrap font-semibold">🏢 Filtrar por Operadora:</Label>
                    <Select value={operadoraFiltro} onValueChange={setOperadoraFiltro}>
                      <SelectTrigger id="operadoraFiltro" className="w-full sm:w-64">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="todas">Todas as Operadoras</SelectItem>
                        {todasOperadoras.map((op) => (
                          <SelectItem key={op.id} value={op.nome}>
                            {op.nome}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {operadoraFiltro !== "todas" && (
                      <Badge variant="secondary" className="whitespace-nowrap">
                        {totalItens} circuito(s) encontrado(s)
                      </Badge>
                    )}
                  </div>
                </div>
                
                {/* Ações */}
                <div className="flex items-center justify-between flex-wrap gap-4 pb-4 border-b">
                  <div className="flex items-center gap-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={selecionarTodos}
                    >
                      {totalSelecionados === totalItens && totalItens > 0 ? "Desmarcar Todos" : "Selecionar Todos"}
                    </Button>
                    <span className="text-sm text-muted-foreground">
                      {totalSelecionados} de {totalItens} circuito(s) selecionado(s)
                    </span>
                  </div>
                  <Button
                    onClick={exportarRelatoriosLinks}
                    disabled={totalSelecionados === 0 || exportandoLinks}
                    size="lg"
                    className="gap-2"
                  >
                    {exportandoLinks ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        Exportando {totalSelecionados} PDF(s)...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4" />
                        Exportar {totalSelecionados} PDF(s)
                      </>
                    )}
                  </Button>
                </div>

                {/* Seletor de Mês de Referência */}
                <div className="bg-muted/50 rounded-lg p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Label htmlFor="mesReferencia" className="whitespace-nowrap">📅 Mês de Referência:</Label>
                      <Input
                        id="mesReferencia"
                        type="month"
                        value={mesReferencia}
                        onChange={(e) => setMesReferencia(e.target.value)}
                        className="w-48"
                      />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Período: <strong>{calcularPeriodoMesReferencia().mesNome}</strong>
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Links com dia de vencimento definido usarão o ciclo de faturamento automaticamente.
                  </p>
                </div>

                {/* Lista de Links e Transportes */}
                <div className="border rounded-lg overflow-hidden">
                  <div className="bg-muted/30 px-4 py-2 border-b">
                    <p className="text-sm font-medium">Selecione os circuitos para exportar:</p>
                  </div>
                  <div className="max-h-[600px] overflow-y-auto">
                    {/* Links */}
                    {linksFiltradosPorOperadora().length > 0 && (
                      <div className="p-4 border-b bg-muted/10">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-600 border-blue-500/30">
                            Links ({linksFiltradosPorOperadora().length})
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {linksFiltradosPorOperadora().map((link) => (
                            <div
                              key={`link-${link.id}`}
                              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors border ${
                                linksSelecionados.includes(link.id) 
                                  ? "bg-primary/10 border-primary/30" 
                                  : "border-transparent"
                              }`}
                              onClick={() => toggleLinkSelecionado(link.id)}
                            >
                              <Checkbox
                                checked={linksSelecionados.includes(link.id)}
                                onCheckedChange={() => toggleLinkSelecionado(link.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-sm font-medium truncate">{link.designador}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {link.operadora}
                                  {link.diaVencimento && <span className="ml-2 text-primary">• Dia {link.diaVencimento}</span>}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {/* Transportes */}
                    {transportesFiltradosPorOperadora().length > 0 && (
                      <div className="p-4 bg-muted/5">
                        <div className="flex items-center gap-2 mb-3">
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-600 border-purple-500/30">
                            Transportes ({transportesFiltradosPorOperadora().length})
                          </Badge>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                          {transportesFiltradosPorOperadora().map((transporte) => (
                            <div
                              key={`transporte-${transporte.id}`}
                              className={`flex items-center gap-3 p-3 rounded-md cursor-pointer hover:bg-muted/50 transition-colors border ${
                                transportesSelecionados.includes(transporte.id) 
                                  ? "bg-primary/10 border-primary/30" 
                                  : "border-transparent"
                              }`}
                              onClick={() => toggleTransporteSelecionado(transporte.id)}
                            >
                              <Checkbox
                                checked={transportesSelecionados.includes(transporte.id)}
                                onCheckedChange={() => toggleTransporteSelecionado(transporte.id)}
                              />
                              <div className="flex-1 min-w-0">
                                <p className="font-mono text-sm font-medium truncate">{transporte.designador}</p>
                                <p className="text-xs text-muted-foreground truncate">
                                  {transporte.operadora}
                                  {transporte.diaVencimento && <span className="ml-2 text-primary">• Dia {transporte.diaVencimento}</span>}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    {totalItens === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        <p>Nenhum circuito encontrado{operadoraFiltro !== "todas" ? ` para a operadora ${operadoraFiltro}` : ""}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Info sobre o PDF */}
          <Card className="bg-muted/30">
            <CardContent className="pt-6">
              <div className="flex gap-4 items-start">
                <div className="p-2 rounded-lg bg-primary/10">
                  <FileText className="h-6 w-6 text-primary" />
                </div>
                <div className="space-y-2">
                  <h3 className="font-semibold">Conteúdo do Relatório PDF</h3>
                  <ul className="text-sm text-muted-foreground space-y-1">
                    <li>• Informações do circuito (designador, operadora, capacidade, POP/localização)</li>
                    <li>• Resumo de indisponibilidade (total de incidentes, tempo indisponível)</li>
                    <li>• Disponibilidade no período e cumprimento de SLA</li>
                    <li>• Lista detalhada de todos os chamados com datas e protocolos</li>
                    <li>• Para transportes: inclui informações de todos os links dependentes</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}

