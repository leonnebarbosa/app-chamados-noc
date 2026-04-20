#!/bin/bash
# =================================
# Script de Build e Push para Docker Hub
# =================================

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Parâmetros
DOCKER_USER="${1:-}"
IMAGE_NAME="${2:-noc-chamados}"
TAG="${3:-latest}"

if [ -z "$DOCKER_USER" ]; then
    echo -e "${RED}Uso: ./build-and-push.sh <docker-user> [image-name] [tag]${NC}"
    echo -e "${YELLOW}Exemplo: ./build-and-push.sh meuusuario noc-chamados latest${NC}"
    exit 1
fi

FULL_IMAGE_NAME="$DOCKER_USER/$IMAGE_NAME:$TAG"
VERSION_TAG="$DOCKER_USER/$IMAGE_NAME:v1.0.0"

echo ""
echo -e "${CYAN}========================================"
echo -e "  Build & Push - NOC Chamados"
echo -e "========================================${NC}"
echo ""
echo -e "${YELLOW}Imagem: $FULL_IMAGE_NAME${NC}"
echo ""

# Verificar login
echo -e "${BLUE}[1/4] Verificando login no Docker Hub...${NC}"
if ! docker info 2>/dev/null | grep -q "Username"; then
    echo -e "${RED}Você precisa fazer login no Docker Hub primeiro!${NC}"
    echo -e "${YELLOW}Execute: docker login${NC}"
    exit 1
fi
echo -e "${GREEN}OK - Logado no Docker Hub${NC}"

# Build
echo ""
echo -e "${BLUE}[2/4] Construindo imagem Docker...${NC}"
docker build -t "$FULL_IMAGE_NAME" .
echo -e "${GREEN}OK - Build concluído${NC}"

# Tag
echo ""
echo -e "${BLUE}[3/4] Criando tag de versão: $VERSION_TAG${NC}"
docker tag "$FULL_IMAGE_NAME" "$VERSION_TAG"
echo -e "${GREEN}OK - Tag criada${NC}"

# Push
echo ""
echo -e "${BLUE}[4/4] Enviando para Docker Hub...${NC}"
docker push "$FULL_IMAGE_NAME"
docker push "$VERSION_TAG"

echo ""
echo -e "${GREEN}========================================"
echo -e "  BUILD E PUSH CONCLUÍDOS!"
echo -e "========================================${NC}"
echo ""
echo -e "${CYAN}Imagem disponível em:${NC}"
echo -e "  - $FULL_IMAGE_NAME"
echo -e "  - $VERSION_TAG"
echo ""
echo -e "${YELLOW}Próximo passo:${NC}"
echo -e "  1. Acesse o Portainer"
echo -e "  2. Vá em Stacks > Add stack"
echo -e "  3. Cole o conteúdo do docker-compose.prod.yml"
echo -e "  4. Configure as variáveis de ambiente"
echo ""

