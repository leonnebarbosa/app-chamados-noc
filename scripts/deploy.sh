#!/bin/bash
# =================================
# Script de Deploy para Portainer
# =================================

set -e

echo "🚀 Deploy NOC Chamados"
echo "======================"

# Variáveis
COMPOSE_FILE="${COMPOSE_FILE:-docker-compose.yml}"

# Verificar se docker está disponível
if ! command -v docker &> /dev/null; then
    echo "❌ Docker não encontrado!"
    exit 1
fi

# Pull da imagem base (opcional, para cache)
echo "📥 Baixando imagens base..."
docker pull node:20-alpine
docker pull postgres:16-alpine

# Build da aplicação
echo "🔨 Construindo imagem da aplicação..."
docker compose -f $COMPOSE_FILE build --no-cache

# Parar containers existentes
echo "🛑 Parando containers existentes..."
docker compose -f $COMPOSE_FILE down || true

# Iniciar novos containers
echo "▶️ Iniciando containers..."
docker compose -f $COMPOSE_FILE up -d

# Aguardar inicialização
echo "⏳ Aguardando inicialização..."
sleep 10

# Rodar migrations
echo "📦 Aplicando migrations..."
docker compose -f $COMPOSE_FILE exec -T app npx prisma migrate deploy

# Verificar status
echo ""
echo "✅ Deploy concluído!"
echo ""
echo "📊 Status dos containers:"
docker compose -f $COMPOSE_FILE ps

echo ""
echo "📝 Logs (últimas 20 linhas):"
docker compose -f $COMPOSE_FILE logs --tail=20 app

echo ""
echo "🌐 Acesse: https://chamados.seudominio.com.br"

