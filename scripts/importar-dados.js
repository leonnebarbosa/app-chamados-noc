const XLSX = require('xlsx');
const path = require('path');
const fs = require('fs');

// Ler o arquivo
const filePath = path.join(__dirname, '..', 'DADOS_ANTIGOS2.xlsx');
const workbook = XLSX.readFile(filePath);

console.log('📊 Analisando arquivo: DADOS_ANTIGOS2.xlsx\n');

// Função para converter data Excel para ISO string
function excelDateToISO(excelDate) {
  if (!excelDate || typeof excelDate !== 'number') return null;
  const jsDate = new Date((excelDate - 25569) * 86400 * 1000);
  if (isNaN(jsDate.getTime())) return null;
  return jsDate.toISOString();
}

// =============================================
// 1. Ler aba RELATORIO usando array de arrays
// =============================================
console.log('📑 Lendo aba RELATORIO...');
const relatorioSheet = workbook.Sheets['RELATORIO'];
const relatorioData = XLSX.utils.sheet_to_json(relatorioSheet, { header: 1 });

// Mapeamento de colunas baseado na análise:
// 0: ID
// 1: HR_INCIDENTE
// 2: DATA
// 3: ANO
// 4: MES
// 5: CIRCUITO_NOME (nome real do circuito)
// 6: CIRCUITO_ID
// 7: MOTIVO
// 8: SUBMOTIVO
// 9: PROTOCOLO
// 10: DESCRIÇÃO
// 11: TRECHO
// 12: RESPONSÁVEL
// 13: ENCERRADO
// 14: HR_NORMALIDADE
// 15: TEMPO_OFF

const COL = {
  ID: 0,
  HR_INCIDENTE: 1,
  ANO: 3,
  MES: 4,
  CIRCUITO_NOME: 5,
  CIRCUITO_ID: 6,
  MOTIVO: 7,
  SUBMOTIVO: 8,
  PROTOCOLO: 9,
  DESCRICAO: 10,
  TRECHO: 11,
  RESPONSAVEL: 12,
  ENCERRADO: 13,
  HR_NORMALIDADE: 14
};

console.log(`   Total de linhas: ${relatorioData.length}`);
console.log(`   Cabeçalho: ${relatorioData[0].slice(0, 8).join(' | ')}`);
console.log(`   Primeira linha dados: ${relatorioData[1] ? relatorioData[1].slice(0, 8).join(' | ') : 'vazio'}`);

// Mapeamento EXATO de circuitos para operadoras (fornecido pelo usuário)
const circuitoOperadoraMap = {
  'CLICFACIL_TRANSP_ITB': 'ClicFácil',
  'ESTRATÉGIA_LINK': 'Estratégia',
  'TELEBRAS_LINK_ATM': 'Estratégia',
  'EMBRATEL_LINK': 'Embratel',
  'WIRE_LINK_ATM': 'Wirelink',
  'TRANSP._CLICKFACIL': 'ClicFácil',
  'SEA_LINK': 'SEA Telecom',
  'LINK BRASIL': 'Link Brasil',
  'IX-BSB-V4-V6': 'IX',
  'MOV_TRANSP': 'MOV',
  'SEA_LINK_STM': 'SEA Telecom',
  'SEA_LINK_ATM': 'SEA Telecom',
  'TRANS_ITB<>RP (WSP)': 'WSP',
  'ELTN_TRANSP_STM': 'Eletronorte',
  'ELTN_TRANSP_ITB': 'Eletronorte',
  'ELTN_TRANSP_BSB': 'Eletronorte',
  'RPXITB': 'ClicFácil',
  'LINK-AMAZONET': 'Amazonet',
  'AMAZONET_CDN_FNA': 'Amazonet',
};

