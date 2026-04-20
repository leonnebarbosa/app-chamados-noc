# 🚀 API NOC Chamados

Sistema de gestão de chamados para NOC (Network Operations Center) com API REST completa.

**Versão:** 1.2.5  
**Base URL:** `https://chamados.xmov.com.br/api`  
**📖 Documentação Interativa:** [https://chamados.xmov.com.br/api-docs](https://chamados.xmov.com.br/api-docs)

---

## ⚡ Acesso Rápido

### Documentação Swagger (Recomendado)
Acesse diretamente no navegador:
- **Produção:** https://chamados.xmov.com.br/api-docs
- **Local:** http://localhost:3000/api-docs

**Recursos disponíveis:**
- ✅ Visualizar todos os endpoints
- ✅ Ver exemplos de request/response
- ✅ Testar endpoints diretamente no navegador
- ✅ Explorar schemas de dados
- ✅ Baixar especificação OpenAPI

### Outros Recursos
- [`openapi.yaml`](./openapi.yaml) - Especificação OpenAPI 3.0
- [`NOC_Chamados.postman_collection.json`](./NOC_Chamados.postman_collection.json) - Coleção Postman
- [`SECURITY.md`](./SECURITY.md) - Guia de segurança

---

## 🎯 Principais Endpoints

### Autenticação
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/me` - Usuário atual

### Chamados
- `GET /api/chamados` - Listar chamados
- `POST /api/chamados` - Criar chamado
- `GET /api/chamados/:id` - Obter chamado
- `PUT /api/chamados/:id` - Atualizar chamado
- `POST /api/chamados/:id/fechar` - Fechar chamado
- `DELETE /api/chamados/:id` - Deletar chamado (supervisor)

### Links
- `GET /api/links` - Listar links
- `POST /api/links` - Criar link
- `GET /api/links/:id` - Obter link
- `PUT /api/links/:id` - Atualizar link
- `DELETE /api/links/:id` - Deletar link

### Transportes
- `GET /api/transportes` - Listar transportes
- `POST /api/transportes` - Criar transporte
- `GET /api/transportes/:id/links` - Links do transporte

### Operadoras
- `GET /api/operadoras` - Listar operadoras
- `POST /api/operadoras` - Criar operadora

### POPs
- `GET /api/pops` - Listar POPs
- `POST /api/pops` - Criar POP

### Usuários (Supervisor)
- `GET /api/usuarios` - Listar usuários
- `POST /api/usuarios` - Criar usuário
- `PUT /api/usuarios/:id` - Atualizar usuário
- `DELETE /api/usuarios/:id` - Deletar usuário

### Relatórios
- `GET /api/relatorios?tipo=resumo` - Resumo geral
- `GET /api/relatorios?tipo=kpis` - KPIs completos
- `GET /api/relatorios?tipo=operadoras` - Performance por operadora
- `GET /api/relatorios?tipo=linksProblematicos` - Links com mais problemas
- `GET /api/relatorios?tipo=relatorioLink&linkId=1` - Relatório de link específico

### Webhooks (Supervisor)
- `GET /api/webhooks` - Listar webhooks
- `POST /api/webhooks` - Criar webhook
- `PUT /api/webhooks/:id` - Atualizar webhook
- `DELETE /api/webhooks/:id` - Deletar webhook
- `GET /api/webhooks/logs` - Logs de disparos

---

## 💡 Exemplos Rápidos

### 1. Fazer Login

```bash
curl -X POST https://chamados.xmov.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@xmov.com.br","senha":"senha"}' \
  -c cookies.txt
```

### 2. Criar um Chamado

```bash
curl -X POST https://chamados.xmov.com.br/api/chamados \
  -H "Content-Type: application/json" \
  -b cookies.txt \
  -d '{
    "tipoChamado": "link",
    "linkId": 1,
    "tipoFalhaId": 1,
    "dataDeteccao": "2025-12-29T10:00:00.000Z",
    "impacto": "critico",
    "descricaoProblema": "Link fora do ar"
  }'
```

### 3. Listar Chamados Abertos

```bash
curl "https://chamados.xmov.com.br/api/chamados?status=aberto" \
  -b cookies.txt
```

### 4. Obter KPIs

```bash
curl "https://chamados.xmov.com.br/api/relatorios?tipo=kpis" \
  -b cookies.txt
```

---

## 🔧 Ferramentas

### Importar no Postman
1. **File** → **Import**
2. Selecione `NOC_Chamados.postman_collection.json`
3. Configure variável `baseUrl = https://chamados.xmov.com.br/api`
4. Execute a requisição de Login
5. Teste outros endpoints

### Gerar Cliente Automaticamente
```bash
# Instalar OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Gerar cliente TypeScript
openapi-generator-cli generate -i openapi.yaml -g typescript-axios -o ./client

# Gerar cliente Python
openapi-generator-cli generate -i openapi.yaml -g python -o ./client-py

# Ver todos os geradores disponíveis (60+)
openapi-generator-cli list
```

---

## 🔒 Segurança

### Autenticação
A API usa **JWT via HTTPOnly Cookie**. Sempre inclua `credentials: 'include'` nas requisições:

```javascript
fetch('/api/chamados', {
  credentials: 'include'  // Importante!
});
```

### Rate Limiting
- **Login:** 5 tentativas por 15 minutos
- Quando exceder: HTTP 429 com `Retry-After` header

### Headers de Segurança
Todas as respostas incluem headers de segurança:
- `X-Frame-Options: SAMEORIGIN`
- `X-Content-Type-Options: nosniff`
- `Strict-Transport-Security: max-age=31536000`
- `Referrer-Policy: strict-origin-when-cross-origin`

**👉 Mais detalhes em [`SECURITY.md`](./SECURITY.md)**

---

## 📊 Query Parameters

```
?status=aberto              # Filtrar por status
?impacto=critico           # Filtrar por impacto
?operadoraId=1             # Filtrar por operadora
?popId=1                   # Filtrar por POP
?busca=termo1+termo2       # Busca multi-termo (AND)
?ativo=true                # Apenas ativos/inativos
?dataInicio=2025-01-01     # Data inicial (relatórios)
?dataFim=2025-12-31        # Data final (relatórios)
```

---

## 📈 Status Codes

| Código | Significado |
|--------|-------------|
| 200 | ✅ OK |
| 201 | ✅ Criado |
| 400 | ❌ Dados inválidos |
| 401 | ❌ Não autenticado |
| 403 | ❌ Sem permissão |
| 404 | ❌ Não encontrado |
| 429 | ⚠️ Rate limit excedido |
| 500 | ❌ Erro no servidor |

---

## 🐛 Troubleshooting

### Erro 401 (Não autenticado)
**Solução:** Inclua `credentials: 'include'` ou cookies nas requisições.

### Erro 429 (Rate Limited)
**Solução:** Aguarde o tempo indicado no header `Retry-After`.

### Erro 403 (Sem permissão)
**Solução:** Algumas rotas exigem perfil `supervisor`.

---

## 📞 Suporte

1. 📖 Acesse a [documentação interativa](https://chamados.xmov.com.br/api-docs)
2. 🔒 Revise [`SECURITY.md`](./SECURITY.md)
3. 📝 Consulte o [`CHANGELOG.md`](./CHANGELOG.md)

---

**Última Atualização:** 30/12/2025  
**Versão:** 1.2.5

