import { prisma } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { 
  AlertTriangle, 
  Clock, 
  CheckCircle2, 
  Ticket, 
  Plus,
  ArrowRight,
  Cable,
  Network
} from "lucide-react"
import Link from "next/link"
import { formatRelativeTime, getStatusLabel, getImpactoLabel, calcularTempoAberto } from "@/lib/utils"
import { DashboardCharts } from "@/components/dashboard/charts"

async function getStats() {
  const [total, abertos, criticos, resolvidosHoje, transportesComProblema] = await Promise.all([
    prisma.chamado.count({ where: { status: { not: "fechado" } } }),
    prisma.chamado.count({ where: { status: "aberto" } }),
    prisma.chamado.count({ where: { status: { not: "fechado" }, impacto: "critico" } }),
    prisma.chamado.count({
      where: {
        status: "fechado",
        dataFechamento: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    }),
    prisma.chamado.count({
      where: {
        status: { not: "fechado" },
        tipoChamado: "transporte",
      },
    }),
  ])

  return { total, abertos, criticos, resolvidosHoje, transportesComProblema }
}

async function getChamadosRecentes() {
  return prisma.chamado.findMany({
    where: { status: { not: "fechado" } },
    include: {
      link: {
        include: {
          operadora: true,
          pop: true,
        },
      },
      transporte: true,
      tipoFalha: true,
      abertoPor: true,
    },
    orderBy: [
      { impacto: "asc" },
      { dataDeteccao: "desc" },
    ],
    take: 10,
  })
}

// Função para converter capacidade string (10G, 1G, 100M, 10 Gbps) para Mbps
function parseCapacidadeToMbps(capacidade: string | null): number {
  if (!capacidade) return 0
  // Match: "10G", "10 Gbps", "100M", "100 Mbps", etc.
  const match = capacidade.match(/([\d.]+)\s*(G|M|K)?/i)
  if (!match) return 0
  const valor = parseFloat(match[1])
  const unidade = (match[2] || 'M').toUpperCase()
  switch (unidade) {
    case 'G': return valor * 1000
    case 'K': return valor / 1000
    default: return valor
  }
}

// Formatar capacidade em Mbps para exibição
function formatCapacidade(mbps: number): string {
  if (mbps >= 1000) {
    return `${(mbps / 1000).toFixed(mbps % 1000 === 0 ? 0 : 1)}G`
  }
  return `${mbps}M`
}

async function getCapacidadeLinks() {
  // Buscar todos os links IP ativos (aceitar várias formas de escrita)
  const linksAtivos = await prisma.link.findMany({
    where: {
      ativo: true,
      OR: [
        { tipoServico: { contains: 'link', mode: 'insensitive' } },
        { tipoServico: { contains: 'ip', mode: 'insensitive' } },
      ],
    },
    select: {
      id: true,
      designador: true,
      capacidade: true,
      transporteId: true,
    },
  })

  // Buscar IDs de links com chamados em aberto (chamados diretos no link)
  const chamadosLinksAbertos = await prisma.chamado.findMany({
    where: {
      status: { not: 'fechado' },
      linkId: { not: null },
    },
    select: {
      linkId: true,
    },
  })

  // Buscar IDs de transportes com chamados em aberto
  const chamadosTransportesAbertos = await prisma.chamado.findMany({
    where: {
      status: { not: 'fechado' },
      transporteId: { not: null },
    },
    select: {
      transporteId: true,
    },
  })

  const linksComChamadoDireto = new Set(chamadosLinksAbertos.map(c => c.linkId))
  const transportesComProblema = new Set(chamadosTransportesAbertos.map(c => c.transporteId))

  // Calcular capacidade total e disponível
  let capacidadeTotal = 0
  let capacidadeIndisponivel = 0
  const linksIndisponiveis: { designador: string; capacidade: string; motivo: string }[] = []

  linksAtivos.forEach(link => {
    const cap = parseCapacidadeToMbps(link.capacidade)
    capacidadeTotal += cap
    
    // Verificar se link tem problema direto
    const temChamadoDireto = linksComChamadoDireto.has(link.id)
    // Verificar se o transporte do link tem problema
    const transporteAfetado = link.transporteId && transportesComProblema.has(link.transporteId)
    
    if (temChamadoDireto || transporteAfetado) {
      capacidadeIndisponivel += cap
      if (link.capacidade) {
        linksIndisponiveis.push({
          designador: link.designador,
          capacidade: link.capacidade,
          motivo: temChamadoDireto ? 'link' : 'transporte',
        })
      }
    }
  })

  const capacidadeDisponivel = capacidadeTotal - capacidadeIndisponivel
  const percentualDisponivel = capacidadeTotal > 0 
    ? Math.round((capacidadeDisponivel / capacidadeTotal) * 100) 
    : 100

  return {
    capacidadeTotal,
    capacidadeDisponivel,
    capacidadeIndisponivel,
    percentualDisponivel,
    totalLinks: linksAtivos.length,
    linksAfetados: linksIndisponiveis.length,
    transportesComProblema: transportesComProblema.size,
    linksIndisponiveis,
    formatTotal: formatCapacidade(capacidadeTotal),
    formatDisponivel: formatCapacidade(capacidadeDisponivel),
    formatIndisponivel: formatCapacidade(capacidadeIndisponivel),
  }
}

async function getChartData() {
  // Dados para gráfico de impacto
  const chamadosPorImpacto = await prisma.chamado.groupBy({
    by: ["impacto"],
    where: { status: { not: "fechado" } },
    _count: true,
  })

  const impactoData = [
    { name: "Crítico", value: 0, color: "#ef4444" },
    { name: "Alto", value: 0, color: "#f97316" },
    { name: "Médio", value: 0, color: "#eab308" },
    { name: "Baixo", value: 0, color: "#22c55e" },
  ]

  chamadosPorImpacto.forEach((item) => {
    const map: Record<string, number> = { critico: 0, alto: 1, medio: 2, baixo: 3 }
    const idx = map[item.impacto]
    if (idx !== undefined) {
      impactoData[idx].value = item._count
    }
  })

  // Dados por operadora (últimos 7 dias)
  const seteDiasAtras = new Date()
  seteDiasAtras.setDate(seteDiasAtras.getDate() - 7)

  const chamadosRecentes = await prisma.chamado.findMany({
    where: {
      dataAbertura: { gte: seteDiasAtras },
      link: { isNot: null },
    },
    include: {
      link: {
        include: { operadora: true },
      },
    },
  })

  const operadorasMap = new Map<string, number>()
  chamadosRecentes.forEach((c) => {
    const nome = c.link?.operadora?.nome || "Outros"
    operadorasMap.set(nome, (operadorasMap.get(nome) || 0) + 1)
  })

  const operadoraData = Array.from(operadorasMap.entries())
    .map(([nome, total]) => ({ nome, total }))
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)

  return { impactoData, operadoraData }
}

