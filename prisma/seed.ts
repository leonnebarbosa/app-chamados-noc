import { PrismaClient } from "@prisma/client"
import bcrypt from "bcryptjs"

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed...")

  // Criar usuários
  const senhaHash = await bcrypt.hash("123456", 12)

  const supervisor = await prisma.usuario.upsert({
    where: { email: "supervisor@noc.com" },
    update: {},
    create: {
      nome: "Supervisor NOC",
      email: "supervisor@noc.com",
      senhaHash,
      perfil: "supervisor",
    },
  })
  console.log("✅ Supervisor criado:", supervisor.email)

  const operadores = await Promise.all([
    prisma.usuario.upsert({
      where: { email: "joao@noc.com" },
      update: {},
      create: { nome: "João Silva", email: "joao@noc.com", senhaHash, perfil: "operador" },
    }),
    prisma.usuario.upsert({
      where: { email: "maria@noc.com" },
      update: {},
      create: { nome: "Maria Santos", email: "maria@noc.com", senhaHash, perfil: "operador" },
    }),
    prisma.usuario.upsert({
      where: { email: "pedro@noc.com" },
      update: {},
      create: { nome: "Pedro Costa", email: "pedro@noc.com", senhaHash, perfil: "operador" },
    }),
    prisma.usuario.upsert({
      where: { email: "ana@noc.com" },
      update: {},
      create: { nome: "Ana Oliveira", email: "ana@noc.com", senhaHash, perfil: "operador" },
    }),
  ])
  console.log("✅ Operadores criados:", operadores.length)

  // Criar operadoras
  const operadoras = await Promise.all([
    prisma.operadora.upsert({
      where: { id: 1 },
      update: {},
      create: { nome: "Vivo", telefoneSuporte: "0800-775-1212", slaHoras: 4 },
    }),
    prisma.operadora.upsert({
      where: { id: 2 },
      update: {},
      create: { nome: "Claro", telefoneSuporte: "0800-720-1234", slaHoras: 4 },
    }),
    prisma.operadora.upsert({
      where: { id: 3 },
      update: {},
      create: { nome: "Oi", telefoneSuporte: "0800-031-8080", slaHoras: 6 },
    }),
    prisma.operadora.upsert({
      where: { id: 4 },
      update: {},
      create: { nome: "Embratel", telefoneSuporte: "0800-890-8090", slaHoras: 4 },
    }),
    prisma.operadora.upsert({
      where: { id: 5 },
      update: {},
      create: { nome: "Algar", telefoneSuporte: "0800-701-0110", slaHoras: 6 },
    }),
  ])
  console.log("✅ Operadoras criadas:", operadoras.length)

  // Criar POPs
  const pops = await Promise.all([
    prisma.pop.upsert({
      where: { codigo: "SP-01" },
      update: {},
      create: { codigo: "SP-01", nome: "POP São Paulo Centro", cidade: "São Paulo", estado: "SP" },
    }),
    prisma.pop.upsert({
      where: { codigo: "RJ-01" },
      update: {},
      create: { codigo: "RJ-01", nome: "POP Rio Centro", cidade: "Rio de Janeiro", estado: "RJ" },
    }),
    prisma.pop.upsert({
      where: { codigo: "MG-01" },
      update: {},
      create: { codigo: "MG-01", nome: "POP Belo Horizonte", cidade: "Belo Horizonte", estado: "MG" },
    }),
    prisma.pop.upsert({
      where: { codigo: "PR-01" },
      update: {},
      create: { codigo: "PR-01", nome: "POP Curitiba", cidade: "Curitiba", estado: "PR" },
    }),
    prisma.pop.upsert({
      where: { codigo: "RS-01" },
      update: {},
      create: { codigo: "RS-01", nome: "POP Porto Alegre", cidade: "Porto Alegre", estado: "RS" },
    }),
    prisma.pop.upsert({
      where: { codigo: "BA-01" },
      update: {},
      create: { codigo: "BA-01", nome: "POP Salvador", cidade: "Salvador", estado: "BA" },
    }),
  ])
  console.log("✅ POPs criados:", pops.length)

  // Criar tipos de falha
  const tiposFalha = await Promise.all([
    prisma.tipoFalha.upsert({
      where: { id: 1 },
      update: {},
      create: { nome: "Queda Total", descricao: "Link completamente fora de operação" },
    }),
    prisma.tipoFalha.upsert({
      where: { id: 2 },
      update: {},
      create: { nome: "Degradação", descricao: "Perda de performance ou qualidade" },
    }),
    prisma.tipoFalha.upsert({
      where: { id: 3 },
      update: {},
      create: { nome: "Intermitência", descricao: "Quedas e retornos frequentes" },
    }),
    prisma.tipoFalha.upsert({
      where: { id: 4 },
      update: {},
      create: { nome: "Latência Alta", descricao: "Tempo de resposta elevado" },
    }),
    prisma.tipoFalha.upsert({
      where: { id: 5 },
      update: {},
      create: { nome: "Perda de Pacotes", descricao: "Perda significativa de pacotes" },
    }),
    prisma.tipoFalha.upsert({
      where: { id: 6 },
      update: {},
      create: { nome: "Erro de Configuração", descricao: "Problema de configuração" },
    }),
  ])
  console.log("✅ Tipos de falha criados:", tiposFalha.length)

  // Criar links (sequencialmente para evitar problemas de FK)
  const link1 = await prisma.link.upsert({
    where: { designador: "VIVO-SP-001" },
    update: {},
    create: { designador: "VIVO-SP-001", operadoraId: operadoras[0].id, popId: pops[0].id, tipoServico: "MPLS", capacidade: "100Mbps" },
  })
  const link2 = await prisma.link.upsert({
    where: { designador: "VIVO-SP-002" },
    update: {},
    create: { designador: "VIVO-SP-002", operadoraId: operadoras[0].id, popId: pops[0].id, tipoServico: "IP Dedicado", capacidade: "50Mbps" },
  })
  const link3 = await prisma.link.upsert({
    where: { designador: "CLARO-RJ-001" },
    update: {},
    create: { designador: "CLARO-RJ-001", operadoraId: operadoras[1].id, popId: pops[1].id, tipoServico: "Fibra", capacidade: "1Gbps" },
  })
  const link4 = await prisma.link.upsert({
    where: { designador: "OI-MG-001" },
    update: {},
    create: { designador: "OI-MG-001", operadoraId: operadoras[2].id, popId: pops[2].id, tipoServico: "MPLS", capacidade: "200Mbps" },
  })
  const link5 = await prisma.link.upsert({
    where: { designador: "EMBRATEL-PR-001" },
    update: {},
    create: { designador: "EMBRATEL-PR-001", operadoraId: operadoras[3].id, popId: pops[3].id, tipoServico: "IP Dedicado", capacidade: "100Mbps" },
  })
  const link6 = await prisma.link.upsert({
    where: { designador: "ALGAR-RS-001" },
    update: {},
    create: { designador: "ALGAR-RS-001", operadoraId: operadoras[4].id, popId: pops[4].id, tipoServico: "Fibra", capacidade: "500Mbps" },
  })
  const link7 = await prisma.link.upsert({
    where: { designador: "VIVO-BA-001" },
    update: {},
    create: { designador: "VIVO-BA-001", operadoraId: operadoras[0].id, popId: pops[5].id, tipoServico: "Rádio", capacidade: "20Mbps" },
  })
  const links = [link1, link2, link3, link4, link5, link6, link7]
  console.log("✅ Links criados:", links.length)

  // Criar alguns chamados de exemplo
  const chamado1 = await prisma.chamado.upsert({
    where: { numero: "INC-2024-0001" },
    update: {},
    create: {
      numero: "INC-2024-0001",
      linkId: link1.id,
      tipoFalhaId: tiposFalha[0].id,
      dataDeteccao: new Date(Date.now() - 3 * 60 * 60 * 1000), // 3h atrás
      impacto: "critico",
      status: "aguardando_operadora",
      descricaoProblema: "Link completamente fora. Cliente reportou indisponibilidade total do serviço desde 10:00.",
      protocoloOperadora: "VV2024123456",
      dataContatoOperadora: new Date(Date.now() - 2.5 * 60 * 60 * 1000),
      abertoPorId: operadores[0].id,
    },
  })
  await prisma.chamadoHistorico.create({
    data: {
      chamadoId: chamado1.id,
      usuarioId: operadores[0].id,
      tipoAcao: "abertura",
      descricao: "Chamado aberto",
      statusNovo: "aberto",
    },
  })
  await prisma.chamadoHistorico.create({
    data: {
      chamadoId: chamado1.id,
      usuarioId: operadores[0].id,
      tipoAcao: "contato_operadora",
      descricao: "Contatei operadora Vivo. Protocolo VV2024123456. Previsão de 2h para normalização.",
      statusAnterior: "aberto",
      statusNovo: "aguardando_operadora",
    },
  })

  const chamado2 = await prisma.chamado.upsert({
    where: { numero: "INC-2024-0002" },
    update: {},
    create: {
      numero: "INC-2024-0002",
      linkId: link3.id,
      tipoFalhaId: tiposFalha[1].id,
      dataDeteccao: new Date(Date.now() - 5 * 60 * 60 * 1000),
      impacto: "alto",
      status: "em_andamento",
      descricaoProblema: "Degradação severa. Throughput caiu de 1Gbps para 200Mbps.",
      abertoPorId: operadores[1].id,
    },
  })
  await prisma.chamadoHistorico.create({
    data: {
      chamadoId: chamado2.id,
      usuarioId: operadores[1].id,
      tipoAcao: "abertura",
      descricao: "Chamado aberto",
      statusNovo: "aberto",
    },
  })

  const chamado3 = await prisma.chamado.upsert({
    where: { numero: "INC-2024-0003" },
    update: {},
    create: {
      numero: "INC-2024-0003",
      linkId: link5.id,
      tipoFalhaId: tiposFalha[2].id,
      dataDeteccao: new Date(Date.now() - 1 * 60 * 60 * 1000),
      impacto: "medio",
      status: "aberto",
      descricaoProblema: "Intermitência reportada pelo cliente. Link caindo a cada 15 minutos aproximadamente.",
      abertoPorId: operadores[2].id,
    },
  })
  await prisma.chamadoHistorico.create({
    data: {
      chamadoId: chamado3.id,
      usuarioId: operadores[2].id,
      tipoAcao: "abertura",
      descricao: "Chamado aberto",
      statusNovo: "aberto",
    },
  })

  console.log("✅ Chamados de exemplo criados")
  console.log("")
  console.log("🎉 Seed concluído!")
  console.log("")
  console.log("📧 Usuários de teste:")
  console.log("   supervisor@noc.com / 123456 (Supervisor)")
  console.log("   joao@noc.com / 123456 (Operador)")
  console.log("   maria@noc.com / 123456 (Operador)")
  console.log("   pedro@noc.com / 123456 (Operador)")
  console.log("   ana@noc.com / 123456 (Operador)")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

