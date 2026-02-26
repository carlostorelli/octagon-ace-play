# RELATÓRIO DE OTIMIZAÇÃO — OSS Fantasy

**Data:** 2026-02-26  
**Escopo:** Auditoria de performance, refactor seguro e boas práticas

---

## ✅ (A) MUDANÇAS REALIZADAS

### 1. Code Splitting / Lazy Loading
- **Todas as 20+ rotas** agora usam `React.lazy()` + `Suspense` em `App.tsx`
- Reduz o bundle inicial significativamente — cada página só carrega quando acessada
- Adicionado componente `PageLoader` com spinner centralizado durante carregamento

### 2. React Query — Otimização Global
- Configurado `staleTime: 2 min` e `refetchOnWindowFocus: false` no `QueryClient`
- Reduz refetches desnecessários ao alternar abas do navegador

### 3. Remoção de Código Morto
- **`src/data/mockData.ts`**: Arquivo inteiro removido — nenhum import em todo o projeto, todos os dados vêm do banco
- **`src/components/NavLink.tsx`**: Componente nunca importado em nenhum arquivo
- **`src/pages/Index.tsx`**: Apenas um wrapper para LandingPage — rota `/` agora aponta direto para LandingPage

### 4. Debounce nos Filtros de Busca
- Criado utilitário `src/lib/useDebounce.ts` (hook genérico, 250ms)
- Aplicado em `EventsPage.tsx` e `PredictionsPage.tsx`
- Evita filtragem a cada keystroke, melhora fluidez

### 5. Memoização de `parseBulkFights` (AdminFights)
- A função `parseBulkFights(bulkText)` era chamada **5 vezes** no mesmo render
- Refatorado para chamar apenas **1 vez** usando IIFE com resultado cacheado

### 6. Limite no LeaderboardPage
- Query de ranking geral agora filtra por `event_id IS NULL` e limita a 100 resultados
- Evita trazer dados de rankings por evento acidentalmente

---

## ⚠️ (B) ITENS ENCONTRADOS MAS NÃO ALTERADOS
*(requerem autorização ou são trade-offs)*

| # | Item | Motivo |
|---|------|--------|
| 1 | **AdminSettings salva Resend API Key no localStorage** | Risco de segurança (XSS). Ideal seria salvar como secret no backend. Não alterado pois é feature existente solicitada pelo usuário. |
| 2 | **`next-themes` como dependência** | Usado apenas pelo componente `sonner.tsx` (shadcn). Poderia ser removido se Sonner não usasse `useTheme`, mas quebraria o componente. |
| 3 | **InputShowcase (`/components/input`)** | Página de dev/demonstração. Sugere-se remover da build de produção ou proteger com flag. |
| 4 | **Timer de 30s em Dashboard e EventPredictionsPage** | Padrão duplicado (`setInterval` para checar predictions open/close). Funciona mas poderia ser um hook reutilizável. |
| 5 | **`@hello-pangea/dnd` (~50KB gzipped)** | Usado apenas em AdminFights para drag-and-drop de reordenar lutas. Peso considerável mas funcionalidade válida. |
| 6 | **Queries do Dashboard (7 queries paralelas)** | Muitas queries independentes no Dashboard. Funciona bem graças ao staleTime, mas uma edge function consolidada reduziria latência. |
| 7 | **Uso massivo de `any` em tipagens** | Vários componentes usam `any` para dados do Supabase. Melhoraria DX e segurança usar tipos gerados. |
| 8 | **AdminFights `reorderMutation` faz N updates sequenciais** | Um batch update via edge function seria mais eficiente para reordenar muitas lutas. |
| 9 | **Imagem hero (hero-octagon.jpg) não otimizada** | Sem verificação de tamanho/formato. WebP seria melhor para performance. |
| 10 | **Google Fonts carregado via @import no CSS** | Bloqueia renderização. Ideal seria usar `<link rel="preload">` ou self-host. |

---

## 📋 (C) CHECKLIST DE DEPLOY

- [ ] **Compressão**: Verificar se o hosting (Lovable) serve com gzip/brotli (automático no Lovable)
- [ ] **Cache Headers**: Assets estáticos (JS/CSS/imagens) devem ter `Cache-Control: max-age=31536000` (automático com hash de Vite)
- [ ] **Hero Image**: Considerar converter `hero-octagon.jpg` para WebP e comprimir (< 200KB ideal)
- [ ] **Fontes**: 3 famílias de fonte carregadas (Oswald, Inter, JetBrains Mono) — ~100KB total. Considerar subset se não usar todos os pesos
- [ ] **Bundle Size**: Com lazy loading implementado, verificar se chunks individuais estão < 200KB
- [ ] **SEO**: Atualizar `<title>` e meta tags em `index.html` (ainda diz "Lovable App")
- [ ] **Favicon**: Usar favicon customizado do projeto
- [ ] **Error Boundaries**: Não há error boundaries — considerar adicionar para resiliência
- [ ] **Lighthouse**: Rodar audit do Lighthouse para validar Core Web Vitals
- [ ] **RLS Policies**: Validar que todas as tabelas com dados sensíveis têm RLS habilitado

---

## 📊 RESUMO DE IMPACTO

| Métrica | Antes | Depois |
|---------|-------|--------|
| Imports eagerly carregados | 20+ páginas | 0 (todas lazy) |
| Refetches ao trocar aba | Sim (toda query) | Não (staleTime 2min) |
| Arquivos mortos no bundle | 3 arquivos | 0 |
| parseBulkFights calls/render | 5x | 1x |
| Debounce em buscas | Nenhum | 250ms |
| Leaderboard query limit | Sem limite | 100 rows |
