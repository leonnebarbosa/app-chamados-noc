const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Iniciando importação...\n');
  
  // Ler dados preparados
  const dados = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'dados-para-importar.json'), 'utf-8')
  );
  
  // =============================================
  // 1. Importar Operadoras
  // =============================================
  console.log('📦 Importando Operadoras...');
  const operadorasMap = {};
  
  for (const op of dados.operadoras) {
    const existing = await prisma.operadora.findFirst({
      where: { nome: op.nome }
    });
    
    if (existing) {
      operadorasMap[op.nome] = existing.id;
      console.log(`   ⏭️  ${op.nome} (já existe)`);
    } else {
      const created = await prisma.operadora.create({
        data: {
          nome: op.nome,
          telefoneSuporte: op.telefone || null,
          slaHoras: op.sla || 4
        }
      });
      operadorasMap[op.nome] = created.id;
      console.log(`   ✅ ${op.nome}`);
    }
  }
  
  // Adicionar operadora "Desconhecida" para circuitos sem operadora identificada
  let opDesconhecida = await prisma.operadora.findFirst({
    where: { nome: 'Desconhecida' }
  });
  if (!opDesconhecida) {
    opDesconhecida = await prisma.operadora.create({
      data: { nome: 'Desconhecida', slaHoras: 4 }
    });
  }
  operadorasMap['Desconhecida'] = opDesconhecida.id;
  
  // =============================================
  // 2. Importar Tipos de Falha
  // =============================================
  console.log('\n📦 Importando Tipos de Falha...');
  const tiposFalhaMap = {};
  
  // Mapeamento para nomes padronizados
  const tiposFalhaPadrao = {
    'intermitencia': { nome: 'Intermitência', descricao: 'Quedas e retornos frequentes' },
    'link down': { nome: 'Queda Total', descricao: 'Link completamente fora' },
    'degradação': { nome: 'Degradação', descricao: 'Perda de performance' },
    'diversos': { nome: 'Diversos', descricao: 'Outros tipos de falha' },
    'limitação de banda': { nome: 'Limitação de Banda', descricao: 'Banda limitada ou reduzida' },
    'latencia alta': { nome: 'Latência Alta', descricao: 'Tempo de resposta elevado' },
    'indisponibilidade': { nome: 'Queda Total', descricao: 'Link completamente fora' },
    'oscilação': { nome: 'Intermitência', descricao: 'Quedas e retornos frequentes' },
    'queda': { nome: 'Queda Total', descricao: 'Link completamente fora' },
    'rompimento': { nome: 'Queda Total', descricao: 'Rompimento de fibra/cabo' },
  };
  
  for (const tipo of Object.values(tiposFalhaPadrao)) {
    const existing = await prisma.tipoFalha.findFirst({
      where: { nome: tipo.nome }
    });
    
    if (existing) {
      tiposFalhaMap[tipo.nome.toLowerCase()] = existing.id;
    } else {
      const created = await prisma.tipoFalha.create({
        data: tipo
      });
      tiposFalhaMap[tipo.nome.toLowerCase()] = created.id;
      console.log(`   ✅ ${tipo.nome}`);
    }
  }
  
  // Mapear nomes originais para IDs
  for (const [original, padrao] of Object.entries(tiposFalhaPadrao)) {
    tiposFalhaMap[original] = tiposFalhaMap[padrao.nome.toLowerCase()];
  }
  
  // =============================================
  // 3. Importar POPs
  // =============================================
  console.log('\n📦 Importando POPs...');
  const popsMap = {};
  
  // Mapeamento de siglas de cidades
  const cidadesMap = {
    'ITB': { cidade: 'Itaituba', estado: 'PA' },
    'STM': { cidade: 'Santarém', estado: 'PA' },
    'ATM': { cidade: 'Altamira', estado: 'PA' },
    'BSB': { cidade: 'Brasília', estado: 'DF' },
    'RP': { cidade: 'Rurópolis', estado: 'PA' },
    'VP': { cidade: 'Vitória do Xingu', estado: 'PA' },
    'URU': { cidade: 'Uruará', estado: 'PA' },
    'PLACAS': { cidade: 'Placas', estado: 'PA' },
    'TODAS': { cidade: 'Todas', estado: 'PA' },
    'GERAL': { cidade: 'Geral', estado: 'PA' },
    'N/A': { cidade: 'Não informado', estado: 'PA' },
  };
  
  for (const pop of dados.pops) {
    const cidadeSigla = pop.cidade.toUpperCase();
    const cidadeInfo = cidadesMap[cidadeSigla] || { cidade: pop.cidade, estado: 'PA' };
    
    const existing = await prisma.pop.findFirst({
      where: { codigo: pop.codigo }
    });
    
    if (existing) {
      popsMap[pop.codigo.toUpperCase()] = existing.id;
    } else {
      try {
        const created = await prisma.pop.create({
          data: {
            codigo: pop.codigo,
            nome: pop.nome || pop.codigo,
            cidade: cidadeInfo.cidade,
            estado: cidadeInfo.estado
          }
        });
        popsMap[pop.codigo.toUpperCase()] = created.id;
        console.log(`   ✅ ${pop.codigo} (${cidadeInfo.cidade})`);
      } catch (e) {
        console.log(`   ⚠️  ${pop.codigo} - erro: ${e.message}`);
      }
    }
  }
  
  // =============================================
  // 4. Importar Circuitos/Links
  // =============================================
  console.log('\n📦 Importando Circuitos/Links...');
  const circuitosMap = {};
  
  // Pegar primeiro POP como padrão
  const primeiroPop = await prisma.pop.findFirst();
  const popPadraoId = primeiroPop?.id || 1;
  
  for (const circ of dados.circuitos) {
    const operadoraId = operadorasMap[circ.operadora] || operadorasMap['Desconhecida'];
    
    const existing = await prisma.link.findFirst({
      where: { designador: circ.designador }
    });
    
    if (existing) {
      circuitosMap[circ.designador.toUpperCase()] = existing.id;
    } else {
      try {
        const created = await prisma.link.create({
          data: {
            designador: circ.designador,
            operadoraId: operadoraId,
            popId: popPadraoId,
            tipoServico: circ.tipo || 'LINK IP',
            capacidade: '',
            cliente: ''
          }
        });
        circuitosMap[circ.designador.toUpperCase()] = created.id;
        console.log(`   ✅ ${circ.designador} (${circ.operadora})`);
      } catch (e) {
        console.log(`   ⚠️  ${circ.designador} - erro: ${e.message}`);
      }
    }
  }
  
  // =============================================
  // 5. Importar Chamados
  // =============================================
  console.log('\n📦 Importando Chamados...');
  
  // Pegar usuário padrão (supervisor)
  const usuarioPadrao = await prisma.usuario.findFirst({
    where: { perfil: 'supervisor' }
  });
  
  if (!usuarioPadrao) {
    console.log('❌ Nenhum usuário supervisor encontrado. Crie um usuário primeiro.');
    return;
  }
  
  let importados = 0;
  let ignorados = 0;
  let erros = 0;
  
  for (const chamado of dados.chamados) {
    // Verificar se já existe
    const existing = await prisma.chamado.findFirst({
      where: { numero: chamado.numero }
    });
    
    if (existing) {
      ignorados++;
      continue;
    }
    
    // Buscar link
    const linkId = circuitosMap[chamado.circuito.toUpperCase()];
    if (!linkId) {
      // Criar link se não existir
      const novoLink = await prisma.link.create({
        data: {
          designador: chamado.circuito,
          operadoraId: operadorasMap['Desconhecida'],
          popId: popPadraoId,
          tipoServico: 'LINK IP'
        }
      });
      circuitosMap[chamado.circuito.toUpperCase()] = novoLink.id;
    }
    
    // Buscar tipo de falha
    const motivoLower = chamado.motivo.toLowerCase();
    let tipoFalhaId = tiposFalhaMap[motivoLower];
    
    if (!tipoFalhaId) {
      // Tentar encontrar por similaridade
      if (motivoLower.includes('down') || motivoLower.includes('queda') || motivoLower.includes('indisponibilidade')) {
        tipoFalhaId = tiposFalhaMap['queda total'];
      } else if (motivoLower.includes('degradação') || motivoLower.includes('degradacao')) {
        tipoFalhaId = tiposFalhaMap['degradação'];
      } else if (motivoLower.includes('intermit')) {
        tipoFalhaId = tiposFalhaMap['intermitência'];
      } else if (motivoLower.includes('latencia') || motivoLower.includes('latência')) {
        tipoFalhaId = tiposFalhaMap['latência alta'];
      } else {
        tipoFalhaId = tiposFalhaMap['diversos'];
      }
    }
    
    // Criar chamado
    try {
      const novoChamado = await prisma.chamado.create({
        data: {
          numero: `IMP-${chamado.numero}`,
          linkId: circuitosMap[chamado.circuito.toUpperCase()],
          tipoFalhaId: tipoFalhaId,
          dataDeteccao: chamado.dataDeteccao || new Date(),
          dataFechamento: chamado.status === 'fechado' ? (chamado.dataFechamento || new Date()) : null,
          impacto: chamado.impacto,
          status: chamado.status === 'fechado' ? 'fechado' : 'aberto',
          descricaoProblema: chamado.descricao || `${chamado.motivo} - ${chamado.submotivo}`,
          protocoloOperadora: chamado.protocolo && chamado.protocolo !== 'S/P' ? chamado.protocolo : null,
          abertoPorId: usuarioPadrao.id,
          fechadoPorId: chamado.status === 'fechado' ? usuarioPadrao.id : null
        }
      });
      
      // Criar histórico
      await prisma.chamadoHistorico.create({
        data: {
          chamadoId: novoChamado.id,
          usuarioId: usuarioPadrao.id,
          tipoAcao: 'importacao',
          descricao: `Chamado importado da planilha. Original: ${chamado.numero}`,
          statusNovo: chamado.status === 'fechado' ? 'fechado' : 'aberto'
        }
      });
      
      importados++;
      
      if (importados % 50 === 0) {
        console.log(`   📝 ${importados} chamados importados...`);
      }
    } catch (e) {
      erros++;
      if (erros <= 5) {
        console.log(`   ⚠️  Erro no chamado ${chamado.numero}: ${e.message}`);
      }
    }
  }
  
  console.log('\n' + '='.repeat(60));
  console.log('🎉 IMPORTAÇÃO CONCLUÍDA!');
  console.log('='.repeat(60));
  console.log(`   ✅ Importados: ${importados}`);
  console.log(`   ⏭️  Ignorados (já existiam): ${ignorados}`);
  console.log(`   ❌ Erros: ${erros}`);
  console.log('='.repeat(60));
}

main()
  .catch((e) => {
    console.error('❌ Erro na importação:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

