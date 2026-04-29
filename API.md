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

> ℹ️ A API **não usa header `Authorization: Bearer`**. O login retorna o JWT em um cookie `auth-token` (HTTPOnly). Em todas as requisições subsequentes você precisa **reenviar esse cookie** — é assim que a API reconhece sua sessão.

### 1. Fazer Login

```bash
# -c cookies.txt salva o cookie auth-token retornado pelo servidor
curl -X POST https://chamados.xmov.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@xmov.com.br","senha":"senha"}' \
  -c cookies.txt
```

Resposta esperada (200):

```json
{ "success": true, "nome": "Fulano", "perfil": "operador" }
```

E o servidor envia um header `Set-Cookie` parecido com:

```
Set-Cookie: auth-token=eyJhbGciOi...; Path=/; HttpOnly; SameSite=Lax; Max-Age=28800
```

### 2. Criar um Chamado (usando o cookie do login)

```bash
# -b cookies.txt envia o cookie auth-token salvo no passo 1
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

### 5. Verificar quem está autenticado

```bash
curl https://chamados.xmov.com.br/api/auth/me -b cookies.txt
```

### 6. Logout (invalida o cookie)

```bash
curl -X POST https://chamados.xmov.com.br/api/auth/logout -b cookies.txt -c cookies.txt
```

---

## 🔑 Usando o Token de Autenticação

Depois do login, o token JWT fica armazenado no cookie `auth-token` (HTTPOnly, `SameSite=Lax`, validade de 8 horas). Você não precisa lê-lo — basta **reenviar o cookie** em cada requisição. Veja como fazer isso em cada cliente:

### cURL

```bash
# 1) Login: salva o cookie em cookies.txt
curl -X POST https://chamados.xmov.com.br/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"usuario@xmov.com.br","senha":"senha"}' \
  -c cookies.txt

# 2) Endpoint protegido: reusa o cookie com -b
curl https://chamados.xmov.com.br/api/chamados -b cookies.txt
```

### JavaScript (browser / `fetch`)

No navegador, o cookie é enviado automaticamente desde que você use `credentials: 'include'` (cross-origin) ou `credentials: 'same-origin'` (mesma origem):

```javascript
// Login
await fetch('https://chamados.xmov.com.br/api/auth/login', {
  method: 'POST',
  credentials: 'include',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'usuario@xmov.com.br', senha: 'senha' }),
});

// Requisição autenticada (cookie auth-token vai junto automaticamente)
const res = await fetch('https://chamados.xmov.com.br/api/chamados', {
  credentials: 'include',
});
const chamados = await res.json();
```

> ⚠️ Sem `credentials: 'include'` o navegador **não envia** o cookie e você recebe 401.

### Axios

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'https://chamados.xmov.com.br/api',
  withCredentials: true, // envia cookies em todas as requests
});

await api.post('/auth/login', { email: 'usuario@xmov.com.br', senha: 'senha' });
const { data } = await api.get('/chamados');
```

### Node.js (sem navegador) — `fetch` + cookie manual

Em Node, o `fetch` global não persiste cookies entre requests. Capture o `Set-Cookie` do login e envie de volta no header `Cookie`:

```javascript
// Node 18+
const loginRes = await fetch('https://chamados.xmov.com.br/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email: 'usuario@xmov.com.br', senha: 'senha' }),
});

const setCookie = loginRes.headers.get('set-cookie') ?? '';
const authCookie = setCookie.split(';')[0]; // ex.: "auth-token=eyJhbGciOi..."

const res = await fetch('https://chamados.xmov.com.br/api/chamados', {
  headers: { Cookie: authCookie },
});
console.log(await res.json());
```

### Python (`requests`)

`requests.Session()` cuida do cookie automaticamente:

```python
import requests

s = requests.Session()
s.post(
    "https://chamados.xmov.com.br/api/auth/login",
    json={"email": "usuario@xmov.com.br", "senha": "senha"},
)

# A sessão reutiliza o cookie auth-token automaticamente
r = s.get("https://chamados.xmov.com.br/api/chamados")
print(r.json())
```

### Postman / Insomnia

1. Faça a requisição `POST /api/auth/login`.
2. O Postman armazena o cookie `auth-token` automaticamente para o domínio.
3. As próximas requisições para o mesmo host reutilizam o cookie sem configuração extra.
4. Para inspecionar/limpar: aba **Cookies** (abaixo do botão Send).

### Por que não tem `Authorization: Bearer`?

O cookie é **HTTPOnly**, ou seja, **não pode ser lido por JavaScript no navegador**. Isso protege o token contra roubo via XSS. Como consequência, você **não consegue** (e não precisa) extrair o JWT para colocar manualmente em um header `Authorization`. Apenas reenvie o cookie.

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
A API usa **JWT via HTTPOnly Cookie** chamado `auth-token` (validade de 8h, `SameSite=Lax`, `Secure` em produção).

- **Não há header `Authorization: Bearer`.**
- O cookie é setado automaticamente pelo `POST /api/auth/login`.
- Em todas as requisições seguintes, basta reenviar o cookie (no navegador isso é automático com `credentials`).

```javascript
fetch('/api/chamados', {
  credentials: 'include'  // Importante! Envia o cookie auth-token
});
```

Veja exemplos completos em cURL, Node.js, Python, Axios e Postman na seção [🔑 Usando o Token de Autenticação](#-usando-o-token-de-autenticação).

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
**Causas comuns:**
- Esqueceu de enviar o cookie `auth-token` (no navegador, faltou `credentials: 'include'`; no `curl`, faltou `-b cookies.txt`; em Node, faltou repassar o header `Cookie`).
- O cookie expirou (validade de 8 horas) — refaça login.
- Tentou usar header `Authorization: Bearer ...` — a API ignora esse header, autenticação é só por cookie.

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

