#!/usr/bin/env node

/**
 * Script de Verificação de Segurança Básica
 * Execute antes de fazer deploy: node scripts/security-check.js
 */

const fs = require('fs');
const path = require('path');

let hasErrors = false;
let hasWarnings = false;

console.log('🔒 Verificação de Segurança - NOC Chamados\n');

// 1. Verificar se .env existe
console.log('📋 Verificando configuração...');
const envPath = path.join(process.cwd(), '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ ERRO: Arquivo .env não encontrado');
  console.error('   Copie env.example.txt para .env e configure as variáveis\n');
  hasErrors = true;
} else {
  console.log('✅ Arquivo .env encontrado\n');
  
  // Ler .env e verificar variáveis críticas
  const envContent = fs.readFileSync(envPath, 'utf8');
  
  // Verificar JWT_SECRET
  const jwtSecretMatch = envContent.match(/JWT_SECRET=["']?([^"'\n]+)["']?/);
  if (!jwtSecretMatch) {
    console.error('❌ ERRO: JWT_SECRET não definido no .env');
    hasErrors = true;
  } else {
    const jwtSecret = jwtSecretMatch[1];
    
    // Verificações de segurança do JWT_SECRET
    if (jwtSecret.length < 32) {
      console.error('❌ ERRO: JWT_SECRET muito curto (mínimo 32 caracteres)');
      console.error('   Atual: ' + jwtSecret.length + ' caracteres');
      console.error('   Gere um novo: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n');
      hasErrors = true;
    } else if (jwtSecret.includes('SUBSTITUA') || jwtSecret.includes('exemplo') || jwtSecret.includes('secret')) {
      console.error('❌ ERRO: JWT_SECRET parece ser um valor de exemplo');
      console.error('   Gere um forte: node -e "console.log(require(\'crypto\').randomBytes(64).toString(\'hex\'))"\n');
      hasErrors = true;
    } else {
      console.log('✅ JWT_SECRET configurado (' + jwtSecret.length + ' caracteres)\n');
    }
  }
  
  // Verificar DATABASE_URL
  if (!envContent.includes('DATABASE_URL=')) {
    console.error('❌ ERRO: DATABASE_URL não definido no .env\n');
    hasErrors = true;
  } else {
    console.log('✅ DATABASE_URL configurado\n');
    
    // Avisar sobre senhas fracas
    if (envContent.includes('senha@123') || envContent.includes('password') || envContent.includes('admin')) {
      console.warn('⚠️  AVISO: DATABASE_URL parece conter senha fraca');
      console.warn('   Use senha forte com letras, números e símbolos\n');
      hasWarnings = true;
    }
  }
  
  // Verificar NODE_ENV
  if (!envContent.includes('NODE_ENV=')) {
    console.warn('⚠️  AVISO: NODE_ENV não definido (padrão será development)');
    console.warn('   Para produção, defina: NODE_ENV=production\n');
    hasWarnings = true;
  }
}

// 2. Verificar node_modules e dependências
console.log('📦 Verificando dependências...');
const packageJsonPath = path.join(process.cwd(), 'package.json');
if (fs.existsSync(packageJsonPath)) {
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
  console.log('ℹ️  Execute "npm audit" para verificar vulnerabilidades conhecidas\n');
}

// 3. Verificar se arquivos sensíveis estão no .gitignore
console.log('🔐 Verificando .gitignore...');
const gitignorePath = path.join(process.cwd(), '.gitignore');
if (fs.existsSync(gitignorePath)) {
  const gitignore = fs.readFileSync(gitignorePath, 'utf8');
  const requiredEntries = ['.env', 'node_modules'];
  
  let allPresent = true;
  requiredEntries.forEach(entry => {
    if (!gitignore.includes(entry)) {
      console.error(`❌ ERRO: "${entry}" não está no .gitignore`);
      allPresent = false;
      hasErrors = true;
    }
  });
  
  if (allPresent) {
    console.log('✅ Arquivos sensíveis protegidos no .gitignore\n');
  } else {
    console.log('');
  }
} else {
  console.error('❌ ERRO: .gitignore não encontrado\n');
  hasErrors = true;
}

// 4. Verificar se há .env commitado (má prática)
const gitPath = path.join(process.cwd(), '.git');
if (fs.existsSync(gitPath)) {
  const { execSync } = require('child_process');
  try {
    const trackedFiles = execSync('git ls-files', { encoding: 'utf8' });
    if (trackedFiles.includes('.env')) {
      console.error('❌ ERRO CRÍTICO: Arquivo .env está commitado no Git!');
      console.error('   Remova imediatamente com:');
      console.error('   git rm --cached .env');
      console.error('   git commit -m "Remove .env from version control"');
      console.error('   git push\n');
      hasErrors = true;
    } else {
      console.log('✅ .env não está no controle de versão\n');
    }
  } catch (error) {
    // Git não disponível ou não é um repositório
  }
}

// 5. Verificar configuração de produção
console.log('🚀 Verificando configuração de produção...');
const nextConfigPath = path.join(process.cwd(), 'next.config.js');
if (fs.existsSync(nextConfigPath)) {
  const nextConfig = fs.readFileSync(nextConfigPath, 'utf8');
  if (nextConfig.includes('async headers()')) {
    console.log('✅ Headers de segurança configurados\n');
  } else {
    console.warn('⚠️  AVISO: Headers de segurança podem não estar configurados\n');
    hasWarnings = true;
  }
}

// Resumo final
console.log('═══════════════════════════════════════');
if (hasErrors) {
  console.error('\n❌ FALHOU: Corrija os erros antes de fazer deploy\n');
  process.exit(1);
} else if (hasWarnings) {
  console.warn('\n⚠️  AVISOS ENCONTRADOS: Revise antes de fazer deploy\n');
  process.exit(0);
} else {
  console.log('\n✅ PASSOU: Verificações básicas de segurança OK\n');
  console.log('📋 Checklist adicional manual:');
  console.log('   [ ] npm audit executado e limpo');
  console.log('   [ ] Backup do banco antes do deploy');
  console.log('   [ ] HTTPS configurado em produção');
  console.log('   [ ] Certificado SSL válido');
  console.log('');
  process.exit(0);
}