export default async function DashboardPage() {
  const [stats, chamados, chartData, capacidade] = await Promise.all([
    getStats(),
    getChamadosRecentes(),
    getChartData(),
    getCapacidadeLinks(),
  ])

  const impactoOrder = { critico: 0, alto: 1, medio: 2, baixo: 3 }
  const sortedChamados = [...chamados].sort((a, b) => {
    return (impactoOrder[a.impacto as keyof typeof impactoOrder] || 4) - 
           (impactoOrder[b.impacto as keyof typeof impactoOrder] || 4)
  })

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral dos chamados em aberto
          </p>
        </div>
        <Button asChild>
          <Link href="/chamados/novo">
            <Plus className="mr-2 h-4 w-4" />
            Novo Chamado
          </Link>
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-5">
        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Chamados Ativos
            </CardTitle>
            <Ticket className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
            <p className="text-xs text-muted-foreground">
              em acompanhamento
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-card/50">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aguardando Ação</CardTitle>
            <Clock className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-500">{stats.abertos}</div>
            <p className="text-xs text-muted-foreground">
              chamados abertos
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-red-500/5 border-red-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Críticos</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-500">{stats.criticos}</div>
            <p className="text-xs text-muted-foreground">
              atenção imediata
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-orange-500/5 border-orange-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Transportes</CardTitle>
            <Cable className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-500">{stats.transportesComProblema}</div>
            <p className="text-xs text-muted-foreground">
              com incidentes
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-card to-green-500/5 border-green-500/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Resolvidos Hoje</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-500">{stats.resolvidosHoje}</div>
            <p className="text-xs text-muted-foreground">
              chamados fechados
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Card de Capacidade de Links */}
      {capacidade.capacidadeTotal > 0 && (
        <Card className="bg-gradient-to-br from-card to-primary/5 border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="flex items-center gap-2">
              <Network className="h-5 w-5 text-primary" />
              Capacidade de Links IP
            </CardTitle>
            <Badge variant={capacidade.linksAfetados > 0 ? "destructive" : "default"}>
              {capacidade.totalLinks} links ativos
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Barra de progresso */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Disponível</span>
                <span className="font-semibold">
                  <span className={capacidade.linksAfetados > 0 ? "text-yellow-500" : "text-green-500"}>
                    {capacidade.formatDisponivel}
                  </span>
                  <span className="text-muted-foreground"> / {capacidade.formatTotal}</span>
                </span>
              </div>
              <div className="relative h-4 w-full overflow-hidden rounded-full bg-muted">
                <div 
                  className={`h-full transition-all duration-500 ${
                    capacidade.percentualDisponivel >= 80 
                      ? 'bg-green-500' 
                      : capacidade.percentualDisponivel >= 50 
                        ? 'bg-yellow-500' 
                        : 'bg-red-500'
                  }`}
                  style={{ width: `${capacidade.percentualDisponivel}%` }}
                />
                {capacidade.linksAfetados > 0 && (
                  <div 
                    className="absolute top-0 right-0 h-full bg-red-500/80"
                    style={{ width: `${100 - capacidade.percentualDisponivel}%` }}
                  />
                )}
              </div>
            </div>
            
            {/* Info adicional */}
            <div className="flex justify-between text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-green-500" />
                <span className="text-muted-foreground">Operacional: {capacidade.formatDisponivel}</span>
              </div>
              {capacidade.linksAfetados > 0 && (
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-full bg-red-500" />
                  <span className="text-red-500 font-medium">
                    Indisponível: {capacidade.formatIndisponivel} ({capacidade.linksAfetados} link{capacidade.linksAfetados > 1 ? 's' : ''})
                  </span>
                </div>
              )}
            </div>
            
            {/* Links com problema */}
            {capacidade.linksIndisponiveis.length > 0 && (
              <div className="pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground mb-2">
                  Links afetados:
                  {capacidade.transportesComProblema > 0 && (
                    <span className="text-orange-500 ml-1">
                      ({capacidade.transportesComProblema} transporte{capacidade.transportesComProblema > 1 ? 's' : ''} com problema)
                    </span>
                  )}
                </p>
                <div className="flex flex-wrap gap-2">
                  {capacidade.linksIndisponiveis.slice(0, 5).map((link, i) => (
                    <Badge 
                      key={i} 
                      variant="outline" 
                      className={link.motivo === 'transporte' 
                        ? "text-orange-500 border-orange-500/50" 
                        : "text-red-500 border-red-500/50"
                      }
                    >
                      {link.designador} ({link.capacidade})
                      {link.motivo === 'transporte' && <Cable className="ml-1 h-3 w-3" />}
                    </Badge>
                  ))}
                  {capacidade.linksIndisponiveis.length > 5 && (
                    <Badge variant="outline" className="text-muted-foreground">
                      +{capacidade.linksIndisponiveis.length - 5} mais
                    </Badge>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Chamados List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Chamados em Aberto</CardTitle>
            <p className="text-sm text-muted-foreground">
              Ordenados por prioridade e tempo
            </p>
          </div>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/chamados">
              Ver todos
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent>
          {sortedChamados.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="mx-auto h-12 w-12 text-green-500/50" />
              <h3 className="mt-4 text-lg font-semibold">Tudo tranquilo!</h3>
              <p className="text-muted-foreground">
                Não há chamados em aberto no momento.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {sortedChamados.map((chamado) => (
                <Link
                  key={chamado.id}
                  href={`/chamados/${chamado.id}`}
                  className="block"
                >
                  <div className="flex items-center gap-4 p-4 rounded-lg border bg-card/50 hover:bg-accent/50 transition-colors">
                    {/* Impacto indicator */}
                    <div className="hidden sm:block">
                      <Badge
                        variant={
                          chamado.impacto === "critico" ? "critical" :
                          chamado.impacto === "alto" ? "high" :
                          chamado.impacto === "medio" ? "medium" : "low"
                        }
                        className="w-20 justify-center"
                      >
                        {getImpactoLabel(chamado.impacto)}
                      </Badge>
                    </div>

                    {/* Main info */}
                    <div className="flex-1 min-w-0">
                      {/* Link/Transporte com destaque */}
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-bold text-base text-foreground">
                          {chamado.tipoChamado === "transporte" 
                            ? chamado.transporte?.nome
                            : chamado.link?.designador || "Sem link"
                          }
                        </span>
                        {chamado.tipoChamado !== "transporte" && (
                          <span className="text-sm text-muted-foreground">
                            • {chamado.link?.operadora?.nome}
                          </span>
                        )}
                        {chamado.tipoChamado === "transporte" && (
                          <Badge variant="secondary" className="hidden sm:inline-flex">
                            <Cable className="h-3 w-3 mr-1" />
                            Transporte
                          </Badge>
                        )}
                      </div>
                      
                      {/* Protocolo e Status */}
                      <div className="flex items-center gap-2">
                        {chamado.protocoloOperadora ? (
                          <span className="font-mono text-sm font-semibold text-primary">
                            {chamado.protocoloOperadora}
                          </span>
                        ) : (
                          <span className="font-mono text-xs text-muted-foreground">
                            {chamado.numero}
                          </span>
                        )}
                        <Badge variant="outline" className="hidden sm:inline-flex">
                          {getStatusLabel(chamado.status)}
                        </Badge>
                        <Badge
                          variant={
                            chamado.impacto === "critico" ? "critical" :
                            chamado.impacto === "alto" ? "high" :
                            chamado.impacto === "medio" ? "medium" : "low"
                          }
                          className="sm:hidden"
                        >
                          {getImpactoLabel(chamado.impacto)}
                        </Badge>
                      </div>
                      
                      {/* Descrição */}
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {chamado.tipoChamado !== "transporte" && `${chamado.link?.pop?.cidade} • `}{chamado.tipoFalha?.nome}: {chamado.descricaoProblema}
                      </p>
                    </div>

                    {/* Time */}
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 bg-primary/10 px-2.5 py-1 rounded-md">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="text-sm font-semibold text-primary">
                          {calcularTempoAberto(chamado.dataAbertura)}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {chamado.abertoPor?.nome.split(" ")[0]}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Charts */}
      <DashboardCharts 
        impactoData={chartData.impactoData}
        operadoraData={chartData.operadoraData}
      />
    </div>
  )
}
