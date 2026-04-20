const XLSX = require('xlsx');
const path = require('path');

// Ler o arquivo
const filePath = path.join(__dirname, '..', 'dados antigos.xlsx');
const workbook = XLSX.readFile(filePath);

// Listar todas as abas/sheets
console.log('📊 ABAS ENCONTRADAS:');
console.log(workbook.SheetNames);
console.log('');

// Para cada aba, mostrar as primeiras linhas
workbook.SheetNames.forEach(sheetName => {
  console.log(`\n${'='.repeat(60)}`);
  console.log(`📑 ABA: ${sheetName}`);
  console.log('='.repeat(60));
  
  const sheet = workbook.Sheets[sheetName];
  const data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  
  // Mostrar cabeçalho (primeira linha)
  if (data.length > 0) {
    console.log('\n🏷️  COLUNAS (cabeçalho):');
    console.log(data[0]);
    
    // Mostrar quantidade de linhas
    console.log(`\n📈 Total de linhas: ${data.length - 1} (excluindo cabeçalho)`);
    
    // Mostrar primeiras 5 linhas de dados
    console.log('\n📝 PRIMEIRAS 5 LINHAS:');
    for (let i = 1; i <= Math.min(5, data.length - 1); i++) {
      console.log(`Linha ${i}:`, data[i]);
    }
  }
});

console.log('\n\n✅ Análise concluída!');