// Operadoras com dados de contato
const operadorasInfo = {
  'ClicFácil': { nome: 'ClicFácil', telefone: '', sla: 4 },
  'Estratégia': { nome: 'Estratégia', telefone: '', sla: 4 },
  'Embratel': { nome: 'Embratel', telefone: '0800-890-8090', sla: 4 },
  'Wirelink': { nome: 'Wirelink', telefone: '', sla: 4 },
  'SEA Telecom': { nome: 'SEA Telecom', telefone: '', sla: 4 },
  'Link Brasil': { nome: 'Link Brasil', telefone: '', sla: 4 },
  'IX': { nome: 'IX', telefone: '', sla: 4 },
  'MOV': { nome: 'MOV', telefone: '', sla: 4 },
  'WSP': { nome: 'WSP', telefone: '', sla: 4 },
  'Eletronorte': { nome: 'Eletronorte', telefone: '', sla: 6 },
  'Amazonet': { nome: 'Amazonet', telefone: '', sla: 4 },
  'Desconhecida': { nome: 'Desconhecida', telefone: '', sla: 4 },
};

const operadorasIdentificadas = new Map();

function identificarOperadora(circuito) {
  if (!circuito) return 'Desconhecida';
  const circuitoStr = String(circuito).trim();
  
  // Buscar mapeamento exato primeiro
  if (circuitoOperadoraMap[circuitoStr]) {
    const opNome = circuitoOperadoraMap[circuitoStr];
    operadorasIdentificadas.set(opNome, operadorasInfo[opNome] || { nome: opNome, telefone: '', sla: 4 });
    return opNome;
  }
  
  // Buscar mapeamento case-insensitive
  const circUpper = circuitoStr.toUpperCase();
  for (const [circ, opNome] of Object.entries(circuitoOperadoraMap)) {
    if (circ.toUpperCase() === circUpper) {
      operadorasIdentificadas.set(opNome, operadorasInfo[opNome] || { nome: opNome, telefone: '', sla: 4 });
      return opNome;
    }
  }
  
  return 'Desconhecida';
}

// Processar chamados (pular cabeçalho)
const chamados = [];
const circuitosUnicos = new Set();
const trechosUnicos = new Set();

for (let i = 1; i < relatorioData.length; i++) {
  const row = relatorioData[i];
  if (!row || row.length < 10) continue;
  
  const id = row[COL.ID];
  const circuito = row[COL.CIRCUITO_NOME]; // Nome real do circuito
  
  if (!id || !circuito) continue;
  
  const circuitoStr = String(circuito).trim();
  circuitosUnicos.add(circuitoStr);
  
  const trecho = row[COL.TRECHO] ? String(row[COL.TRECHO]).trim() : '';
  if (trecho) trechosUnicos.add(trecho);
  
  const motivo = row[COL.MOTIVO] ? String(row[COL.MOTIVO]).trim().toLowerCase() : 'não informado';
  
  // Determinar impacto
  let impacto = 'medio';
  if (motivo.includes('indisponibilidade') || motivo.includes('queda')) {
    impacto = 'critico';
  } else if (motivo.includes('degradação') || motivo.includes('degradacao')) {
    impacto = 'alto';
  } else if (motivo.includes('intermitencia') || motivo.includes('intermitência')) {
    impacto = 'alto';
  }
  
  // Converter datas
  const dataDeteccao = excelDateToISO(row[COL.HR_INCIDENTE]);
  const dataFechamento = excelDateToISO(row[COL.HR_NORMALIDADE]);
  
  chamados.push({
    numero: String(id).trim(),
    circuito: circuitoStr,
    dataDeteccao: dataDeteccao,
    dataFechamento: dataFechamento,
    motivo: motivo,
    submotivo: row[COL.SUBMOTIVO] ? String(row[COL.SUBMOTIVO]).trim() : '',
    protocolo: row[COL.PROTOCOLO] ? String(row[COL.PROTOCOLO]).trim() : '',
    descricao: row[COL.DESCRICAO] || '',
    trecho: trecho,
    responsavel: row[COL.RESPONSAVEL] || '',
    status: row[COL.ENCERRADO] === 'ENCERRADO' ? 'fechado' : 'aberto',
    impacto: impacto,
    operadora: identificarOperadora(circuitoStr)
  });
}

