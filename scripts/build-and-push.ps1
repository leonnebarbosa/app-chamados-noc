# =================================
# Script de Build e Push para Docker Hub
# =================================

param(
    [Parameter(Mandatory=$true)]
    [string]$DockerUser,
    
    [string]$ImageName = "noc-chamados",
    
    [string]$Tag = "latest"
)

$ErrorActionPreference = "Stop"

$FullImageName = "$DockerUser/${ImageName}:$Tag"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Build & Push - NOC Chamados" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Imagem: $FullImageName" -ForegroundColor Yellow
Write-Host ""

# Verificar se está logado no Docker Hub
Write-Host "[1/4] Verificando login no Docker Hub..." -ForegroundColor Blue
$loginCheck = docker info 2>&1 | Select-String "Username"
if (-not $loginCheck) {
    Write-Host "Você precisa fazer login no Docker Hub primeiro!" -ForegroundColor Red
    Write-Host "Execute: docker login" -ForegroundColor Yellow
    exit 1
}
Write-Host "OK - Logado no Docker Hub" -ForegroundColor Green

# Build da imagem
Write-Host ""
Write-Host "[2/4] Construindo imagem Docker..." -ForegroundColor Blue
docker build -t $FullImageName .

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no build!" -ForegroundColor Red
    exit 1
}
Write-Host "OK - Build concluído" -ForegroundColor Green

# Tag adicional com versão
$VersionTag = "$DockerUser/${ImageName}:v1.0.0"
Write-Host ""
Write-Host "[3/4] Criando tag de versão: $VersionTag" -ForegroundColor Blue
docker tag $FullImageName $VersionTag
Write-Host "OK - Tag criada" -ForegroundColor Green

# Push para Docker Hub
Write-Host ""
Write-Host "[4/4] Enviando para Docker Hub..." -ForegroundColor Blue
docker push $FullImageName
docker push $VersionTag

if ($LASTEXITCODE -ne 0) {
    Write-Host "Erro no push!" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  BUILD E PUSH CONCLUÍDOS!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Imagem disponível em:" -ForegroundColor Cyan
Write-Host "  - $FullImageName" -ForegroundColor White
Write-Host "  - $VersionTag" -ForegroundColor White
Write-Host ""
Write-Host "Próximo passo:" -ForegroundColor Yellow
Write-Host "  1. Acesse o Portainer" -ForegroundColor White
Write-Host "  2. Vá em Stacks > Add stack" -ForegroundColor White
Write-Host "  3. Cole o conteúdo do docker-compose.prod.yml" -ForegroundColor White
Write-Host "  4. Configure as variáveis de ambiente:" -ForegroundColor White
Write-Host "     - DOCKER_IMAGE = $FullImageName" -ForegroundColor Gray
Write-Host "     - JWT_SECRET = (gere uma chave forte)" -ForegroundColor Gray
Write-Host "     - DB_PASSWORD = (senha do banco)" -ForegroundColor Gray
Write-Host ""

