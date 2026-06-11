# Knowflow

PWA de aprendizado peer-to-peer para times corporativos — colaboradores compartilham conhecimento em formato Stories, com fluxo de aprovação, repetição espaçada inteligente (SRS) e trilhas de onboarding.

## Estrutura

```
knowflow/
├── frontend/   # React + Vite PWA
└── backend/    # Express + Prisma + PostgreSQL
```

## Setup

### Backend

```bash
cd backend
cp .env.example .env   # preencha as variáveis
npm install
npx prisma migrate dev
npx prisma db seed
npm run dev
```

### Frontend

```bash
cd frontend
cp .env.example .env   # preencha as variáveis
npm install
npm run dev
```

## Stack

- **Frontend:** React 18, Vite 5, TypeScript, Tailwind CSS, shadcn/ui, Framer Motion, ts-fsrs, TipTap, React Router 6, Zustand, React Query 5
- **Backend:** Node 20, Express 4, TypeScript, Prisma 5, PostgreSQL 15, Supabase (Auth + Storage), web-push, zod
- **Infra:** Railway (backend + DB), Netlify (frontend), Supabase (auth + mídia)

## Status do desenvolvimento

Seguindo a ordem da seção 13 da especificação:

- [x] Semana 1–2 — Base (monorepo, schema, auth, CRUDs de organização)
- [ ] Semana 3–4 — Criação de conteúdo
- [ ] Semana 5–6 — Consumo de conteúdo
- [ ] Semana 7–8 — SRS e Trilhas
- [ ] Semana 9–10 — Aprovação com Pins
- [ ] Semana 11–12 — PWA e Notificações
