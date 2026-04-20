const { PrismaClient } = require("@prisma/client")
const bcrypt = require("bcryptjs")

const prisma = new PrismaClient()

async function main() {
  console.log("🌱 Iniciando seed...")

  // Verificar se já existe dados
  const existingUser = await prisma.usuario.findFirst()
  if (existingUser) {
    console.log("ℹ️ Banco já possui dados. Seed ignorado.")
    return
  }

  // Criar usuários
  const senhaHash = await bcrypt.hash("123456", 12)

  const supervisor = await prisma.usuario.create({
    data: {
      nome: "Supervisor NOC",
      email: "supervisor@noc.com",
      senhaHash,
      perfil: "supervisor",
    },
  })
  console.log("✅ Supervisor criado:", supervisor.email)

  const operador = await prisma.usuario.create({
    data: {
      nome: "Operador NOC",
      email: "operador@noc.com",
      senhaHash,
      perfil: "operador",
    },
  })
  console.log("✅ Operador criado:", operador.email)

  // Criar operadoras
  const operadoras = await Promise.all([
    prisma.operadora.create({ data: { nome: "Vivo", telefoneSuporte: "0800-775-1212", slaHoras: 4 } }),
    prisma.operadora.create({ data: { nome: "Claro", telefoneSuporte: "0800-720-1234", slaHoras: 4 } }),
    prisma.operadora.create({ data: { nome: "Oi", telefoneSuporte: "0800-031-8080", slaHoras: 6 } }),
    prisma.operadora.create({ data: { nome: "Embratel", telefoneSuporte: "0800-890-8090", slaHoras: 4 } }),
  ])
  console.log("✅ Operadoras criadas:", operadoras.length)

  // Criar POPs
  const pops = await Promise.all([
    prisma.pop.create({ data: { codigo: "SP-01", nome: "POP São Paulo Centro", cidade: "São Paulo", estado: "SP" } }),
    prisma.pop.create({ data: { codigo: "RJ-01", nome: "POP Rio Centro", cidade: "Rio de Janeiro", estado: "RJ" } }),
    prisma.pop.create({ data: { codigo: "MG-01", nome: "POP Belo Horizonte", cidade: "Belo Horizonte", estado: "MG" } }),
  ])
  console.log("✅ POPs criados:", pops.length)

  // Criar tipos de falha
  const tiposFalha = await Promise.all([
    prisma.tipoFalha.create({ data: { nome: "Queda Total", descricao: "Link completamente fora" } }),
    prisma.tipoFalha.create({ data: { nome: "Degradação", descricao: "Perda de performance" } }),
    prisma.tipoFalha.create({ data: { nome: "Intermitência", descricao: "Quedas frequentes" } }),
    prisma.tipoFalha.create({ data: { nome: "Latência Alta", descricao: "Tempo de resposta elevado" } }),
    prisma.tipoFalha.create({ data: { nome: "Perda de Pacotes", descricao: "Perda significativa de pacotes" } }),
  ])
  console.log("✅ Tipos de falha criados:", tiposFalha.length)

  // Criar links de exemplo
  const links = await Promise.all([
    prisma.link.create({ data: { designador: "VIVO-SP-001", operadoraId: operadoras[0].id, popId: pops[0].id, tipoServico: "MPLS", capacidade: "100 Mbps", cliente: "Cliente A" } }),
    prisma.link.create({ data: { designador: "CLARO-RJ-001", operadoraId: operadoras[1].id, popId: pops[1].id, tipoServico: "IP Dedicado", capacidade: "1 Gbps", cliente: "Cliente B" } }),
    prisma.link.create({ data: { designador: "OI-MG-001", operadoraId: operadoras[2].id, popId: pops[2].id, tipoServico: "Fibra", capacidade: "500 Mbps", cliente: "Cliente C" } }),
  ])
  console.log("✅ Links criados:", links.length)

  console.log("")
  console.log("🎉 Seed concluído!")
  console.log("")
  console.log("📧 Usuários de acesso:")
  console.log("   supervisor@noc.com / 123456 (Supervisor)")
  console.log("   operador@noc.com / 123456 (Operador)")
}

main()
  .catch((e) => {
    console.error("Erro no seed:", e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })

