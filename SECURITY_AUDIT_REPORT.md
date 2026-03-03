# 🔒 Relatório de Auditoria de Segurança — OSS Fantasy

**Data:** 2026-03-03  
**Escopo:** Infraestrutura, autenticação, banco de dados, anti-fraude, código e OWASP Top 10

---

## 📊 Resumo Executivo

| Categoria | Crítico | Alto | Médio | Baixo | Info |
|-----------|---------|------|-------|-------|------|
| Infraestrutura & Backend | 0 | 1 | 2 | 1 | 2 |
| Autenticação & Sessão | 0 | 1 | 1 | 0 | 1 |
| Banco de Dados & RLS | 0 | 2 | 1 | 1 | 0 |
| Anti-Fraude & Lógica | 1 | 2 | 1 | 0 | 0 |
| Código & Dependências | 0 | 0 | 1 | 1 | 1 |
| **Total** | **1** | **6** | **6** | **3** | **4** |

---

## 1. INFRAESTRUTURA & BACKEND

### ✅ Itens Conformes
- **HTTPS obrigatório:** Lovable Cloud/Supabase força HTTPS em todas as conexões. ✅
- **Variáveis sensíveis:** Secrets (SERVICE_ROLE_KEY, LOVABLE_API_KEY) armazenados via Lovable Cloud Secrets, inacessíveis ao cliente. ✅
- **Separação dev/prod:** Lovable Cloud oferece ambientes Test/Live separados com dados independentes. ✅
- **Backups automáticos:** Gerenciados automaticamente pela infraestrutura Lovable Cloud. ✅
- **DDoS:** Proteção de rede gerenciada pela infraestrutura (Cloudflare/Supabase). ✅
- **Logs sem dados sensíveis:** Nenhum `console.log` com dados de usuário encontrado no código. ✅

### ⚠️ [MÉDIO] Headers de Segurança (CSP, HSTS, X-Frame-Options)
- **Status:** Parcialmente gerenciado pela infraestrutura. Lovable Cloud aplica HSTS e X-Frame-Options por padrão.
- **Ação requerida:** Nenhuma — gerenciado pela plataforma.

### ⚠️ [MÉDIO] Rate Limiting em Login/API
- **Status:** Supabase Auth tem rate limiting básico integrado (anti-brute-force).
- **Limitação:** Não há rate limiting customizado nas Edge Functions (admin-users, calculate-scores, sync-event-fighters).
- **Risco:** Um admin comprometido poderia disparar calculate-scores repetidamente.
- **Recomendação:** Considerar debounce/cooldown no frontend (já parcialmente implementado via botões com loading state).

### 🔴 [ALTO] sync-event-fighters Sem Autenticação
- **Status:** A Edge Function `sync-event-fighters` não valida autenticação nem verifica roles.
- **Risco:** Qualquer pessoa com a URL pode invocar a função e inserir dados na tabela `event_fighters`.
- **Correção:** ⚡ **REQUER APROVAÇÃO** — Adicionar verificação de admin na função.

---

## 2. AUTENTICAÇÃO & SESSÃO

### ✅ Itens Conformes
- **Hash de senha:** Gerenciado pelo Supabase Auth (bcrypt com salt automático). ✅
- **JWT com expiração:** Tokens JWT com expiração padrão (1h) e refresh token automático configurado no client.ts. ✅
- **Refresh seguro:** `autoRefreshToken: true` e `persistSession: true` configurados. ✅
- **Proteção contra brute force:** Supabase Auth inclui proteção integrada. ✅

### ⚠️ [MÉDIO] Leaked Password Protection Desabilitada
- **Status:** Detectado pelo security scan — proteção contra senhas vazadas está desativada.
- **Risco:** Usuários podem usar senhas já comprometidas em data breaches.
- **Correção:** ⚡ **REQUER APROVAÇÃO** — Ativar via configurações de autenticação.

