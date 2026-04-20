import * as XLSX from "xlsx"
import jsPDF from "jspdf"
import autoTable from "jspdf-autotable"

// Exportar para Excel
export function exportToExcel(
  data: any[],
  fileName: string,
  sheetName: string = "Dados"
) {
  const worksheet = XLSX.utils.json_to_sheet(data)
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName)
  
  // Ajustar largura das colunas
  const maxWidth = 50
  const colWidths = Object.keys(data[0] || {}).map((key) => {
    const maxLength = Math.max(
      key.length,
      ...data.map((row) => String(row[key] || "").length)
    )
    return { wch: Math.min(maxLength + 2, maxWidth) }
  })
  worksheet["!cols"] = colWidths

  XLSX.writeFile(workbook, `${fileName}.xlsx`)
}

// Exportar para PDF
export function exportToPDF(
  data: any[],
  columns: { header: string; dataKey: string }[],
  fileName: string,
  title: string
) {
  const doc = new jsPDF()
  
  // Título
  doc.setFontSize(16)
  doc.text(title, 14, 20)
  
  // Data de geração
  doc.setFontSize(10)
  doc.setTextColor(100)
  doc.text(`Gerado em: ${new Date().toLocaleString("pt-BR")}`, 14, 28)
  
  // Tabela
  autoTable(doc, {
    startY: 35,
    head: [columns.map((col) => col.header)],
    body: data.map((row) => columns.map((col) => row[col.dataKey] || "-")),
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: 255,
      fontStyle: "bold",
    },
    alternateRowStyles: {
      fillColor: [245, 247, 250],
    },
  })

  doc.save(`${fileName}.pdf`)
}

// Formatar dados para exportação de chamados
export function formatChamadosForExport(chamados: any[]) {
  return chamados.map((c) => ({
    Número: c.numero,
    Status: c.status === "aberto" ? "Aberto" : c.status === "em_andamento" ? "Em Andamento" : "Fechado",
    Impacto: c.impacto?.charAt(0).toUpperCase() + c.impacto?.slice(1),
    Link: c.link?.designador || c.transporte?.nome || "-",
    Operadora: c.link?.operadora?.nome || c.transporte?.fornecedor || "-",
    "Tipo de Falha": c.tipoFalha?.nome || "-",
    "Data Abertura": new Date(c.dataAbertura).toLocaleString("pt-BR"),
    "Data Fechamento": c.dataFechamento ? new Date(c.dataFechamento).toLocaleString("pt-BR") : "-",
    "Aberto Por": c.abertoPor?.nome || "-",
    "Fechado Por": c.fechadoPor?.nome || "-",
    "Protocolo Operadora": c.protocoloOperadora || "-",
  }))
}

// Formatar dados de MTTR
export function formatMTTRForExport(data: any[]) {
  return data.map((d) => ({
    Operadora: d.operadora,
    "MTTR (horas)": d.mttrHoras?.toFixed(2) || "0.00",
    "Total de Chamados": d.totalChamados,
    "Chamados Fechados": d.chamadosFechados,
  }))
}

// Formatar incidentes por POP
export function formatIncidentesPorPOPForExport(data: any[]) {
  return data.map((d) => ({
    POP: d.pop,
    Cidade: d.cidade,
    Estado: d.estado,
    "Total de Incidentes": d.total,
  }))
}

// Formatar incidentes por tipo
export function formatIncidentesPorTipoForExport(data: any[]) {
  return data.map((d) => ({
    "Tipo de Falha": d.tipo,
    "Total de Incidentes": d.total,
    "Percentual": `${d.percentual?.toFixed(1) || 0}%`,
  }))
}

// Formatar incidentes por impacto
export function formatIncidentesPorImpactoForExport(data: any[]) {
  return data.map((d) => ({
    Impacto: d.impacto?.charAt(0).toUpperCase() + d.impacto?.slice(1),
    "Total de Incidentes": d.total,
    "Percentual": `${d.percentual?.toFixed(1) || 0}%`,
  }))
}

// Exportar relatório geral do dashboard (PDF estilizado)
export function exportRelatorioDashboardPDF(dados: {
  resumo: any,
  kpis: any,
  operadoras: any[],
  pops: any[],
  tiposFalha: any[],
  linksProblematicos: any[],
  tendencia: any[],
  periodo: { inicio: string, fim: string }
}, nomeEmpresa: string = "NOC") {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // ========== TEMA ESCURO PREMIUM ==========
  const cores = {
    primaria: [99, 102, 241] as [number, number, number],       // Indigo vibrante
    secundaria: [100, 116, 139] as [number, number, number],    // Cinza médio
    sucesso: [16, 185, 129] as [number, number, number],        // Verde esmeralda
    erro: [239, 68, 68] as [number, number, number],            // Vermelho
    alerta: [251, 146, 60] as [number, number, number],         // Laranja
    info: [59, 130, 246] as [number, number, number],           // Azul claro
    texto: [226, 232, 240] as [number, number, number],         // Cinza muito claro (texto principal)
    textoClaro: [148, 163, 184] as [number, number, number],    // Cinza médio (texto secundário)
    fundo: [30, 41, 59] as [number, number, number],            // Slate escuro (cards)
    fundoPagina: [15, 23, 42] as [number, number, number],      // Quase preto (página)
    borda: [51, 65, 85] as [number, number, number],            // Cinza escuro (bordas)
  }

  // ========== FUNDO ESCURO DA PÁGINA ==========
  doc.setFillColor(...cores.fundoPagina)
  doc.rect(0, 0, pageWidth, pageHeight, "F")

  // ========== CABEÇALHO TEMA ESCURO ==========
  // Linha de acento colorida no topo
  doc.setDrawColor(...cores.primaria)
  doc.setLineWidth(3)
  doc.line(0, 0, pageWidth, 0)

  // Logo/Nome da empresa
  doc.setTextColor(...cores.texto)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(nomeEmpresa.toUpperCase(), 20, 15)
  
  // Título do relatório
  doc.setFontSize(22)
  doc.setFont("helvetica", "normal")
  doc.text("Relatório Executivo", 20, 30)
  
  // Informações do período - alinhado à direita
  doc.setFontSize(8)
  doc.setTextColor(...cores.textoClaro)
  doc.setFont("helvetica", "normal")
  doc.text(`Período: ${dados.periodo.inicio} - ${dados.periodo.fim}`, pageWidth - 20, 15, { align: "right" })
  doc.text(`Gerado: ${new Date().toLocaleDateString("pt-BR")}`, pageWidth - 20, 20, { align: "right" })

  // Linha separadora sutil
  doc.setDrawColor(...cores.borda)
  doc.setLineWidth(0.5)
  doc.line(20, 38, pageWidth - 20, 38)

  yPos = 50

  // ========== SEÇÃO DE KPIs ==========
  // Título da seção com estilo minimalista
  doc.setTextColor(...cores.texto)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("INDICADORES PRINCIPAIS", 20, yPos)
  yPos += 8

  // Função auxiliar para desenhar card tema escuro
  const drawMinimalCard = (
    x: number, 
    y: number, 
    width: number, 
    height: number,
    label: string,
    value: string,
    subtitle: string,
    accentColor: [number, number, number]
  ) => {
    // Fundo escuro com gradiente sutil
    doc.setFillColor(...cores.fundo)
    doc.roundedRect(x, y, width, height, 3, 3, "F")
    
    // Borda sutil
    doc.setDrawColor(...cores.borda)
    doc.setLineWidth(0.5)
    doc.roundedRect(x, y, width, height, 3, 3, "S")
    
    // Linha de acento colorida no topo
    doc.setDrawColor(...accentColor)
    doc.setLineWidth(2)
    doc.line(x + 6, y + 6, x + 25, y + 6)
    
    // Label
    doc.setTextColor(...cores.textoClaro)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.text(label.toUpperCase(), x + 8, y + 15)
    
    // Valor principal - destaque em branco
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(22)
    doc.setFont("helvetica", "bold")
    doc.text(value, x + 8, y + 28)
    
    // Subtitle
    doc.setTextColor(...cores.textoClaro)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "normal")
    doc.text(subtitle, x + 8, y + 34)
  }

  const cardWidth3 = (pageWidth - 54) / 3
  const cardHeight = 38
  const cardGap = 7

  // Card 1 - Total de Chamados
  const abertos = dados.resumo?.chamadosAbertos || 0
  const fechados = dados.resumo?.chamadosFechados || 0
  drawMinimalCard(
    20, yPos, cardWidth3, cardHeight,
    "Total de Chamados",
    String(dados.resumo?.totalChamados || 0),
    `${abertos} abertos · ${fechados} fechados`,
    cores.info
  )

  // Card 2 - Taxa de Resolução
  const taxaRes = Number(dados.resumo?.taxaResolucao) || 0
  drawMinimalCard(
    20 + cardWidth3 + cardGap, yPos, cardWidth3, cardHeight,
    "Taxa de Resolução",
    `${taxaRes}%`,
    "dos chamados foram resolvidos",
    cores.sucesso
  )

  // Card 3 - MTTR
  const mttrVal = Number(dados.resumo?.mttrHoras) || 0
  drawMinimalCard(
    20 + (cardWidth3 + cardGap) * 2, yPos, cardWidth3, cardHeight,
    "MTTR",
    `${mttrVal.toFixed(1)}h`,
    "tempo médio de resolução",
    cores.alerta
  )

  yPos += cardHeight + 10

  // Segunda linha de KPIs
  const cardWidth2 = (pageWidth - 47) / 2

  // Card 4 - MTTI
  const mttiVal = Number(dados.kpis?.mtti?.valor) || 0
  drawMinimalCard(
    20, yPos, cardWidth2, cardHeight,
    "MTTI",
    `${mttiVal.toFixed(0)}h`,
    "tempo médio de impacto real",
    cores.info
  )

  // Card 5 - Disponibilidade
  const dispVal = Number(dados.kpis?.disponibilidade?.valor) || 100
  const corDisp = dispVal >= 99.5 ? cores.sucesso : dispVal >= 99 ? cores.alerta : cores.erro
  drawMinimalCard(
    20 + cardWidth2 + cardGap, yPos, cardWidth2, cardHeight,
    "Disponibilidade",
    `${dispVal.toFixed(2)}%`,
    "disponibilidade geral dos links",
    corDisp
  )

  yPos += cardHeight + 18

  // ========== TENDÊNCIA MENSAL (Gráfico de Linhas) ==========
  if (dados.tendencia && dados.tendencia.length > 0) {
    // Título da seção
    doc.setTextColor(...cores.texto)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("TENDÊNCIA MENSAL", 20, yPos)
    yPos += 8

    // Container do gráfico com fundo escuro
    const chartX = 25
    const chartY = yPos
    const chartWidth = pageWidth - 50
    const chartHeight = 50
    const padding = 5

    // Fundo escuro com borda
    doc.setFillColor(...cores.fundo)
    doc.roundedRect(chartX - 5, chartY, chartWidth + 10, chartHeight + 22, 3, 3, "F")
    doc.setDrawColor(...cores.borda)
    doc.setLineWidth(0.5)
    doc.roundedRect(chartX - 5, chartY, chartWidth + 10, chartHeight + 22, 3, 3, "S")

    // Encontrar valor máximo para escala
    const maxVal = Math.max(...dados.tendencia.map(t => Math.max(t.abertos || 0, t.fechados || 0, t.criticos || 0)), 10)
    const yScale = (chartHeight - padding * 2) / maxVal
    const xStep = (chartWidth - padding * 2) / (dados.tendencia.length - 1)

    // Linhas de grade horizontais muito sutis
    doc.setDrawColor(...cores.borda)
    doc.setLineWidth(0.15)
    for (let i = 0; i <= 4; i++) {
      const gridY = chartY + chartHeight - padding - (i * (chartHeight - padding * 2) / 4)
      doc.line(chartX, gridY, chartX + chartWidth, gridY)
      // Valores do eixo Y
      doc.setFontSize(6)
      doc.setTextColor(...cores.textoClaro)
      doc.text(String(Math.round(maxVal * i / 4)), chartX - 3, gridY + 1, { align: "right" })
    }

    // Função para desenhar linha curva do gráfico (Bezier suave)
    const drawLine = (dataKey: 'abertos' | 'fechados' | 'criticos', color: [number, number, number]) => {
      doc.setDrawColor(...color)
      doc.setLineWidth(0.8) // Linha mais espessa e premium
      
      // Coletar todos os pontos
      const points: {x: number, y: number}[] = dados.tendencia.map((t: any, i: number) => ({
        x: chartX + padding + (i * xStep),
        y: chartY + chartHeight - padding - ((t[dataKey] || 0) * yScale)
      }))
      
      // Desenhar curva suave passando por todos os pontos
      if (points.length > 1) {
        for (let i = 0; i < points.length - 1; i++) {
          const p0 = i > 0 ? points[i - 1] : points[i]
          const p1 = points[i]
          const p2 = points[i + 1]
          const p3 = i < points.length - 2 ? points[i + 2] : p2
          
          // Desenhar segmento curvo entre p1 e p2 usando Catmull-Rom spline
          const steps = 12
          let lastX = p1.x, lastY = p1.y
          
          for (let t = 1; t <= steps; t++) {
            const ratio = t / steps
            const t2 = ratio * ratio
            const t3 = t2 * ratio
            
            // Catmull-Rom spline interpolation
            const x = 0.5 * (
              (2 * p1.x) +
              (-p0.x + p2.x) * ratio +
              (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
              (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3
            )
            const y = 0.5 * (
              (2 * p1.y) +
              (-p0.y + p2.y) * ratio +
              (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
              (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3
            )
            
            doc.line(lastX, lastY, x, y)
            lastX = x
            lastY = y
          }
        }
      }
      
      // Pontos elegantes nos dados
      doc.setFillColor(...color)
      points.forEach(p => {
        doc.circle(p.x, p.y, 1.2, "F")
      })
    }

    // Desenhar as 3 linhas com cores premium
    drawLine('abertos', cores.info)
    drawLine('fechados', cores.sucesso)
    drawLine('criticos', cores.erro)

    // Labels do eixo X (meses)
    doc.setFontSize(5.5)
    doc.setTextColor(...cores.textoClaro)
    doc.setFont("helvetica", "normal")
    dados.tendencia.forEach((t: any, i: number) => {
      const x = chartX + padding + (i * xStep)
      doc.text(t.mes, x, chartY + chartHeight + 5, { align: "center" })
    })

    // Legenda minimalista
    const legendY = chartY + chartHeight + 14
    const legendStartX = chartX + chartWidth / 2 - 45

    const drawLegendItem = (x: number, label: string, color: [number, number, number]) => {
      // Círculo pequeno
      doc.setFillColor(...color)
      doc.circle(x, legendY, 1.5, "F")
      // Label
      doc.setFontSize(6.5)
      doc.setTextColor(...cores.textoClaro)
      doc.setFont("helvetica", "normal")
      doc.text(label, x + 4, legendY + 1.2)
    }

    drawLegendItem(legendStartX, "Abertos", cores.info)
    drawLegendItem(legendStartX + 32, "Fechados", cores.sucesso)
    drawLegendItem(legendStartX + 68, "Críticos", cores.erro)

    yPos = chartY + chartHeight + 26
  }

  // ========== PERFORMANCE POR OPERADORA ==========
  if (dados.operadoras && dados.operadoras.length > 0) {
    // Nova página se não houver espaço suficiente
    if (yPos > 200) {
      doc.addPage()
      
      // Fundo escuro da nova página
      doc.setFillColor(...cores.fundoPagina)
      doc.rect(0, 0, pageWidth, pageHeight, "F")
      
      // Linha de acento no topo da nova página
      doc.setDrawColor(...cores.primaria)
      doc.setLineWidth(3)
      doc.line(0, 0, pageWidth, 0)
      
      yPos = 20
    }
    
    // Título da seção
    doc.setTextColor(...cores.texto)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("PERFORMANCE POR OPERADORA", 20, yPos)
    yPos += 8

    const opData = dados.operadoras.slice(0, 8).map(op => [
      op.nome,
      String(op.total),
      String(op.criticos || 0),
      `${op.mttr || 0}h`,
      `${op.taxaResolucao || 0}%`
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["Operadora", "Chamados", "Críticos", "MTTR", "Resolução"]],
      body: opData,
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 8,
        cellPadding: 4,
        lineColor: cores.borda,
        lineWidth: 0.3,
        textColor: cores.texto,
        fillColor: cores.fundo,
      },
      headStyles: { 
        fillColor: [20, 28, 40],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        halign: "left",
      },
      alternateRowStyles: { 
        fillColor: [20, 31, 47]
      },
      columnStyles: {
        0: { fontStyle: "normal", cellWidth: 60 },
        1: { halign: "center", cellWidth: 25 },
        2: { halign: "center", cellWidth: 25 },
        3: { halign: "center", cellWidth: 25 },
        4: { halign: "center", cellWidth: 25 },
      },
      didDrawPage: (data) => {
        // Aplicar fundo escuro quando autoTable cria nova página
        if (data.pageNumber > 1) {
          const currentPage = doc.getCurrentPageInfo().pageNumber
          doc.setPage(currentPage)
          doc.setFillColor(...cores.fundoPagina)
          doc.rect(0, 0, pageWidth, pageHeight, "F")
          
          // Linha de acento no topo
          doc.setDrawColor(...cores.primaria)
          doc.setLineWidth(3)
          doc.line(0, 0, pageWidth, 0)
        }
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // ========== LINKS MAIS PROBLEMÁTICOS ==========
  if (dados.linksProblematicos && dados.linksProblematicos.length > 0) {
    // Nova página se necessário
    if (yPos > 200) {
      doc.addPage()
      
      // Fundo escuro da nova página
      doc.setFillColor(...cores.fundoPagina)
      doc.rect(0, 0, pageWidth, pageHeight, "F")
      
      // Linha de acento no topo da nova página
      doc.setDrawColor(...cores.primaria)
      doc.setLineWidth(3)
      doc.line(0, 0, pageWidth, 0)
      
      yPos = 20
    }

    // Título da seção
    doc.setTextColor(...cores.texto)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("LINKS MAIS PROBLEMÁTICOS", 20, yPos)
    yPos += 8

    const linksData = dados.linksProblematicos.slice(0, 10).map(link => [
      link.designador,
      link.operadora,
      link.pop,
      String(link.totalChamados),
      String(link.chamadosCriticos || 0)
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["Link", "Operadora", "POP", "Chamados", "Críticos"]],
      body: linksData,
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 8,
        cellPadding: 4,
        lineColor: cores.borda,
        lineWidth: 0.3,
        textColor: cores.texto,
        fillColor: cores.fundo,
      },
      headStyles: { 
        fillColor: [20, 28, 40],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        halign: "left",
      },
      alternateRowStyles: { 
        fillColor: [20, 31, 47]
      },
      columnStyles: {
        0: { fontStyle: "normal", cellWidth: 50 },
        1: { cellWidth: 38 },
        2: { cellWidth: 38 },
        3: { halign: "center", cellWidth: 25 },
        4: { halign: "center", cellWidth: 25 },
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          const currentPage = doc.getCurrentPageInfo().pageNumber
          doc.setPage(currentPage)
          doc.setFillColor(...cores.fundoPagina)
          doc.rect(0, 0, pageWidth, pageHeight, "F")
          doc.setDrawColor(...cores.primaria)
          doc.setLineWidth(3)
          doc.line(0, 0, pageWidth, 0)
        }
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // ========== INCIDENTES POR POP ==========
  if (dados.pops && dados.pops.length > 0) {
    if (yPos > 200) {
      doc.addPage()
      
      // Fundo escuro da nova página
      doc.setFillColor(...cores.fundoPagina)
      doc.rect(0, 0, pageWidth, pageHeight, "F")
      
      // Linha de acento no topo da nova página
      doc.setDrawColor(...cores.primaria)
      doc.setLineWidth(3)
      doc.line(0, 0, pageWidth, 0)
      
      yPos = 20
    }

    // Título da seção
    doc.setTextColor(...cores.texto)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("INCIDENTES POR POP", 20, yPos)
    yPos += 8

    const popsData = dados.pops.slice(0, 10).map(pop => [
      pop.pop || pop.nome,
      pop.cidade,
      pop.estado,
      String(pop.total)
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["POP", "Cidade", "Estado", "Incidentes"]],
      body: popsData,
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 8,
        cellPadding: 4,
        lineColor: cores.borda,
        lineWidth: 0.3,
        textColor: cores.texto,
        fillColor: cores.fundo,
      },
      headStyles: { 
        fillColor: [20, 28, 40],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        halign: "left",
      },
      alternateRowStyles: { 
        fillColor: [20, 31, 47]
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          const currentPage = doc.getCurrentPageInfo().pageNumber
          doc.setPage(currentPage)
          doc.setFillColor(...cores.fundoPagina)
          doc.rect(0, 0, pageWidth, pageHeight, "F")
          doc.setDrawColor(...cores.primaria)
          doc.setLineWidth(3)
          doc.line(0, 0, pageWidth, 0)
        }
      },
    })

    yPos = (doc as any).lastAutoTable.finalY + 15
  }

  // ========== TIPOS DE FALHA ==========
  if (dados.tiposFalha && dados.tiposFalha.length > 0) {
    if (yPos > 220) {
      doc.addPage()
      
      // Fundo escuro da nova página
      doc.setFillColor(...cores.fundoPagina)
      doc.rect(0, 0, pageWidth, pageHeight, "F")
      
      // Linha de acento no topo da nova página
      doc.setDrawColor(...cores.primaria)
      doc.setLineWidth(3)
      doc.line(0, 0, pageWidth, 0)
      
      yPos = 20
    }

    // Título da seção
    doc.setTextColor(...cores.texto)
    doc.setFontSize(9)
    doc.setFont("helvetica", "bold")
    doc.text("DISTRIBUIÇÃO POR TIPO DE FALHA", 20, yPos)
    yPos += 8

    const total = dados.tiposFalha.reduce((acc, t) => acc + (t.total || 0), 0)
    const tiposData = dados.tiposFalha.slice(0, 8).map(tipo => [
      tipo.nome || tipo.tipo,
      String(tipo.total || 0),
      total > 0 ? `${((tipo.total / total) * 100).toFixed(1)}%` : "0%"
    ])

    autoTable(doc, {
      startY: yPos,
      head: [["Tipo de Falha", "Quantidade", "Percentual"]],
      body: tiposData,
      margin: { left: 20, right: 20 },
      styles: { 
        fontSize: 8,
        cellPadding: 4,
        lineColor: cores.borda,
        lineWidth: 0.3,
        textColor: cores.texto,
        fillColor: cores.fundo,
      },
      headStyles: { 
        fillColor: [20, 28, 40],
        textColor: [255, 255, 255],
        fontStyle: "bold",
        fontSize: 7.5,
        halign: "left",
      },
      alternateRowStyles: { 
        fillColor: [20, 31, 47]
      },
      didDrawPage: (data) => {
        if (data.pageNumber > 1) {
          const currentPage = doc.getCurrentPageInfo().pageNumber
          doc.setPage(currentPage)
          doc.setFillColor(...cores.fundoPagina)
          doc.rect(0, 0, pageWidth, pageHeight, "F")
          doc.setDrawColor(...cores.primaria)
          doc.setLineWidth(3)
          doc.line(0, 0, pageWidth, 0)
        }
      },
    })
  }

  // ========== RODAPÉ EM TODAS AS PÁGINAS ==========
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Linha sutil no rodapé
    doc.setDrawColor(...cores.borda)
    doc.setLineWidth(0.5)
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15)
    
    // Nome da empresa à esquerda
    doc.setFontSize(7)
    doc.setTextColor(...cores.textoClaro)
    doc.setFont("helvetica", "normal")
    doc.text(
      `${nomeEmpresa} · Relatório Executivo`,
      20,
      pageHeight - 10
    )
    
    // Número da página à direita
    doc.text(
      `${i} / ${pageCount}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: "right" }
    )
  }

  const nomeArquivo = `relatorio-executivo-${dados.periodo.inicio.replace(/\//g, "-")}-${dados.periodo.fim.replace(/\//g, "-")}`
  doc.save(`${nomeArquivo}.pdf`)
  
  return nomeArquivo
}

// Exportar relatório de link para operadora (PDF estilizado)
export function exportRelatorioLinkPDF(relatorio: any, nomeEmpresa: string = "NOC") {
  const doc = new jsPDF()
  const pageWidth = doc.internal.pageSize.getWidth()
  const pageHeight = doc.internal.pageSize.getHeight()
  let yPos = 20

  // ========== TEMA ESCURO PREMIUM ==========
  const cores = {
    primaria: [99, 102, 241] as [number, number, number],
    secundaria: [100, 116, 139] as [number, number, number],
    sucesso: [16, 185, 129] as [number, number, number],
    erro: [239, 68, 68] as [number, number, number],
    alerta: [251, 146, 60] as [number, number, number],
    info: [59, 130, 246] as [number, number, number],
    texto: [226, 232, 240] as [number, number, number],
    textoClaro: [148, 163, 184] as [number, number, number],
    fundo: [30, 41, 59] as [number, number, number],
    fundoPagina: [15, 23, 42] as [number, number, number],
    borda: [51, 65, 85] as [number, number, number],
  }

  // ========== FUNDO ESCURO DA PÁGINA ==========
  doc.setFillColor(...cores.fundoPagina)
  doc.rect(0, 0, pageWidth, pageHeight, "F")

  // ========== CABEÇALHO TEMA ESCURO ==========
  // Linha de acento colorida no topo
  doc.setDrawColor(...cores.primaria)
  doc.setLineWidth(3)
  doc.line(0, 0, pageWidth, 0)

  // Logo/Nome da empresa
  doc.setTextColor(...cores.texto)
  doc.setFontSize(11)
  doc.setFont("helvetica", "bold")
  doc.text(nomeEmpresa.toUpperCase(), 20, 15)
  
  // Título do relatório
  doc.setFontSize(20)
  doc.setFont("helvetica", "normal")
  doc.text("Relatório de Indisponibilidade", 20, 28)
  
  // Informações do período
  doc.setFontSize(8)
  doc.setTextColor(...cores.textoClaro)
  doc.setFont("helvetica", "normal")
  const periodoInicio = new Date(relatorio.periodo.inicio).toLocaleDateString("pt-BR")
  const periodoFim = new Date(relatorio.periodo.fim).toLocaleDateString("pt-BR")
  doc.text(`Período: ${periodoInicio} - ${periodoFim}`, pageWidth - 20, 15, { align: "right" })
  const dataGeracao = new Date(relatorio.geradoEm).toLocaleDateString("pt-BR")
  doc.text(`Gerado: ${dataGeracao}`, pageWidth - 20, 20, { align: "right" })

  // Linha separadora sutil
  doc.setDrawColor(...cores.borda)
  doc.setLineWidth(0.5)
  doc.line(20, 33, pageWidth - 20, 33)

  yPos = 42

  // ========== INFORMAÇÕES DO LINK ==========
  // Título da seção
  doc.setTextColor(...cores.texto)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("INFORMAÇÕES DO CIRCUITO", 20, yPos)
  yPos += 8

  // Container com fundo escuro
  doc.setFillColor(...cores.fundo)
  doc.roundedRect(20, yPos, pageWidth - 40, 32, 3, 3, "F")
  doc.setDrawColor(...cores.borda)
  doc.setLineWidth(0.5)
  doc.roundedRect(20, yPos, pageWidth - 40, 32, 3, 3, "S")

  // Barra de acento
  doc.setDrawColor(...cores.primaria)
  doc.setLineWidth(2)
  doc.line(26, yPos + 6, 45, yPos + 6)

  yPos += 10

  const infoLink = [
    ["Designador", relatorio.link.designador],
    ["Operadora", relatorio.link.operadora],
    ["Capacidade", relatorio.link.capacidade || "Não informada"],
    ["POP", `${relatorio.link.pop} - ${relatorio.link.popCidade}/${relatorio.link.popEstado}`],
    ["Ciclo", relatorio.link.diaVencimento ? `Dia ${relatorio.link.diaVencimento}` : "Não definido"],
  ]

  doc.setFontSize(7.5)
  infoLink.forEach(([label, value], index) => {
    const x = 26 + (index < 3 ? 0 : (pageWidth - 40) / 2)
    const y = yPos + (index % 3) * 6
    
    // Label
    doc.setTextColor(...cores.textoClaro)
    doc.setFont("helvetica", "bold")
    doc.text(`${label}:`, x, y)
    
    // Valor (branco para destaque)
    doc.setTextColor(255, 255, 255)
    doc.setFont("helvetica", "normal")
    doc.text(String(value), x + 25, y)
  })

  yPos += 26

  // ========== MÉTRICAS / KPIs ==========
  // Título da seção
  doc.setTextColor(...cores.texto)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("RESUMO DE INDISPONIBILIDADE", 20, yPos)
  yPos += 8

  // Função auxiliar para desenhar card minimalista
  const drawMinimalCard = (
    x: number, 
    y: number, 
    width: number, 
    height: number,
    label: string,
    value: string,
    subtitle: string,
    accentColor: [number, number, number]
  ) => {
    // Fundo escuro
    doc.setFillColor(...cores.fundo)
    doc.roundedRect(x, y, width, height, 3, 3, "F")
    doc.setDrawColor(...cores.borda)
    doc.setLineWidth(0.5)
    doc.roundedRect(x, y, width, height, 3, 3, "S")
    
    // Linha de acento colorida no topo
    doc.setDrawColor(...accentColor)
    doc.setLineWidth(2)
    doc.line(x + 6, y + 6, x + 25, y + 6)
    
    // Label
    doc.setTextColor(...cores.textoClaro)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "normal")
    doc.text(label.toUpperCase(), x + 8, y + 15)
    
    // Valor principal - branco para destaque
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.setFont("helvetica", "bold")
    doc.text(value, x + 8, y + 27)
    
    // Subtitle
    doc.setTextColor(...cores.textoClaro)
    doc.setFontSize(6.5)
    doc.setFont("helvetica", "normal")
    doc.text(subtitle, x + 8, y + 33)
  }

  const cardWidth = (pageWidth - 54) / 3
  const cardHeight = 36
  const cardGap = 7

  // Card 1 - Total de Incidentes
  drawMinimalCard(
    20, yPos, cardWidth, cardHeight,
    "Total de Incidentes",
    String(relatorio.metricas.totalIncidentes),
    "no período",
    cores.info
  )

  // Card 2 - Tempo Indisponível
  drawMinimalCard(
    20 + cardWidth + cardGap, yPos, cardWidth, cardHeight,
    "Tempo Indisponível",
    relatorio.metricas.tempoTotalIndisponivel,
    "total acumulado",
    cores.alerta
  )

  // Card 3 - Disponibilidade
  const corDisp = relatorio.metricas.cumpreSla ? cores.sucesso : cores.erro
  drawMinimalCard(
    20 + (cardWidth + cardGap) * 2, yPos, cardWidth, cardHeight,
    "Disponibilidade",
    `${relatorio.metricas.disponibilidade}%`,
    `SLA: ${relatorio.metricas.slaContratado}%`,
    corDisp
  )

  yPos += cardHeight + 10

  // Status SLA com badge premium
  if (relatorio.metricas.cumpreSla) {
    doc.setFillColor(...cores.sucesso)
    doc.roundedRect(20, yPos, 48, 7, 2, 2, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "bold")
    doc.text("✓ SLA CUMPRIDO", 24, yPos + 5)
  } else {
    doc.setFillColor(...cores.erro)
    doc.roundedRect(20, yPos, 65, 7, 2, 2, "F")
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(7.5)
    doc.setFont("helvetica", "bold")
    doc.text(`✗ DESCUMPRIMENTO: ${relatorio.metricas.descumprimentoSla}%`, 24, yPos + 5)
  }

  yPos += 14

  // ========== TABELA DE CHAMADOS ==========
  // Título da seção
  doc.setTextColor(...cores.texto)
  doc.setFontSize(9)
  doc.setFont("helvetica", "bold")
  doc.text("DETALHAMENTO DOS INCIDENTES", 20, yPos)
  yPos += 8

  const chamadosData = relatorio.chamados.map((c: any) => [
    c.numero,
    new Date(c.dataDeteccao).toLocaleString("pt-BR", { 
      day: "2-digit", month: "2-digit", year: "2-digit", 
      hour: "2-digit", minute: "2-digit" 
    }),
    c.dataNormalizacao 
      ? new Date(c.dataNormalizacao).toLocaleString("pt-BR", { 
          day: "2-digit", month: "2-digit", year: "2-digit", 
          hour: "2-digit", minute: "2-digit" 
        })
      : "Em aberto",
    c.duracaoFormatada,
    c.tipoFalha,
    c.protocoloOperadora || "-",
  ])

  autoTable(doc, {
    startY: yPos,
    head: [["Chamado", "Detecção", "Normalização", "Duração", "Tipo Falha", "Protocolo Op."]],
    body: chamadosData,
    margin: { left: 20, right: 20 },
    styles: {
      fontSize: 7.5,
      cellPadding: 3.5,
      lineColor: cores.borda,
      lineWidth: 0.3,
      textColor: cores.texto,
      fillColor: cores.fundo,
    },
    headStyles: {
      fillColor: [20, 28, 40],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7,
      halign: "left",
    },
    alternateRowStyles: {
      fillColor: [20, 31, 47],
    },
    columnStyles: {
      0: { fontStyle: "normal", cellWidth: 28 },
      1: { cellWidth: 32, fontSize: 7 },
      2: { cellWidth: 32, fontSize: 7 },
      3: { cellWidth: 20, halign: "center" },
      4: { cellWidth: 32 },
      5: { cellWidth: 30 },
    },
    didDrawPage: (data) => {
      if (data.pageNumber > 1) {
        const currentPage = doc.getCurrentPageInfo().pageNumber
        doc.setPage(currentPage)
        doc.setFillColor(...cores.fundoPagina)
        doc.rect(0, 0, pageWidth, pageHeight, "F")
        doc.setDrawColor(...cores.primaria)
        doc.setLineWidth(3)
        doc.line(0, 0, pageWidth, 0)
      }
    },
  })

  // ========== RODAPÉ EM TODAS AS PÁGINAS ==========
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    
    // Linha sutil no rodapé
    doc.setDrawColor(...cores.borda)
    doc.setLineWidth(0.5)
    doc.line(20, pageHeight - 15, pageWidth - 20, pageHeight - 15)
    
    // Info à esquerda
    doc.setFontSize(7)
    doc.setTextColor(...cores.textoClaro)
    doc.setFont("helvetica", "normal")
    doc.text(
      `${nomeEmpresa} · ${relatorio.link.designador}`,
      20,
      pageHeight - 10
    )
    
    // Número da página à direita
    doc.text(
      `${i} / ${pageCount}`,
      pageWidth - 20,
      pageHeight - 10,
      { align: "right" }
    )
  }

  // Salvar
  const nomeArquivo = `relatorio-${relatorio.link.designador}-${periodoInicio.replace(/\//g, "-")}-${periodoFim.replace(/\//g, "-")}`
  doc.save(`${nomeArquivo}.pdf`)
  
  return nomeArquivo
}


