# Script de Deploy com Versionamento
# Uso: .\deploy.ps1 [major|minor|patch]

param(
    [Parameter(Mandatory=$false)]
    [ValidateSet('major', 'minor', 'patch')]
    [string]$bump = 'patch',
    
    [Parameter(Mandatory=$false)]
    [switch]$skipConfirm = $false
)

$ErrorActionPreference = "Stop"

# Ler versao atual
$currentVersion = Get-Content version.txt -Raw
$currentVersion = $currentVersion.Trim()

Write-Host "==================================" -ForegroundColor Cyan
Write-Host "Deploy NOC Chamados" -ForegroundColor Cyan
Write-Host "==================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Versao atual: $currentVersion" -ForegroundColor Yellow

# Parse da versao
$versionParts = $currentVersion.Split('.')
$major = [int]$versionParts[0]
$minor = [int]$versionParts[1]
$patch = [int]$versionParts[2]

# Incrementar versao baseado no tipo
switch ($bump) {
    'major' {
        $major++
        $minor = 0
        $patch = 0
    }
    'minor' {
        $minor++
        $patch = 0
    }
    'patch' {
        $patch++
    }
}

$newVersion = "$major.$minor.$patch"
Write-Host "Nova versao:   $newVersion" -ForegroundColor Green
Write-Host ""

# Confirmacao
if (-not $skipConfirm) {
    $confirmation = Read-Host "Deseja continuar com o deploy da versao $newVersion? (s/n)"
    if ($confirmation -ne 's' -and $confirmation -ne 'S') {
        Write-Host "Deploy cancelado." -ForegroundColor Red
        exit
    }
} else {
    Write-Host "Confirmacao automatica (modo nao-interativo)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Etapa 1/5: Build de producao..." -ForegroundColor Cyan
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no build" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Etapa 2/5: Build da imagem Docker..." -ForegroundColor Cyan
docker build -t leonnecb/noc-chamados:$newVersion -t leonnecb/noc-chamados:latest .
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no build do Docker" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Etapa 3/5: Push da versao $newVersion..." -ForegroundColor Cyan
docker push leonnecb/noc-chamados:$newVersion
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no push da versao" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Etapa 4/5: Push da tag latest..." -ForegroundColor Cyan
docker push leonnecb/noc-chamados:latest
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO no push do latest" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Etapa 5/5: Salvando nova versao..." -ForegroundColor Cyan
Set-Content -Path version.txt -Value $newVersion -NoNewline

Write-Host ""
Write-Host "==================================" -ForegroundColor Green
Write-Host "Deploy concluido com sucesso!" -ForegroundColor Green
Write-Host "==================================" -ForegroundColor Green
Write-Host ""
Write-Host "Resumo:" -ForegroundColor Cyan
Write-Host "  - Versao anterior: $currentVersion" -ForegroundColor Yellow
Write-Host "  - Nova versao:     $newVersion" -ForegroundColor Green
Write-Host "  - Imagem:          leonnecb/noc-chamados:$newVersion" -ForegroundColor White
Write-Host ""
Write-Host "Para atualizar no Portainer:" -ForegroundColor Cyan
Write-Host "  1. Acesse https://portainer.xmov.com.br" -ForegroundColor White
Write-Host "  2. Va em Stacks > noc-chamados" -ForegroundColor White
Write-Host "  3. Clique em Update the stack" -ForegroundColor White
Write-Host "  4. Marque Re-pull image" -ForegroundColor White
Write-Host "  5. Clique em Update" -ForegroundColor White
Write-Host ""
Write-Host "Ou execute via CLI no servidor:" -ForegroundColor Cyan
Write-Host "  docker service update --image leonnecb/noc-chamados:$newVersion noc-chamados_app" -ForegroundColor White
Write-Host ""
