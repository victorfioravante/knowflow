# Knowflow

> Peer-to-peer corporate knowledge sharing, powered by spaced repetition.

Knowflow é uma PWA B2B que permite que equipes capturem, compartilhem e retenham conhecimento interno através de decks de aprendizagem com repetição espaçada (algoritmo FSRS) e um editor de histórias baseado em canvas.

## ✨ Funcionalidades

- **Decks colaborativos** — qualquer pessoa da equipe cria; conteúdo passa por fluxo de aprovação (submit → approve/reject)
- **Repetição espaçada** — agendamento de revisões com [ts-fsrs](https://github.com/open-spaced-repetition/ts-fsrs), maximizando retenção com o mínimo de revisões
- **Editor de histórias em canvas** — blocos de conteúdo ricos (texto, mídia, quiz) montados visualmente
- **PWA offline-first** — instalável, com notificações push (Web Push/VAPID) para lembretes de revisão
- **Multi-tenant B2B** — espaços por organização com papéis e permissões

## 🛠 Stack

| Camada | Tecnologias |
|---|---|
| Frontend | React, TypeScript, Vite, PWA |
| Backend | Node.js, Express, TypeScript |
| Banco | PostgreSQL + Prisma ORM |
| Auth & Storage | Supabase (SAML-ready) |
| Aprendizagem | ts-fsrs (FSRS scheduler) |

## 🚀 Rodando localmente

```bash
# 1. Clone e instale
git clone https://github.com/victorfioravante/knowflow.git
cd knowflow && npm install

# 2. Configure o ambiente
cp backend/.env.example backend/.env
# preencha DATABASE_URL, SUPABASE_URL, chaves VAPID etc.

# 3. Migre o banco e popule dados de demonstração
cd backend && npx prisma migrate dev && npx prisma db seed

# 4. Suba backend (porta 3003) e frontend (porta 5173)
npm run dev
```

## 📐 Arquitetura

Monorepo com `backend/` (API REST + Prisma) e `frontend/` (SPA/PWA). Eventos de revisão alimentam o scheduler FSRS, que recalcula o intervalo ideal de cada cartão por usuário. O fluxo editorial (rascunho → submissão → aprovação) garante curadoria do conhecimento publicado.

## 🗺 Roadmap

- [ ] Analytics de retenção por equipe
- [ ] Importação de conteúdo (SCORM/xAPI)
- [ ] Integração Slack/Teams para lembretes

## 📄 Licença

MIT © Victor Fioravante
