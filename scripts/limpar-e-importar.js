const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

// Mapeamento de consolidação de nomes de circuitos
const consolidarCircuito = {
  'CLICFACIL_TRANSP_ITB': 'RPXITB',
  'CLICFACIL_TRANSP_ITB_RP': 'RPXITB',
  'TRANSP._CLICKFACIL': 'RPXITB',
  'ELTN_TRANSP_BSB': 'ELTN_TRANSP_ATM_BSB',
  'ELTN_TRANSP_ITB': 'ELTN_TRANSP_ATM_ITB',
  'ELTN_TRANSP_STM': 'ELTN_TRANSP_STM_BSB',
};

// Circuitos que são TRANSPORTES (não Links)
const circuitosTransporte = {
  'RPXITB': { nome: 'Transporte RP x ITB', fornecedor: 'CLICFACIL', origem: 'Rurópolis', destino: 'Itaituba', tecnologia: 'Fibra' },
  'ELTN_TRANSP_ATM_BSB': { nome: 'Transporte ATM-BSB', fornecedor: 'ELETRONORTE', origem: 'Altamira', destino: 'Brasília', tecnologia: 'Fibra' },
  'ELTN_TRANSP_ATM_ITB': { nome: 'Transporte ATM-ITB', fornecedor: 'ELETRONORTE', origem: 'Altamira', destino: 'Itaituba', tecnologia: 'Fibra' },
  'ELTN_TRANSP_STM_BSB': { nome: 'Transporte STM-BSB', fornecedor: 'ELETRONORTE', origem: 'Santarém', destino: 'Brasília', tecnologia: 'Fibra' },
  'MOV_TRANSP': { nome: 'Transporte MOV', fornecedor: 'MOV', origem: 'Santarém', destino: 'Altamira', tecnologia: 'Fibra' },
  'TRANS_ITB<>RP (WSP)': { nome: 'Transporte ITB-RP (WSP)', fornecedor: 'WSP', origem: 'Itaituba', destino: 'Rurópolis', tecnologia: 'Fibra' },
};

function isTransporte(nomeCircuito) {
  const nomeConsolidado = consolidarCircuito[nomeCircuito] || nomeCircuito;
  return circuitosTransporte.hasOwnProperty(nomeConsolidado);
}

// Mapeamento de circuito para POP baseado no sufixo
function getPOPPorCircuito(nomeCircuito) {
  const nome = nomeCircuito.toUpperCase();
  
  // Transportes ELETRONORTE - o sufixo indica destino, não origem
  if (nome.includes('ELTN_TRANSP_STM')) return 'PA_STM_AR02';
  if (nome.includes('ELTN_TRANSP_ATM_ITB')) return 'PA-ITB-AR01';
  if (nome.includes('ELTN_TRANSP_ATM_BSB')) return 'PA_ATM_POP_DATACENTER';
  
  if (nome.includes('_STM') || nome.includes('STM_')) return 'PA_STM_AR02';
  if (nome.includes('_ITB') || nome.includes('ITB_') || nome.includes('RPXITB')) return 'PA-ITB-AR01';
  if (nome.includes('_ATM') || nome.includes('ATM_')) return 'PA_ATM_POP_DATACENTER';
  if (nome.includes('_BSB') || nome.includes('BSB_')) return 'GERAL'; // Brasília é externo
  if (nome.includes('_RP') || nome.includes('RP_')) return 'PA_RP_AR01';
  if (nome.includes('_KM80') || nome.includes('KM80_')) return 'PA_KM80_AR01';
  if (nome.includes('_URU') || nome.includes('URU_')) return 'PA_URU_AR01';
  if (nome.includes('_BRN') || nome.includes('BRN_')) return 'PA_BRN_AR01/TNS';
  
  return 'GERAL';
}

// Mapeamento de prefixos de circuito para operadora
const prefixoOperadora = {
  'SEA': 'SEA',
  'LINK BRASIL': 'LINK BRASIL',
  'LINK-BRASIL': 'LINK BRASIL',
  'ESTRATÉGIA': 'ESTRATEGIA',
  'ESTRATEGIA': 'ESTRATEGIA',
  'ELTN': 'ELETRONORTE',
  'ELETRONORTE': 'ELETRONORTE',
  'AMAZONET': 'AMAZONET',
  'LINK-AMAZONET': 'AMAZONET',
  'CLICFACIL': 'CLICFACIL',
  'CLICKFACIL': 'CLICFACIL',
  'RPXITB': 'CLICFACIL',
  'RP X ITB': 'CLICFACIL',
  'EMBRATEL': 'EMBRATEL',
  'TELEBRAS': 'ESTRATEGIA',
  'WIRE': 'WIRELINK',
  'IX': 'IX',
  'MOV': 'MOV',
  'WSP': 'WSP',
  'TRANS_ITB': 'WSP',
};