console.log(`\n✅ Chamados processados: ${chamados.length}`);
console.log(`✅ Circuitos únicos: ${circuitosUnicos.size}`);
console.log(`✅ Trechos únicos: ${trechosUnicos.size}`);

// Mostrar circuitos encontrados
console.log('\n📋 Circuitos encontrados:');
Array.from(circuitosUnicos).slice(0, 10).forEach(c => {
  console.log(`   - ${c} (${identificarOperadora(c)})`);
});
if (circuitosUnicos.size > 10) console.log(`   ... e mais ${circuitosUnicos.size - 10}`);

console.log(`\n✅ Operadoras identificadas: ${operadorasIdentificadas.size}`);
operadorasIdentificadas.forEach(op => console.log(`   - ${op.nome}`));

// =============================================
// 2. Ler POPs
// =============================================
console.log('\n📑 Lendo aba POP...');
const popSheet = workbook.Sheets['POP'];
const popData = XLSX.utils.sheet_to_json(popSheet);

const pops = popData.map(row => ({
  codigo: row['POP'] ? String(row['POP']).trim() : '',
  cidade: row['CIDADE'] ? String(row['CIDADE']).trim() : 'N/A',
  nome: row['POP'] ? String(row['POP']).trim() : ''
})).filter(p => p.codigo);

// Adicionar trechos como POPs
trechosUnicos.forEach(trecho => {
  if (!pops.find(p => p.codigo.toUpperCase() === trecho.toUpperCase())) {
    pops.push({ codigo: trecho, cidade: trecho, nome: `POP ${trecho}` });
  }
});

console.log(`✅ POPs: ${pops.length}`);

// =============================================
// 3. Montar circuitos
// =============================================
const circuitos = Array.from(circuitosUnicos).map(circ => ({
  designador: circ,
  tipo: circ.toUpperCase().includes('TRANSP') ? 'TRANSPORTE' : 'LINK IP',
  operadora: identificarOperadora(circ)
}));

// =============================================
// 4. Tipos de falha
// =============================================
const tiposFalha = [
  { nome: 'Queda Total', descricao: 'Link completamente fora' },
  { nome: 'Degradação', descricao: 'Perda de performance' },
  { nome: 'Intermitência', descricao: 'Quedas frequentes' },
  { nome: 'Latência Alta', descricao: 'Tempo de resposta elevado' },
  { nome: 'Indisponibilidade', descricao: 'Serviço indisponível' },
  { nome: 'Diversos', descricao: 'Outros tipos de falha' },
];

// =============================================
// 5. Salvar JSON
// =============================================
const dadosImportacao = {
  operadoras: Array.from(operadorasIdentificadas.values()),
  pops: pops,
  circuitos: circuitos,
  chamados: chamados,
  tiposFalha: tiposFalha
};

// Verificar datas
console.log('\n📅 Verificação de datas (primeiros 5 chamados):');
chamados.slice(0, 5).forEach((c, i) => {
  console.log(`   ${i+1}. ${c.numero}: ${c.dataDeteccao} -> ${c.dataFechamento}`);
});

fs.writeFileSync(
  path.join(__dirname, 'dados-para-importar.json'),
  JSON.stringify(dadosImportacao, null, 2)
);

console.log('\n' + '='.repeat(60));
console.log('📦 RESUMO DA IMPORTAÇÃO');
console.log('='.repeat(60));
console.log(`   Operadoras: ${dadosImportacao.operadoras.length}`);
console.log(`   POPs: ${dadosImportacao.pops.length}`);
console.log(`   Circuitos/Links: ${dadosImportacao.circuitos.length}`);
console.log(`   Chamados: ${dadosImportacao.chamados.length}`);
console.log(`   Tipos de Falha: ${dadosImportacao.tiposFalha.length}`);
console.log('='.repeat(60));
console.log('\n✅ Dados salvos em: scripts/dados-para-importar.json');