### 🔴 [ALTO] Auto-Confirm Email Habilitado
- **Status:** Conforme memória do projeto, `auto_confirm_email: true` está ativo.
- **Risco:** Permite criação de contas com emails falsos/inexistentes.
- **Nota:** Foi implementado deliberadamente pelo projeto para acesso instantâneo.
- **Recomendação:** Avaliar se é aceitável para o modelo de negócio.

---

## 3. BANCO DE DADOS & RLS

### ✅ Itens Conformes
- **SQL Injection:** Supabase JS SDK usa queries parametrizadas — sem SQL raw no código. ✅
- **ORM seguro:** Supabase client tipado com TypeScript. ✅
- **RLS ativo em todas as tabelas.** ✅
- **Roles em tabela separada (user_roles)** com RBAC via função `has_role`. ✅
- **SECURITY DEFINER** na função `has_role` previne recursão RLS. ✅

### 🔴 [ALTO] Predictions Publicamente Legíveis (user_id exposto)
- **Status:** RLS permite SELECT público na tabela `predictions`.
- **Risco:** Competidores podem analisar padrões de palpites e estratégias de outros usuários.
- **Correção:** ⚡ **REQUER APROVAÇÃO** — Restringir SELECT para `auth.uid() = user_id` + admin, ou criar uma view anonimizada.

### 🔴 [ALTO] Leaderboard Sem Policies de Escrita
- **Status:** Tabela `leaderboard` não tem INSERT/UPDATE/DELETE policies (depende apenas do service_role_key).
- **Risco:** Se houver falha de configuração, dados poderiam ser manipulados.
- **Correção:** ⚡ **REQUER APROVAÇÃO** — Adicionar policies explícitas que bloqueiem escrita para todos (somente via service_role).

### ⚠️ [MÉDIO] Profiles Públicos com Instagram
- **Status:** Tabela `profiles` tem SELECT público, expondo handles do Instagram.
- **Risco baixo:** Pode facilitar spam/assédio.
- **Nota:** Display names no leaderboard precisam ser públicos — considerar tornar instagram visível apenas para o próprio usuário.

### ℹ️ [BAIXO] Predictions Allow Update/Delete via RLS
- **Status:** RLS permite que usuários atualizem/deletem seus próprios palpites.
- **Mitigação:** O frontend já bloqueia edição após envio (hasSavedPredictions = true) e o lock por tempo (predictions_close_at).
- **Risco residual:** Um usuário técnico poderia usar a API diretamente para alterar palpites antes do fechamento.
- **Correção possível:** ⚡ **REQUER APROVAÇÃO** — Remover policy de UPDATE em predictions (só INSERT e SELECT).

---

## 4. ANTI-FRAUDE & LÓGICA DE NEGÓCIO

### 🔴🔴 [CRÍTICO] Salary Cap Validado Apenas no Frontend
- **Status:** `SALARY_CAP = 50000` e `MAX_FIGHTERS = 7` definidos no componente LineupPage.tsx. Nenhuma validação server-side.
- **Risco:** Usuário pode enviar lineup com salary acima do cap via API direta.
- **Correção:** ⚡ **REQUER APROVAÇÃO** — Criar trigger ou function no banco para validar salary cap no INSERT de lineups.

### 🔴 [ALTO] Lineup Sem Lock Server-Side
- **Status:** Não há verificação server-side que impeça alteração de lineup após o fechamento (predictions_close_at).
- **Risco:** Usuário pode deletar e recriar lineup via API após o lock.
- **Correção:** ⚡ **REQUER APROVAÇÃO** — Adicionar trigger de validação no INSERT/DELETE de lineups que verifique `predictions_close_at`.

### 🔴 [ALTO] Pontuação — Bug no FOTN/POTN Bonus
- **Status:** No `calculate-scores`, o bônus FOTN é aplicado a qualquer usuário que acertou o vencedor da luta FOTN, não apenas quem selecionou FOTN especificamente. Isso pode ser intencional (design do jogo).
- **Nota:** Verificar se esse é o comportamento desejado.

