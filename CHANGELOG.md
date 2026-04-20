# Changelog

Todas as mudanças notáveis neste projeto serão documentadas neste arquivo.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/),
e este projeto adere ao [Versionamento Semântico](https://semver.org/lang/pt-BR/).

## [1.2.5] - 2025-12-30

### Melhorado - Interface
- 🎨 **Título e Ícone**: Título da aba simplificado para "NOC Chamados" com ícone personalizado
- 🎨 **Favicon Personalizado**: Ícone gradiente roxo com letras "NOC"

### Melhorado - KPIs
- 📊 **Total de Horas de Incidente**: Substituído MTTC por métrica de total de horas com incidente
- ⏱️ **Cálculo Inteligente**: Períodos sobrepostos são contados apenas uma vez (se dois links estão fora simultaneamente, conta como um período único)
- 📈 **Análise de Períodos**: Melhor visualização do tempo real de impacto no negócio

## [1.2.4] - 2025-12-29

### Melhorado - Relatórios PDF
- 🎨 **Design Premium Dark Theme**: Relatórios com tema escuro minimalista e moderno
- ✨ **Hierarquia Visual Aprimorada**: Melhor organização e espaçamento de elementos
- 🎨 **Paleta de Cores Sofisticada**: Tons de cinza e roxo para design premium
- 📊 **Tipografia Moderna**: Fontes e tamanhos otimizados para legibilidade
- 🔧 **Correção de Páginas em Branco**: Background escuro aplicado em todas as páginas

### Corrigido - Cálculos de KPIs
- 🐛 **Disponibilidade**: Removida multiplicação dupla por 100
- 🐛 **SLA Contratado**: Corrigida interpretação do campo slaHoras (agora fixo em 99.5%)

## [1.2.3] - 2025-12-16

### Corrigido
- 🔧 **Versões Sincronizadas**: Alinhamento de versões em todos os arquivos

## [1.2.2] - 2025-12-16

### 🔒 Correções de Segurança CRÍTICAS
- 🔴 **Uploads Protegidos**: Arquivos agora requerem autenticação para acesso
- 🔴 **SSRF Prevenido**: Validação de URLs em webhooks bloqueia IPs privados
- 🔴 **Upload Seguro**: Validação dupla de extensão + nomes aleatórios
- 🟠 **Enumeração Prevenida**: Mensagens genéricas de erro em login
- 🟠 **Rate Limiting**: Aplicado em todas as APIs críticas
- 🟠 **CSRF Mitigado**: Cookie com sameSite "strict"

### Adicionado
- 🛡️ Função `validarURLWebhook()` para prevenir SSRF
- 🛡️ Função `rateLimit()` reutilizável
- 🛡️ Validação de extensões perigosas em uploads
- 🛡️ Geração de nomes aleatórios para arquivos
- 📋 `SECURITY_CRITICAL_ISSUES.md` - Análise detalhada de vulnerabilidades
- 📋 `SECURITY_FIXES_APPLIED.md` - Documentação das correções

### Melhorado
- ✨ Middleware protege uploads contra acesso não autorizado
- ✨ Webhooks validam URLs e bloqueiam portas perigosas
- ✨ Upload de arquivos com múltiplas camadas de validação
- ✨ Mensagens de erro não revelam informações sensíveis
- ✨ Rate limiting em 5 endpoints críticos

### Conformidade
- ✅ OWASP Top 10 2021
- ✅ LGPD (Lei Geral de Proteção de Dados)
- ✅ CWE Top 25
- ✅ Sistema seguro para dados sensíveis

## [1.2.1] - 2025-12-16

### Corrigido
- 🐛 **Componentes UI**: Adicionados componentes Switch e Table do shadcn/ui
- 🔧 **Dependências**: Instalado @radix-ui/react-switch
- ✅ **Build**: Corrigidos imports do Prisma client

## [1.2.0] - 2025-12-16

### Adicionado - Webhooks
- 🔗 **Sistema de Webhooks Completo**: Integração com sistemas externos via HTTP
- 🎯 **9 Eventos Disponíveis**: Chamados (criado, atualizado, fechado, status alterado), Links, Operadoras
- 🔧 **Configuração Flexível**: URL, método HTTP, timeout, retentativas, headers customizados
- 📊 **Logs Detalhados**: Histórico completo de disparos com status, tempo de resposta e erros
- 🔄 **Retry Automático**: Sistema de retry com backoff exponencial (até 3 tentativas)
- 🎨 **Interface de Gerenciamento**: Página completa em `/webhooks` para configurar e monitorar
- 🔐 **Segurança**: Suporte a autenticação via headers (Bearer token, API keys)
- ⚡ **Performance**: Disparos assíncronos que não bloqueiam operações principais
- 📝 **Payload Rico**: Dados completos do evento em formato JSON estruturado

### Adicionado - Melhorias UX
- 📖 **Link para API na Configuração**: Acesso direto à documentação Swagger
- 🌐 **Domínio Atualizado**: URLs padronizadas para `chamados.xmov.com.br`

### Técnico
- 🗄️ Novas tabelas: `webhook_config`, `webhook_logs`
- 🔧 `lib/webhook.ts` - Biblioteca de webhooks reutilizável
- 🌐 API REST completa para gerenciamento de webhooks
- 📡 Integração automática em endpoints de chamados

## [1.1.1] - 2025-12-16

### Corrigido
- 🐛 **Build TypeScript**: Adicionado tipos para `@types/swagger-ui-react`
- ✨ **Deploy Automatizado**: Correção no processo de build em produção

## [1.1.0] - 2025-12-16

### Adicionado - Segurança
- 🔒 **Rate Limiting**: Proteção contra brute force (5 tentativas/15min)
- 🔒 **Headers de Segurança**: X-Frame-Options, HSTS, CSP e outros
- 🔒 **Validação de JWT_SECRET**: Obrigatório e mínimo 32 caracteres
- 🔒 **Senhas Fortes**: Requisito de 8 caracteres com maiúsculas, minúsculas e números
- 🔒 **Timing Attack Prevention**: Delays artificiais em autenticação
- 🔒 **Mensagens Genéricas**: Erro de login não revela se usuário existe
- 📝 **Documentação de Segurança**: Guias completos e análise de vulnerabilidades
- 🧪 **Script de Verificação**: Teste automatizado de configuração de segurança

### Adicionado - Documentação API
- 🌐 **Swagger UI Integrado**: Documentação interativa acessível em `/api-docs`
- 📖 **OpenAPI 3.0 Completo**: Especificação com 70+ endpoints documentados
- 🧪 **Teste de Endpoints**: Interface para testar API diretamente no navegador
- 📥 **Download do Spec**: Baixar `openapi.yaml` direto da interface
- 🤖 **Geração de Código**: Suporte para gerar clientes em 60+ linguagens
- 📚 **Guias Completos**: SWAGGER_GUIDE, API_HOSTING, API_README
- 📋 **Coleção Postman**: Importação rápida para teste da API

### Melhorado - Segurança
- ✨ Remoção de fallback inseguro do JWT_SECRET
- ✨ Validação mais rigorosa de inputs
- ✨ Logs sanitizados (sem exposição de dados sensíveis)

### Documentação
- 📚 `SECURITY_AUDIT.md` - Análise completa de segurança
- 📚 `SECURITY.md` - Guia de segurança para administradores e desenvolvedores
- 📚 `SECURITY_QUICK_START.md` - Configuração rápida de segurança
- 📚 `openapi.yaml` - **Especificação OpenAPI/Swagger 3.0** (documentação interativa)
- 🌐 **Swagger UI integrado** - Documentação interativa em `/api-docs` no próprio domínio
- 📚 `API_HOSTING.md` - Guia de hospedagem da documentação Swagger no app
- 📚 `SWAGGER_GUIDE.md` - Guia completo para usar Swagger (visualizar, testar, gerar código)
- 📚 `API_README.md` - Guia rápido da API com links para todos os recursos
- 📚 `NOC_Chamados.postman_collection.json` - Coleção Postman com 60+ requisições
- 📚 `env.example` - Exemplo de variáveis de ambiente
- 🔧 `lib/security.ts` - Utilitários de segurança reutilizáveis
- 🧪 `scripts/security-check.js` - Script automatizado de verificação de segurança

## [1.0.0] - 2025-12-15

### Adicionado
- ✨ Sistema completo de gestão de chamados NOC
- 🎯 Dashboard com estatísticas e gráficos em tempo real
- 📊 Card de capacidade de links IP com indicador visual
- 🔐 Sistema de autenticação com perfis (operador/supervisor)
- 📝 Cadastro de Links, Transportes, Operadoras e POPs
- 🎫 Abertura e gestão de chamados (link e transporte)
- ⏱️ Registro de períodos de impacto múltiplos por chamado
- 📈 Relatórios executivos e por link com exportação PDF
- 📊 KPIs: MTTR, MTTI, Disponibilidade, Taxa de Resolução
- 🔍 Busca avançada de chamados com múltiplos termos
- 👥 Gestão de usuários com controle de acesso
- 🗑️ Exclusão de chamados (apenas supervisores)
- ✏️ Edição inline de datas de detecção e normalização
- ✏️ Edição de protocolo da operadora com botão salvar
- 🎨 Auto-seleção de link quando operadora possui apenas um
- 📅 Campo de dia de vencimento para cálculo de período de relatório
- 🔄 Timeline visual para períodos de impacto
- 📤 Exportação de relatórios por link para operadoras
- 🎨 UI moderna e responsiva com tema escuro

### Técnico
- ⚙️ Next.js 14 com App Router
- 🗄️ PostgreSQL com Prisma ORM
- 🐳 Docker e Docker Compose para deploy
- 🔐 Autenticação JWT com bcrypt
- 📊 Geração de PDF com jsPDF
- 🎨 UI com shadcn/ui e Tailwind CSS
- 🔍 Validação com Zod
- 📦 Versionamento semântico com script de deploy automatizado