function getOperadoraPorCircuito(nomeCircuito) {
  const nome = nomeCircuito.toUpperCase();
  for (const [prefixo, op] of Object.entries(prefixoOperadora)) {
    if (nome.includes(prefixo.toUpperCase())) {
      return op;
    }
  }
  return 'Desconhecida';
}


async function main() {
  console.log('🗑️  Limpando dados existentes...\n');
  
  // Limpar na ordem correta (respeitando foreign keys)
  const deletedHistorico = await prisma.chamadoHistorico.deleteMany();
  console.log(`   ✅ ${deletedHistorico.count} históricos deletados`);
  
  const deletedAnexos = await prisma.chamadoAnexo.deleteMany();
  console.log(`   ✅ ${deletedAnexos.count} anexos deletados`);
  
  const deletedChamados = await prisma.chamado.deleteMany();
  console.log(`   ✅ ${deletedChamados.count} chamados deletados`);
  
  const deletedLinks = await prisma.link.deleteMany();
  console.log(`   ✅ ${deletedLinks.count} links deletados`);
  
  const deletedTransportes = await prisma.transporte.deleteMany();
  console.log(`   ✅ ${deletedTransportes.count} transportes deletados`);
  
  const deletedPops = await prisma.pop.deleteMany();
  console.log(`   ✅ ${deletedPops.count} POPs deletados`);
  
  const deletedOperadoras = await prisma.operadora.deleteMany();
  console.log(`   ✅ ${deletedOperadoras.count} operadoras deletadas`);
  
  const deletedTiposFalha = await prisma.tipoFalha.deleteMany();
  console.log(`   ✅ ${deletedTiposFalha.count} tipos de falha deletados`);

  console.log('\n✅ Limpeza concluída!');
  
  // Ler dados
  const dadosPath = path.join(__dirname, 'dados-para-revisao.json');
  const dados = JSON.parse(fs.readFileSync(dadosPath, 'utf-8'));
  
  console.log('\n🚀 Iniciando importação...\n');
  
  // =============================================
  // 1. Criar Operadoras
  // =============================================
  console.log('📦 Criando Operadoras...');
  const operadoras = ['AMAZONET', 'CLICFACIL', 'ELETRONORTE', 'EMBRATEL', 'ESTRATEGIA', 'IX', 'LINK BRASIL', 'MOV', 'SEA', 'WIRELINK', 'WSP'];
  const operadorasMap = {};
  
  for (const nome of operadoras) {
    const op = await prisma.operadora.create({
      data: { nome, ativo: true }
    });
    operadorasMap[nome] = op.id;
    console.log(`   ✅ ${nome}`);
  }
  
  // =============================================
  // 2. Criar Tipos de Falha
  // =============================================
  console.log('\n📦 Criando Tipos de Falha...');
  const tiposFalha = [
    { nome: 'Queda Total', descricao: 'Indisponibilidade total do serviço' },
    { nome: 'Intermitência', descricao: 'Oscilações e instabilidades' },
    { nome: 'Degradação', descricao: 'Perda parcial de desempenho' },
    { nome: 'Latência Alta', descricao: 'Atraso na comunicação' },
    { nome: 'Limitação de Banda', descricao: 'Redução de capacidade' },
    { nome: 'Diversos', descricao: 'Outros tipos de falha' },
  ];
  const tiposFalhaMap = {};
  
  for (const tf of tiposFalha) {
    const tipo = await prisma.tipoFalha.create({ data: tf });
    tiposFalhaMap[tf.nome.toLowerCase()] = tipo.id;
    console.log(`   ✅ ${tf.nome}`);
  }
  
  // =============================================
  // 3. Criar POPs
  // =============================================
  console.log('\n📦 Criando POPs...');
  const popsData = [
    { codigo: 'GERAL', nome: 'GERAL', cidade: 'Todas', estado: 'PA', endereco: 'Geral' },
    { codigo: 'PA_ATM_DC', nome: 'PA_ATM_POP_DATACENTER', cidade: 'Altamira', estado: 'PA', endereco: 'Datacenter' },
    { codigo: 'PA_BRN_AR01', nome: 'PA_BRN_AR01/TNS', cidade: 'Breves', estado: 'PA', endereco: 'AR01' },
    { codigo: 'PA_KM80_AR01', nome: 'PA_KM80_AR01', cidade: 'KM80', estado: 'PA', endereco: 'AR01' },
    { codigo: 'PA_RP_AR01', nome: 'PA_RP_AR01', cidade: 'Rurópolis', estado: 'PA', endereco: 'AR01' },
    { codigo: 'PA_STM_AR02', nome: 'PA_STM_AR02', cidade: 'Santarém', estado: 'PA', endereco: 'AR02' },
    { codigo: 'PA_STM_AR03', nome: 'PA_STM_AR03', cidade: 'Santarém', estado: 'PA', endereco: 'AR03' },
    { codigo: 'PA_URU_AR01', nome: 'PA_URU_AR01', cidade: 'Uruará', estado: 'PA', endereco: 'AR01' },
    { codigo: 'PA_ITB_AR01', nome: 'PA-ITB-AR01', cidade: 'Itaituba', estado: 'PA', endereco: 'AR01' },
  ];
  const popsMap = {};
  let popPadraoId;
  
  for (const pop of popsData) {
    const p = await prisma.pop.create({ data: { ...pop, ativo: true } });
    popsMap[pop.nome] = p.id;
    if (pop.nome === 'GERAL') popPadraoId = p.id;
    console.log(`   ✅ ${pop.nome}`);
  }
  
  // =============================================
  // 4. Criar Transportes
  // =============================================
  console.log('\n📦 Criando Transportes...');
  const transportesMap = {};
  
  for (const [designador, info] of Object.entries(circuitosTransporte)) {
    try {
      const t = await prisma.transporte.create({
        data: {
          nome: info.nome,
          fornecedor: info.fornecedor,
          origem: info.origem,
          destino: info.destino,
          tecnologia: info.tecnologia,
          ativo: true
        }
      });
      transportesMap[designador.toUpperCase()] = t.id;
      console.log(`   ✅ ${designador} (${info.fornecedor} | ${info.origem} → ${info.destino})`);
    } catch (e) {
      console.log(`   ⚠️  ${designador} - ${e.message.substring(0, 50)}`);
    }
  }
  
  // =============================================
  // 5. Criar Links (exceto transportes)
  // =============================================
  console.log('\n📦 Criando Links...');
  const linksMap = {};
  
  // Coletar circuitos únicos após consolidação
  const circuitosUnicos = new Set();
  for (const circ of dados.circuitos) {
    const nomeConsolidado = consolidarCircuito[circ.designador] || circ.designador;
    if (!isTransporte(nomeConsolidado)) {
      circuitosUnicos.add(nomeConsolidado);
    }
  }
  // Adicionar circuitos dos chamados (apenas links)
  for (const ch of dados.chamados) {
    const nomeConsolidado = consolidarCircuito[ch.circuito] || ch.circuito;
    if (!isTransporte(nomeConsolidado)) {
      circuitosUnicos.add(nomeConsolidado);
    }
  }
  
  for (const nomeCircuito of circuitosUnicos) {
    const operadoraNome = getOperadoraPorCircuito(nomeCircuito);
    const operadoraId = operadorasMap[operadoraNome] || operadorasMap['ESTRATEGIA'];
    const popNome = getPOPPorCircuito(nomeCircuito);
    const popId = popsMap[popNome] || popPadraoId;
    
    try {
      const l = await prisma.link.create({
        data: {
          designador: nomeCircuito,
          operadoraId: operadoraId,
          popId: popId,
          tipoServico: 'LINK IP'
        }
      });
      linksMap[nomeCircuito.toUpperCase()] = l.id;
      console.log(`   ✅ ${nomeCircuito} (${operadoraNome} | ${popNome})`);
    } catch (e) {
      console.log(`   ⚠️  ${nomeCircuito} - ${e.message.substring(0, 50)}`);
    }
  }
  
  // =============================================
  // 6. Importar Chamados
  // =============================================
  console.log('\n📦 Importando Chamados...');
  
  // Obter primeiro usuário para associar
  let usuario = await prisma.usuario.findFirst();
  if (!usuario) {
    usuario = await prisma.usuario.create({
      data: {
        nome: 'Sistema Import',
        email: 'import@sistema.local',
        senha: 'hash',
        perfil: 'operador',
        ativo: true
      }
    });
  }
  
  let importados = 0;
  let erros = 0;
  
  for (const chamado of dados.chamados) {
    // Consolidar nome do circuito
    const nomeConsolidado = consolidarCircuito[chamado.circuito] || chamado.circuito;
    
    // Verificar se é transporte ou link
    let linkId = null;
    let transporteId = null;
    
    if (isTransporte(nomeConsolidado)) {
      // É um transporte
      transporteId = transportesMap[nomeConsolidado.toUpperCase()];
      if (!transporteId) {
        console.log(`   ❌ Transporte não encontrado: ${nomeConsolidado}`);
        erros++;
        continue;
      }
    } else {
      // É um link
      linkId = linksMap[nomeConsolidado.toUpperCase()];
      if (!linkId) {
        // Criar link se não existir
        const operadoraNome = getOperadoraPorCircuito(nomeConsolidado);
        const operadoraId = operadorasMap[operadoraNome] || operadorasMap['ESTRATEGIA'];
        const popNome = getPOPPorCircuito(nomeConsolidado);
        const popId = popsMap[popNome] || popPadraoId;
        
        try {
          const novoLink = await prisma.link.create({
            data: {
              designador: nomeConsolidado,
              operadoraId: operadoraId,
              popId: popId,
              tipoServico: 'LINK IP'
            }
          });
          linkId = novoLink.id;
          linksMap[nomeConsolidado.toUpperCase()] = linkId;
          console.log(`   📎 Novo link: ${nomeConsolidado} (${operadoraNome})`);
        } catch (e) {
          const existente = await prisma.link.findFirst({
            where: { designador: nomeConsolidado }
          });
          if (existente) {
            linkId = existente.id;
            linksMap[nomeConsolidado.toUpperCase()] = linkId;
          }
        }
      }
      
      if (!linkId) {
        console.log(`   ❌ Sem link para: ${chamado.circuito}`);
        erros++;
        continue;
      }
    }
    
    // Determinar tipo de falha
    let tipoFalhaId = tiposFalhaMap['queda total'];
    const motivo = (chamado.motivo || '').toLowerCase();
    if (motivo.includes('intermit') || motivo.includes('oscila') || motivo.includes('instabil')) {
      tipoFalhaId = tiposFalhaMap['intermitência'];
    } else if (motivo.includes('degrada') || motivo.includes('perda')) {
      tipoFalhaId = tiposFalhaMap['degradação'];
    } else if (motivo.includes('latência') || motivo.includes('lentidão')) {
      tipoFalhaId = tiposFalhaMap['latência alta'];
    } else if (motivo.includes('limitação') || motivo.includes('banda')) {
      tipoFalhaId = tiposFalhaMap['limitação de banda'];
    }
    
    try {
      await prisma.chamado.create({
        data: {
          numero: chamado.numero,
          status: chamado.status || 'fechado',
          impacto: chamado.impacto || 'medio',
          descricaoProblema: chamado.descricao || `${chamado.motivo} - ${chamado.submotivo}`,
          protocoloOperadora: chamado.protocolo || null,
          dataAbertura: new Date(chamado.dataDeteccao),
          dataDeteccao: new Date(chamado.dataDeteccao),
          dataNormalizacao: chamado.dataNormalizacao ? new Date(chamado.dataNormalizacao) : null,
          dataFechamento: chamado.dataFechamento ? new Date(chamado.dataFechamento) : null,
          linkId: linkId,
          transporteId: transporteId,
          tipoFalhaId: tipoFalhaId,
          abertoPorId: usuario.id,
          fechadoPorId: usuario.id,
        }
      });
      importados++;
      
      if (importados % 50 === 0) {
        console.log(`   📝 ${importados} chamados importados...`);
      }
    } catch (e) {
      console.log(`   ❌ Erro em ${chamado.numero}: ${e.message.substring(0, 50)}`);
      erros++;
    }
  }
  
  // =============================================
  // Resumo Final
  // =============================================
  const totalLinks = await prisma.link.count();
  const totalTransportes = await prisma.transporte.count();
  const totalPops = await prisma.pop.count();
  const totalOps = await prisma.operadora.count();
  
  console.log('\n============================================================');
  console.log('🎉 IMPORTAÇÃO CONCLUÍDA!');
  console.log('============================================================');
  console.log(`   ✅ Chamados importados: ${importados}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log(`   📊 POPs: ${totalPops}`);
  console.log(`   📊 Links: ${totalLinks}`);
  console.log(`   📊 Transportes: ${totalTransportes}`);
  console.log(`   📊 Operadoras: ${totalOps}`);
  console.log('============================================================\n');
  
  await prisma.$disconnect();
}

main().catch(console.error);
