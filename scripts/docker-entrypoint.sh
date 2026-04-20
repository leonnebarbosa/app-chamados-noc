#!/bin/sh
set -e

echo "🚀 Iniciando NOC Chamados..."

# Aguardar banco de dados estar disponível
echo "⏳ Aguardando banco de dados..."
max_attempts=30
attempt=1
while [ $attempt -le $max_attempts ]; do
  if node -e "const { PrismaClient } = require('@prisma/client'); new PrismaClient().\$connect().then(() => process.exit(0)).catch(() => process.exit(1))" 2>/dev/null; then
    echo "✅ Banco de dados disponível!"
    break
  fi
  echo "   Tentativa $attempt de $max_attempts..."
  sleep 2
  attempt=$((attempt + 1))
done

if [ $attempt -gt $max_attempts ]; then
  echo "❌ Não foi possível conectar ao banco de dados"
  exit 1
fi

# Criar/atualizar schema do banco usando db push via node
echo "📦 Sincronizando schema do banco de dados..."
node ./node_modules/prisma/build/index.js db push --accept-data-loss --skip-generate

# Rodar seed se o banco estiver vazio
echo "🌱 Verificando dados iniciais..."
node prisma/seed.js || echo "ℹ️ Seed concluído ou já executado"

# Iniciar aplicação
echo "✅ Iniciando servidor..."
exec node server.js
