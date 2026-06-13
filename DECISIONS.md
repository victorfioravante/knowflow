# Decisões de Arquitetura

Registro das principais decisões tomadas durante o desenvolvimento do Knowflow. Formato: contexto → opções consideradas → escolha → justificativa.

---

## 1. Monorepo com npm workspaces (não Turborepo)

**Contexto:** Frontend e backend compartilham convenções de tipos e precisam ser coordenados em deploy. Precisava decidir a estrutura do repositório antes de qualquer linha de código.

**Opções:**
- A) Repos separados (frontend-repo / backend-repo)
- B) Monorepo com Turborepo
- C) Monorepo com npm workspaces nativos

**Escolha:** C — npm workspaces nativo.

**Por quê:** Para dois pacotes sem build interdependente, Turborepo adiciona complexidade sem benefício real. O npm workspaces resolve o essencial: instala tudo com um `npm install`, permite `npm run build --workspace=backend`, e o package-lock.json é único. Se o projeto crescer para 5+ pacotes com dependências cruzadas, Turborepo faria sentido — ainda não é o caso.

---

## 2. Railway para backend, Netlify para frontend (não Vercel para tudo)

**Contexto:** Precisava de deploy simples para monorepo. Claude Code sugeriu Vercel para ambos, usando API routes no Next.js para eliminar o backend separado.

**Opções:**
- A) Vercel para tudo (Next.js API routes)
- B) Railway (backend) + Netlify (frontend)
- C) Render + Netlify

**Escolha:** B — Railway + Netlify.

**Por que rejeitei a sugestão de Vercel/Next.js:** Serverless functions têm cold starts com Prisma porque cada invocação pode criar uma nova conexão ao banco — Prisma recomenda explicitamente connection pooling (via Accelerate ou PgBouncer) para serverless. Railway roda o processo Node.js de forma persistente, zerando esse problema sem overhead de configuração. Além disso, migrar de Express para Next.js API routes teria descartado um backend já funcional sem ganho proporcional.

---

## 3. Prisma em vez de DrizzleORM

**Contexto:** Precisava de um ORM TypeScript com migrations automáticas e bom suporte a relações complexas (deck → stories → blocks com cascades).

**Opções:**
- A) Prisma 5
- B) DrizzleORM
- C) TypeORM
- D) SQL puro (pg + queries manuais)

**Escolha:** A — Prisma.

**Por quê:** O schema declarativo do Prisma (`schema.prisma`) é a source of truth para o banco E para os tipos TypeScript — sem duplicação. As migrations são geradas automaticamente (`prisma migrate dev`). O `@prisma/client` gerado tem types completos para todas as queries, incluindo includes aninhados. DrizzleORM exige mais boilerplate para relações, e TypeORM tem DX inferior com decorators. SQL puro seria mais controle, mas o modelo de dados tem 18+ tabelas com relações — o custo de manutenção não justifica.

---

## 4. Supabase para Auth e Storage (não JWT próprio)

**Contexto:** Precisava de autenticação segura com JWT e armazenamento de mídia (imagens ≤5 MB, áudio ≤25 MB).

**Opções:**
- A) Supabase (auth + storage + PostgreSQL hosted)
- B) Auth próprio com bcrypt + JWT + AWS S3
- C) Auth0 + AWS S3

**Escolha:** A — Supabase.

**Por que rejeitei auth próprio:** Claude Code inicialmente sugeriu bcrypt + JWT próprio para simplificar a stack. Rejeitei porque implementar JWT auth seguro implica: refresh token rotation, rate limiting em `/login`, proteção contra timing attacks no bcrypt compare, blacklist de tokens revogados, e idealmente 2FA. Supabase resolve tudo isso out-of-the-box, gratuitamente até 50k usuários. O backend valida o token Supabase via `supabaseAdmin.auth.getUser()` — não mantém sessão própria. Isso é menos código de segurança que eu preciso testar e manter.

---

## 5. FSRS v4 (ts-fsrs) em vez de SM-2

**Contexto:** O Story Player precisava de um algoritmo de repetição espaçada para scheduling de revisões em flashcards e quiz — o núcleo do diferencial de retenção do produto.

**Opções:**
- A) SM-2 (SuperMemo 2, algoritmo clássico de 1987)
- B) FSRS v4 (Free Spaced Repetition Scheduler, 2022)
- C) Intervalo fixo (sem algoritmo)

**Escolha:** B — FSRS via biblioteca `ts-fsrs`.

**Por quê:** FSRS é empiricamente superior ao SM-2 (~10% maior taxa de retenção em estudos controlados) e tem parâmetros calibráveis por usuário. A biblioteca `ts-fsrs` é TypeScript nativo, ativamente mantida, e o modelo de dados do FSRS cabe exatamente no model `Review` do schema (stability, difficulty, elapsed, scheduled, reps, lapses, state). SM-2 seria mais simples de implementar, mas o produto promete retenção de longo prazo — usar um algoritmo inferior seria inconsistência entre marketing e tecnologia.

---

## 6. Zod para validação de entrada (não Joi nem express-validator)

**Contexto:** Toda request body do backend precisa ser validada antes de tocar o banco. Precisava de uma solução que evitasse duplicação de tipos TypeScript.

**Opções:**
- A) Zod
- B) Joi
- C) express-validator
- D) Validação manual

**Escolha:** A — Zod.

**Por quê:** Zod é o único que infere tipos TypeScript diretamente do schema — `z.infer<typeof createDeckSchema>` elimina a duplicação entre "tipo do body" e "schema de validação". Com Joi, você define o schema Joi E o tipo TypeScript separadamente, que divergem ao longo do tempo. O middleware `validate.middleware.ts` centraliza a validação: recebe qualquer schema Zod, chama `safeParse`, e retorna 400 com os erros estruturados antes de chegar ao controller.

---

## 7. Fluxo editorial DRAFT → PENDING → APPROVED/REJECTED como feature central

**Contexto:** Em conteúdo corporativo (onboarding, treinamentos), conteúdo não-revisado distribuído para toda a organização é um risco real — informação errada, desatualizada, ou fora do tom da empresa. O sistema precisava de um gate de qualidade.

**Opções:**
- A) Publicação imediata (criador publica direto)
- B) Workflow com estados: DRAFT → PENDING → APPROVED/REJECTED
- C) Aprovação em lote periódica

**Escolha:** B — workflow com estados explícitos.

**Por quê:** A opção A não escala para conteúdo corporativo — sem revisão, o sinal de qualidade se perde rapidamente. A opção C cria gargalo e latência. O workflow B mapeia exatamente o processo real de times de L&D: criador finaliza e submete, manager revisa, aprova ou rejeita com nota de melhoria. A nota de rejeição é obrigatória (`min(1)`) — rejeitar sem feedback não é permitido pelo sistema. Isso cria um loop de melhoria rastreável: o criador vê o motivo, revisa o deck (agora em REJECTED), e resubmete.
