# 🔒 Guia de Segurança - NOC Chamados

## 🎯 Para Administradores

### Configuração Inicial Obrigatória

#### 1. Gerar JWT_SECRET Forte

**NUNCA use um segredo fraco ou padrão!**

```bash
# Gerar um segredo forte (64 bytes = 128 caracteres hex)
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

Adicione ao arquivo `.env`:
```env
JWT_SECRET="seu-segredo-gerado-aqui-minimo-32-caracteres"
```

#### 2. Configurar Banco de Dados

```env
DATABASE_URL="postgresql://usuario:SENHA_FORTE@host:5432/noc_chamados"
```

**Requisitos da senha do banco**:
- Mínimo 16 caracteres
- Letras maiúsculas e minúsculas
- Números
- Caracteres especiais

#### 3. Variáveis de Ambiente em Produção

```env
NODE_ENV="production"
JWT_SECRET="..." # OBRIGATÓRIO
DATABASE_URL="..." # OBRIGATÓRIO
```

---

## 🔐 Segurança Implementada

### Autenticação e Autorização
✅ **JWT Tokens** com expiração de 8 horas  
✅ **HTTPOnly Cookies** - Token não acessível via JavaScript  
✅ **Secure Cookies** - Apenas HTTPS em produção  
✅ **SameSite=lax** - Proteção contra CSRF  
✅ **Bcrypt (12 rounds)** - Hash de senhas robusto  
✅ **Middleware de autenticação** - Todas as rotas protegidas  

### Proteção de APIs
✅ **Rate Limiting** - 5 tentativas de login em 15 minutos  
✅ **Validação de entrada** com Zod  
✅ **Mensagens genéricas** de erro (não revela informações)  
✅ **Timing attack prevention** - Delays artificiais  

### Headers de Segurança
✅ **X-Frame-Options** - Proteção contra clickjacking  
✅ **X-Content-Type-Options** - Previne MIME sniffing  
✅ **X-XSS-Protection** - Proteção XSS legado  
✅ **Strict-Transport-Security** - Força HTTPS  
✅ **Referrer-Policy** - Controla vazamento de referrer  
✅ **Permissions-Policy** - Restringe recursos do navegador  

### Upload de Arquivos
✅ **Tamanho máximo** - 10MB  
✅ **Tipos permitidos** - Whitelist de MIME types  
✅ **Sanitização de nomes** - Remove caracteres perigosos  
✅ **Diretórios isolados** - Por chamado  

### Banco de Dados
✅ **Prisma ORM** - Prepared statements (anti SQL Injection)  
✅ **Soft delete** - Dados não são perdidos  
✅ **Auditoria** - Histórico de mudanças  

---

## ⚠️ Responsabilidades do Administrador

### Diariamente
- [ ] Monitorar logs de erro
- [ ] Verificar tentativas de login falhadas
- [ ] Revisar ações de usuários supervisores

### Semanalmente
- [ ] Backup do banco de dados
- [ ] Executar `npm audit` para vulnerabilidades
- [ ] Revisar usuários ativos

### Mensalmente
- [ ] Rotacionar JWT_SECRET (opcional mas recomendado)
- [ ] Atualizar dependências
- [ ] Revisar e arquivar logs antigos
- [ ] Testar restauração de backup

---

## 🚨 Em Caso de Incidente de Segurança

### 1. Comprometimento de Credenciais

**Ação Imediata**:
```bash
# 1. Desativar usuário comprometido
# Via interface ou banco de dados

# 2. Rotacionar JWT_SECRET
# Gerar novo segredo
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# 3. Atualizar .env
JWT_SECRET="novo-segredo-aqui"