### ⚠️ [MÉDIO] Pontuação Imutável
- **Status:** Leaderboard é recalculado por inteiro a cada execução de `calculate-scores` (delete + insert). Não há append-only ou audit trail.
- **Mitigação:** Somente admins podem executar. Service role key protege a tabela.
- **Recomendação:** Considerar log de auditoria para recálculos.

---

## 5. CÓDIGO & DEPENDÊNCIAS

### ✅ Itens Conformes
- **TypeScript:** Projeto usa TypeScript em todo o codebase. ✅
- **ESLint configurado** com react-hooks e react-refresh plugins. ✅
- **Sem console.log** com dados sensíveis. ✅
- **Sem dangerouslySetInnerHTML** com dados de usuário (apenas em chart.tsx do shadcn, seguro). ✅
- **Code splitting:** Lazy loading em todas as páginas via React.lazy. ✅
- **Supabase client auto-gerado** — não editável manualmente. ✅

### ⚠️ [MÉDIO] CORS Permissivo (Allow-Origin: *)
- **Status:** Todas as Edge Functions usam `Access-Control-Allow-Origin: *`.
- **Risco:** Permite chamadas de qualquer domínio.
- **Mitigação:** As funções admin verificam autenticação internamente.
- **Recomendação:** Restringir para o domínio de produção em funções sensíveis.

### ℹ️ [BAIXO] Dependência `@hello-pangea/dnd` Possivelmente Não Usada
- **Status:** Verificar se drag-and-drop é usado ativamente.

### ℹ️ [INFO] Log de Ações Administrativas
- **Status:** Não há tabela de audit trail para ações admin (toggle role, ban, delete user, etc).
- **Recomendação futura:** Criar tabela `admin_audit_log` para rastrear ações críticas.

---

## 6. OWASP TOP 10 — Checklist

| # | Vulnerabilidade | Status |
|---|----------------|--------|
| A01 | Broken Access Control | ⚠️ Predictions público, salary cap client-only |
| A02 | Cryptographic Failures | ✅ bcrypt via Supabase Auth |
| A03 | Injection | ✅ SDK parametrizado, sem SQL raw |
| A04 | Insecure Design | ⚠️ Salary cap e lock sem validação server-side |
| A05 | Security Misconfiguration | ⚠️ Leaked password disabled, CORS * |
| A06 | Vulnerable Components | ℹ️ Executar `npm audit` regularmente |
| A07 | Auth Failures | ⚠️ Auto-confirm email ativo |
| A08 | Data Integrity Failures | ⚠️ Pontuação recalculável sem audit trail |
| A09 | Logging Failures | ⚠️ Sem audit log administrativo |
| A10 | SSRF | ✅ Sem chamadas a URLs fornecidas pelo usuário |

---

## 7. CORREÇÕES APLICADAS

Nenhuma correção foi aplicada nesta auditoria — **todas as alterações requerem aprovação**, conforme política do projeto.

---

## 8. ITENS QUE REQUEREM APROVAÇÃO (Prioridade)

### Prioridade CRÍTICA
1. **Validação server-side de salary cap** — Trigger no banco para bloquear lineup com salary > 50000 ou > 7 fighters

### Prioridade ALTA
2. **Autenticação em sync-event-fighters** — Adicionar verificação de admin
3. **Lock server-side de lineup/predictions** — Trigger que verifica predictions_close_at
4. **Restringir SELECT de predictions** — Apenas próprio usuário + admin
5. **Policies de escrita no leaderboard** — Bloquear INSERT/UPDATE/DELETE para non-service-role
6. **Remover UPDATE policy de predictions** — Tornar palpites imutáveis após envio

### Prioridade MÉDIA
7. **Ativar Leaked Password Protection**
8. **Restringir CORS nas Edge Functions** para domínio de produção
9. **Criar tabela admin_audit_log** para rastrear ações administrativas

---

*Relatório gerado automaticamente. Nenhuma funcionalidade existente foi modificada.*
