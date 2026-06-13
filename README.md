# Knowflow

[![CI](https://github.com/victorfioravante/knowflow/actions/workflows/ci.yml/badge.svg)](https://github.com/victorfioravante/knowflow/actions/workflows/ci.yml)

PWA de aprendizado peer-to-peer para times corporativos. Colaboradores criam conteúdo em formato Stories — com blocos de texto, imagem, voz, flashcard e quiz — que passa por um fluxo de aprovação antes de chegar aos aprendizes, com repetição espaçada (FSRS) para retenção de longo prazo.

**Problema real:** onboarding e transferência de conhecimento em empresas dependem de documentos estáticos que ninguém lê e treinamentos sincrônicos que não escalam. O Knowflow transforma especialistas internos em criadores de conteúdo assíncrono com um fluxo editorial completo.

> **Demo:** [knowflow.up.railway.app](https://knowflow.up.railway.app) — botão **"Entrar como demonstração"** na tela de login dá acesso ao conteúdo de exemplo sem cadastro.

---

## Arquitetura

```
knowflow/
├── frontend/      # React 18 + Vite PWA  (Netlify)
└── backend/       # Express + Prisma + PostgreSQL  (Railway)
```

O backend expõe uma API REST em `/api/v1`. Autenticação via Supabase JWT — o middleware valida o token e injeta `req.user` e `req.organization` em todas as rotas protegidas. Uploads de mídia vão direto ao Supabase Storage; o backend armazena apenas as URLs.

O fluxo editorial central é **DRAFT → PENDING → APPROVED/REJECTED**: criadores (CONTRIBUTOR+) submetem decks, managers aprovam ou rejeitam com nota obrigatória. Apenas decks APPROVED chegam ao feed dos aprendizes (LEARNER).

Decisões de arquitetura documentadas em [`DECISIONS.md`](./DECISIONS.md).

---

## Stack

| Camada | Tecnologias |
|---|---|
| **Frontend** | React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion |
| **State** | Zustand (client state), TanStack Query 5 (server state) |
| **Editor** | TipTap (rich text), @dnd-kit (drag-and-drop) |
| **SRS** | ts-fsrs (FSRS v4 — Free Spaced Repetition Scheduler) |
| **Backend** | Node 20, Express 4, TypeScript, Zod (validação) |
| **ORM / DB** | Prisma 5, PostgreSQL 15 |
| **Auth / Storage** | Supabase (JWT + Storage) |
| **Deploy** | Railway (backend + DB), Netlify (frontend) |
| **Testes** | Vitest 4 |
| **CI** | GitHub Actions |

---

## Funcionalidades implementadas

- **Criação de conteúdo** — editor canvas com 5 tipos de bloco (texto rico, imagem, voz, flashcard, quiz); reordenação drag-and-drop de stories e blocos
- **Fluxo de aprovação** — submit → pending → approved/rejected com nota; controle de acesso por role (ADMIN / MANAGER / CONTRIBUTOR / LEARNER)
- **Story Player** — reprodução sequencial com suporte a todos os tipos de bloco; integração com FSRS para scheduling de revisões
- **Templates** — galeria de templates de plataforma e por organização; criação de deck a partir de template
- **Uploads** — imagens (max 5 MB) e áudio (max 25 MB) via Supabase Storage
- **Trilhas** — modelo de dados para trilhas de aprendizado sequencial e onboarding (frontend em progresso)

---

## Rodando localmente

```bash
# Clone e instale tudo (monorepo com npm workspaces)
git clone https://github.com/victorfioravante/knowflow
cd knowflow
npm install

# Backend
cd backend
cp .env.example .env   # preencha DATABASE_URL, SUPABASE_*, VAPID_*
npx prisma migrate dev
npx prisma db seed
npm run dev            # porta 3003

# Frontend (novo terminal)
cd frontend
cp .env.example .env   # preencha VITE_API_URL, VITE_SUPABASE_*
npm run dev            # porta 5173
```

### Testes

```bash
npm test --workspace=backend   # prisma generate + 19 testes unitários
```

### Habilitando a demo pública

A demo "navegável sem cadastro" usa uma conta pré-provisionada:

1. Crie a conta `demo@knowflow.app` no Supabase Auth e copie o `User UID`.
2. **Backend:** defina `DEMO_USER_SUPABASE_ID=<uid>` e rode `npx prisma db seed` — provisiona o usuário demo (ADMIN) e os decks de exemplo.
3. **Frontend:** defina `VITE_DEMO_EMAIL` e `VITE_DEMO_PASSWORD` — o botão "Entrar como demonstração" aparece na tela de login.

Sem essas variáveis o app funciona normalmente; apenas o atalho de demo fica oculto.

---

## Estrutura da API

Base: `POST /api/v1` — todas as rotas autenticadas requerem `Authorization: Bearer <supabase-jwt>`.

| Recurso | Endpoints |
|---|---|
| Auth | `POST /auth/verify` · `POST /auth/invite` · `POST /auth/accept-invite/:token` |
| Decks | `GET/POST /decks` · `GET/PATCH/DELETE /decks/:id` · `POST /decks/:id/submit|approve|reject` |
| Stories | `GET/POST /decks/:deckId/stories` · `PATCH /stories/reorder` |
| Blocos | `GET/POST /stories/:storyId/blocks` · `PATCH /blocks/reorder` |
| Progresso | `POST /progress/deck/:deckId/complete|quiz-score` |
| Uploads | `POST /uploads/image` · `POST /uploads/audio` |
| Org/Admin | `/organizations` · `/sectors` · `/roles` · `/knowledge-areas` · `/users` |
