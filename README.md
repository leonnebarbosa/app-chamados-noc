# NOC Chamados - Sistema de Gestão de Incidentes

Sistema web para gestão de chamados de incidentes em links de telecom, desenvolvido para equipes NOC.

## 🚀 Funcionalidades

- **Gestão de Chamados**
  - Abertura rápida de chamados
  - Timeline de atualizações
  - Controle de status
  - Registro de protocolo da operadora
  - Fechamento com causa raiz e solução

- **Dashboard Operacional**
  - Visão geral dos chamados ativos
  - Indicadores por impacto (Crítico, Alto, Médio, Baixo)
  - Chamados ordenados por prioridade

- **Cadastros**
  - Links/Circuitos
  - Operadoras
  - POPs (Pontos de Presença)
  - Tipos de Falha

- **Controle de Acesso**
  - Perfil Operador
  - Perfil Supervisor (acesso a relatórios e gestão de usuários)

## 🛠️ Tecnologias

- **Frontend**: Next.js 14 (App Router)
- **UI**: Tailwind CSS + shadcn/ui
- **Backend**: Next.js API Routes
- **Banco de Dados**: SQLite (dev) / PostgreSQL (produção)
- **ORM**: Prisma
- **Autenticação**: JWT

## 📦 Instalação

### Pré-requisitos
- Node.js 18+
- npm ou yarn

### Passos

1. **Clone o repositório**
```bash
git clone <url-do-repo>
cd app_chamados_noc
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure o ambiente**

Crie um arquivo `.env` na raiz:
```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="sua-chave-secreta-aqui"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

4. **Configure o banco de dados**
```bash
# Gera o cliente Prisma
npm run db:generate

# Cria as tabelas
npm run db:push

# Popula com dados de exemplo
npm run db:seed
```

5. **Inicie o servidor de desenvolvimento**
```bash
npm run dev
```

6. **Acesse o sistema**
- URL: http://localhost:3000
- Login: `supervisor@noc.com` / `123456`

## 👥 Usuários de Teste

| Email | Senha | Perfil |
|-------|-------|--------|
| supervisor@noc.com | 123456 | Supervisor |
| joao@noc.com | 123456 | Operador |
| maria@noc.com | 123456 | Operador |
| pedro@noc.com | 123456 | Operador |
| ana@noc.com | 123456 | Operador |

## 📁 Estrutura do Projeto

```
├── app/
│   ├── (dashboard)/        # Páginas protegidas
│   │   ├── dashboard/
│   │   ├── chamados/
│   │   ├── links/
│   │   ├── operadoras/
│   │   └── pops/
│   ├── api/                # API Routes
│   ├── login/              # Página de login
│   └── layout.tsx
├── components/
│   ├── layout/             # Sidebar, Header, etc.
│   └── ui/                 # Componentes UI (shadcn)
├── lib/
│   ├── auth.ts             # Autenticação JWT
│   ├── db.ts               # Cliente Prisma
│   ├── utils.ts            # Utilitários
│   └── validations.ts      # Schemas Zod
├── prisma/
│   ├── schema.prisma       # Schema do banco
│   └── seed.ts             # Dados iniciais
└── middleware.ts           # Proteção de rotas
```

## 🔧 Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento
npm run build        # Build de produção
npm run start        # Inicia em produção
npm run db:generate  # Gera cliente Prisma
npm run db:push      # Sincroniza schema com banco
npm run db:studio    # Abre Prisma Studio (GUI)
npm run db:seed      # Popula banco com dados de exemplo
```

## 🚀 Deploy em Produção

1. Configure PostgreSQL e atualize `DATABASE_URL`
2. Gere uma chave JWT segura para `JWT_SECRET`
3. Execute:
```bash
npm run build
npm run start
```

## 📊 Métricas Coletadas

O sistema coleta automaticamente:
- Tempo entre detecção e abertura do chamado
- Tempo de resposta da operadora
- Tempo total de resolução (MTTR)
- Causa raiz dos incidentes
- Horário e frequência dos incidentes

## 🌐 API REST

O sistema possui uma API REST completa com documentação interativa Swagger.

**Acesse a documentação:**
- **Produção:** https://chamados.xmov.com.br/api-docs
- **Local:** http://localhost:3000/api-docs

**Recursos:**
- 70+ endpoints documentados
- Teste direto no navegador
- Especificação OpenAPI 3.0
- Coleção Postman disponível
- Geração automática de clientes

📖 **Documentação completa:** [`API.md`](./API.md)

## 📚 Documentação

- [`CHANGELOG.md`](./CHANGELOG.md) - Histórico de versões
- [`API.md`](./API.md) - Documentação da API REST
- [`SECURITY.md`](./SECURITY.md) - Guia de segurança

## 📝 Licença

Projeto privado - Todos os direitos reservados.

