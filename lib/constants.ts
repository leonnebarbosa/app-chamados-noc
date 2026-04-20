// Tipos de Serviço disponíveis
export const TIPOS_SERVICO = [
  { value: "link_ip", label: "Link IP" },
  { value: "link_ip_mitigacao", label: "Link IP + Mitigação" },
  { value: "cdn", label: "CDN" },
  { value: "mpls", label: "MPLS" },
  { value: "ip_dedicado", label: "IP Dedicado" },
  { value: "fibra", label: "Fibra Óptica" },
  { value: "radio", label: "Rádio" },
  { value: "satelite", label: "Satélite" },
  { value: "dwdm", label: "DWDM" },
  { value: "l2l", label: "Lan-to-Lan (L2L)" },
  { value: "vpn", label: "VPN" },
  { value: "sd_wan", label: "SD-WAN" },
  { value: "metro_ethernet", label: "Metro Ethernet" },
  { value: "epl", label: "EPL (Ethernet Private Line)" },
  { value: "evpl", label: "EVPL (Ethernet Virtual Private Line)" },
] as const

// Unidades de capacidade
export const UNIDADES_CAPACIDADE = [
  { value: "Kbps", label: "Kbps" },
  { value: "Mbps", label: "Mbps" },
  { value: "Gbps", label: "Gbps" },
  { value: "Tbps", label: "Tbps" },
] as const

// Tecnologias de transporte
export const TECNOLOGIAS_TRANSPORTE = [
  { value: "fibra", label: "Fibra Óptica" },
  { value: "opgw", label: "OPGW (Optical Ground Wire)" },
  { value: "radio", label: "Rádio" },
  { value: "satelite", label: "Satélite" },
  { value: "dwdm", label: "DWDM" },
  { value: "sdh", label: "SDH" },
  { value: "otn", label: "OTN" },
] as const

// Função para formatar capacidade
export function formatarCapacidade(valor: string | null, unidade: string | null): string {
  if (!valor) return ""
  if (!unidade) return valor
  return `${valor} ${unidade}`
}

// Função para parsear capacidade existente
export function parsearCapacidade(capacidade: string | null): { valor: string; unidade: string } {
  if (!capacidade) return { valor: "", unidade: "Mbps" }
  
  const match = capacidade.match(/^(\d+(?:\.\d+)?)\s*(Kbps|Mbps|Gbps|Tbps)?$/i)
  if (match) {
    return {
      valor: match[1],
      unidade: match[2] || "Mbps"
    }
  }
  
  return { valor: capacidade, unidade: "Mbps" }
}

// Função para obter label do tipo de serviço
export function getTipoServicoLabel(value: string | null): string {
  if (!value) return ""
  const tipo = TIPOS_SERVICO.find(t => t.value === value)
  return tipo?.label || value
}