# 4. Reiniciar aplicação
docker service update --force noc-chamados_app
```

### 2. Acesso Não Autorizado Detectado

1. **Isolar**: Verificar escopo do acesso
2. **Conter**: Desativar usuários suspeitos
3. **Investigar**: Revisar logs e histórico
4. **Remediar**: Corrigir vulnerabilidade
5. **Documentar**: Registrar incidente

### 3. Vazamento de Dados

1. **Avaliar**: Que dados foram expostos?
2. **Notificar**: Informar usuários afetados
3. **Mitigar**: Alterar credenciais
4. **Auditar**: Como ocorreu?
5. **Prevenir**: Implementar controles

---

## 📋 Checklist de Segurança para Deploy

### Antes do Deploy
- [ ] `npm audit` sem vulnerabilidades HIGH/CRITICAL
- [ ] Todas as variáveis de ambiente configuradas
- [ ] JWT_SECRET forte (mínimo 32 caracteres)
- [ ] Senha do banco forte
- [ ] Testes de segurança básicos executados

### Durante o Deploy
- [ ] Deploy em horário de baixo tráfego
- [ ] Backup do banco antes do deploy
- [ ] HTTPS configurado e funcionando
- [ ] Certificado SSL válido

### Após o Deploy
- [ ] Testar login com usuário comum
- [ ] Testar login com supervisor
- [ ] Verificar headers de segurança
- [ ] Monitorar logs por 30 minutos

---

## 🛡️ Para Desenvolvedores

### Boas Práticas

#### ❌ NUNCA Faça Isso
```typescript
// NÃO: Expor informações sensíveis em logs
console.log('Senha:', senha)

// NÃO: Comparar senhas em texto plano
if (senha === usuario.senha)

// NÃO: SQL direto (use Prisma)
db.query(`SELECT * FROM usuarios WHERE email = '${email}'`)

// NÃO: Aceitar qualquer input sem validação
const data = req.body // Sem validação
```

#### ✅ SEMPRE Faça Isso
```typescript
// SIM: Logs sanitizados
console.log('Login attempt for user:', { userId: user.id })

// SIM: Usar bcrypt
await verificarSenha(senha, usuario.senhaHash)

// SIM: Usar Prisma ORM
await prisma.usuario.findUnique({ where: { email } })

// SIM: Validar com Zod
const parsed = schema.safeParse(req.body)
```

### Adicionando Nova Rota Protegida

```typescript
import { getUsuarioLogado } from "@/lib/auth"

export async function GET(request: NextRequest) {
  // 1. Verificar autenticação
  const usuario = await getUsuarioLogado()
  if (!usuario) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 })
  }

  // 2. Verificar autorização (se necessário)
  if (usuario.perfil !== "supervisor") {
    return NextResponse.json({ error: "Acesso negado" }, { status: 403 })
  }

  // 3. Validar input
  const parsed = schema.safeParse(data)
  if (!parsed.success) {
    return NextResponse.json({ error: "Dados inválidos" }, { status: 400 })
  }

  // 4. Processar requisição
  // ...
}
```

---

## 🔍 Auditoria e Logs

### O Que é Logado
- ✅ Tentativas de login (sucesso e falha)
- ✅ Atualização de chamados
- ✅ Fechamento de chamados
- ✅ Upload de anexos
- ✅ Criação/exclusão de recursos
- ✅ Ações administrativas

### O Que NÃO é Logado
- ❌ Senhas
- ❌ Tokens JWT
- ❌ Dados pessoais sensíveis
- ❌ Stack traces completos em produção

---

## 📞 Reportar Vulnerabilidade

Se você descobrir uma vulnerabilidade de segurança:

1. **NÃO** abra uma issue pública
2. Entre em contato diretamente com a equipe de TI
3. Forneça detalhes técnicos
4. Aguarde confirmação antes de divulgar

---

## 📚 Recursos Adicionais

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Next.js Security](https://nextjs.org/docs/advanced-features/security-headers)
- [JWT Best Practices](https://tools.ietf.org/html/rfc8725)
- [Node.js Security Checklist](https://github.com/goldbergyoni/nodebestpractices#6-security-best-practices)

---

**Última Atualização**: 30/12/2025  
**Versão**: 1.2.5

