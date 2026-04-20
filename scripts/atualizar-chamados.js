const xlsx = require('xlsx');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Ler o arquivo Excel
const wb = xlsx.readFile(path.join(__dirname, '..', 'DADOS_ANTIGOS2.xlsx'));

// Ler a aba RELATORIO
const wsRelatorio = wb.Sheets['RELATORIO'];
const dataRelatorio = xlsx.utils.sheet_to_json(wsRelatorio, { header: 1 });

// Função para converter data do Excel para JavaScript
function excelDateToJS(excelDate) {
  if (!excelDate || typeof excelDate !== 'number') return null;
  // Excel usa epoch de 1899-12-30
  const date = new Date((excelDate - 25569) * 86400 * 1000);
  return date.toISOString();
}

// Ler dados existentes
const dadosExistentes = JSON.parse(
  fs.readFileSync(path.join(__dirname, 'dados-para-revisao.json'), 'utf-8')
);

// Extrair chamados com HR_NORMALIDADE
// Headers reais:
// [0] ID, [1] HR_INCIDENTE, [2] DATA, [3] ANO, [4] MES, [5] CIRCUITO, [6] MOTIVO(ou outro), [7] SUBMOTIVO,
// [8] PROTOCOLO, [9] S/P, [10] DESCRIÇÃO, [11] TRECHO, [12] RESPONSÁVEL, [13] ENCERRADO, [14] HR_NORMALIDADE

const chamados = [];
const circuitosSet = new Set();

// Pular header (linha 0)
for (let i = 1; i < dataRelatorio.length; i++) {
  const row = dataRelatorio[i];
  if (!row || !row[1]) continue; // Pular linhas vazias

  // Coluna 5 = CIRCUITO (ex: CLICFACIL_TRANSP_ITB)
  const circuitoNome = row[5] ? String(row[5]).trim() : '';
  
  if (circuitoNome) {
    circuitosSet.add(circuitoNome);
  }
  
  const hrIncidente = excelDateToJS(row[1]);       // HR_INCIDENTE
  const hrNormalidade = excelDateToJS(row[14]);    // HR_NORMALIDADE
  
  if (!hrIncidente) continue;
  
  const chamado = {
    numero: `IMP-${crypto.randomBytes(4).toString('hex')}`,
    circuito: circuitoNome || 'DESCONHECIDO',
    motivo: row[7] ? String(row[7]).trim() : '',        // SUBMOTIVO (motivo da falha)
    submotivo: row[8] ? String(row[8]).trim() : '',     // ROMPIMENTO, etc
    protocolo: row[9] ? String(row[9]).trim() : '',     // S/P ou protocolo
    descricao: row[10] ? String(row[10]).trim() : '',   // DESCRIÇÃO
    dataDeteccao: hrIncidente,
    dataNormalizacao: hrNormalidade,
    dataFechamento: hrNormalidade, // Usar mesmo valor para fechamento
    status: hrNormalidade ? 'fechado' : 'aberto',
    impacto: 'medio'
  };
  
  chamados.push(chamado);
}

console.log(`📊 Extraídos ${chamados.length} chamados do Excel`);
console.log(`📊 Com dataNormalizacao: ${chamados.filter(c => c.dataNormalizacao).length}`);

// Mostrar exemplo
console.log('\nExemplo de chamado:');
console.log(JSON.stringify(chamados[0], null, 2));

// Atualizar dados
dadosExistentes.chamados = chamados;

// Salvar
fs.writeFileSync(
  path.join(__dirname, 'dados-para-revisao.json'),
  JSON.stringify(dadosExistentes, null, 2)
);

console.log('\n✅ Arquivo dados-para-revisao.json atualizado!');

