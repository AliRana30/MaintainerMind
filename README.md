<div align="center">

# 🧠 MaintainerMind

### *Long-Term Cognitive Memory for Open Source Repositories*

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org)
[![Cognee](https://img.shields.io/badge/Powered%20by-Cognee-6E56F2)](https://cognee.ai)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-blue?logo=postgresql)](https://postgresql.org)
[![BullMQ](https://img.shields.io/badge/Queue-BullMQ-red)](https://bullmq.io)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?logo=docker)](https://docker.com)

> **MaintainerMind solves institutional knowledge loss in open-source repositories by building a persistent, AI-queryable knowledge graph from every PR, commit, issue, and code review — powered by Cognee's hybrid graph-vector memory.**

</div>

---

## 🎯 The Problem

Open source has changed. AI coding assistants now generate pull requests in minutes, flooding repositories with activity. But the real problem isn't volume — it's **context collapse**:

- 🔁 Maintainers repeat the same explanations across hundreds of PRs
- 🗂️ Architectural decisions are buried in 2-year-old issue threads
- 🔄 Contributors unknowingly reproduce bugs that were already fixed
- 💀 When key maintainers leave, institutional knowledge disappears with them
- 🤖 AI-assisted PRs arrive with no understanding of repository history

**Every repository is slowly losing its memory.**

---

## 💡 The Solution

MaintainerMind continuously listens to GitHub activity via webhooks, ingests every event through a background worker pipeline, and builds a **persistent semantic knowledge graph** using Cognee Cloud. When a new PR is opened, the system instantly surfaces:

- 🔍 Similar historical pull requests and their outcomes
- ⚠️ Previously rejected approaches and *why* they were rejected  
- 🏗️ Related architectural decisions from months-old discussions
- 🐛 Potential regressions based on files changed
- 🤝 Relevant reviewers who worked on related code

**Instead of asking "Has this been done before?" — MaintainerMind already knows.**

---

## 🏆 Judging Criteria — How MaintainerMind Qualifies

### 1. 🌍 Potential Impact
Every software project — from 10-star hobby repos to 100k-star enterprise OSS — suffers from knowledge loss. MaintainerMind transforms repositories from amnesiac black boxes into **self-documenting intelligent systems**. As AI-generated code floods platforms like GitHub, this becomes not a nice-to-have but a **critical infrastructure layer** for sustainable open-source maintenance.

### 2. 🔬 Creativity & Innovation
We didn't build another chatbot or RAG wrapper. MaintainerMind is a **living, evolving knowledge layer** that:
- Treats a repository's entire history as a structured cognitive entity
- Uses Cognee's graph-vector hybrid to model **relationships**, not just similarity
- Implements selective memory pruning (`forget()`) so the graph never becomes stale
- Provides per-PR proactive memory surfacing before maintainers even ask

### 3. ⚙️ Technical Excellence
- **Event-driven architecture**: GitHub Webhooks → BullMQ → Worker → Cognee/PostgreSQL
- **Circuit breaker pattern** on all Cognee API calls (graceful degradation)
- **Idempotent webhook processing** (deduplication via `githubEventId`)
- **Cascading cleanup**: Disconnecting a repo forgets its Cognee dataset + cascades DB deletes
- **Health-aware queue**: Worker gracefully handles SIGTERM/SIGINT for zero-downtime restarts
- **Production-grade Docker setup**: Multi-stage build, non-root user, proper health checks

### 4. 🧠 Best Use of Cognee

MaintainerMind implements the **full Cognee memory lifecycle**:

| Cognee API | Where Used | What It Does |
|---|---|---|
| `remember()` | `memory.service.ts` | Every PR/issue/commit ingested per-repo dataset |
| `recall()` | `graph/recall/route.ts`, `chat` | Powers PR context, AI chat, repo search |
| `improve()` | `memory/improve/route.ts` | Memory Health optimizer — enriches graph quality |
| `forget()` | `memory/forget/route.ts`, `disconnect` | Prunes stale data; clears on repo disconnect |
| Dataset isolation | `install-callback/route.ts` | Each repo gets its own Cognee dataset namespace |
| `GRAPH_COMPLETION` | Chat interface | Deep graph-traversal answer generation |
| `CHUNKS` | PR insights | Efficient chunk retrieval for context suggestions |

### 5. ✨ User Experience
- **Dark-mode developer-first UI** built with Next.js 15 + Framer Motion animations
- **Real-time notifications** via Server-Sent Events (SSE)
- **3-step auth flow**: GitHub OAuth → App Install → Repository Sync
- **Memory Health dashboard**: graph nodes, edges, quality score, enrichment controls
- **Interactive knowledge graph** visualization (React Flow)
- **Forgot password** with full recovery flow + password visibility toggles
- **Smooth section navigation** on marketing page with anchor scrolling
- **Responsive design** across desktop and mobile

### 6. 📋 Presentation Quality
This README + the live application demonstrate:
- Clear problem statement with quantified pain points
- End-to-end architecture diagram showing data flow
- Live Cognee API usage across all four memory lifecycle functions
- One-command Docker setup for instant local demo

---

## 🏗️ Architecture

```
GitHub Repository
      │ webhooks (PR, push, issues)
      ▼
Vercel — Next.js 15 (API Routes + Frontend)
      │ validates + enqueues
      ▼
Upstash Redis ←──── BullMQ Job Queues ────► Render (Docker Worker)
                                                    │
                            ┌───────────────────────┤
                            │                       │
                            ▼                       ▼
                    PostgreSQL DB          Cognee Cloud API
                    (Prisma ORM)          (Knowledge Graph)
                            │                       │
                            └───────────┬───────────┘
                                        ▼
                              Web Dashboard (recall + visualize)
```

### Pipeline Detail

```
Webhook Event Received
  → Signature verified (HMAC-SHA256)
  → WebhookEvent record created in PostgreSQL
  → Job added to ingestionQueue (BullMQ/Redis)
  → Worker picks up job
  → Fetches full PR/issue data from GitHub API
  → Formats as structured memory text
  → Calls cognee.remember() with repo dataset
  → Updates repository sync status in DB
  → Adds embed job to embeddingQueue
  → Embedding worker calls cognee.improve()
```

---

## 🛠️ Technology Stack

| Layer | Technology |
|---|---|
| **Frontend** | Next.js 15, React 19, TypeScript, Tailwind CSS 4, Framer Motion |
| **Backend API** | Next.js API Routes, NextAuth v4 |
| **Database** | PostgreSQL 16, Prisma 6 ORM |
| **Queue System** | BullMQ 5, ioredis, Upstash Redis |
| **AI Memory** | Cognee Cloud (graph-vector hybrid) |
| **GitHub Integration** | GitHub App (Webhooks + OAuth) |
| **Authentication** | NextAuth (GitHub OAuth, Google OAuth, Email/Password) |
| **Deployment** | Vercel (frontend) + Render (worker) + Docker |
| **Monitoring** | PostHog, Sentry |

---

## 🚀 Quick Start (Local Development)

### Prerequisites
- Node.js 20+
- Docker Desktop
- A GitHub App ([create one here](https://github.com/settings/apps/new))
- A [Cognee Cloud](https://cognee.ai) account

### 1. Clone & Install

```bash
git clone https://github.com/AliRana30/MaintainerMind.git
cd MaintainerMind
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env
# Fill in your values — see .env.example for all required variables
```

Key variables:

```env
# Database & Queue
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maintainermind"
REDIS_URL="redis://localhost:6379"

# Cognee (required)
COGNEE_BASE_URL="https://your-tenant.aws.cognee.ai"
COGNEE_API_KEY="your-cognee-api-key"

# GitHub App (required for repo sync)
GITHUB_APP_ID="your-app-id"
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="your-webhook-secret"
GITHUB_CLIENT_ID="your-oauth-client-id"
GITHUB_CLIENT_SECRET="your-oauth-client-secret"

# Auth
NEXTAUTH_SECRET="generate-with-openssl-rand-base64-32"
NEXTAUTH_URL="http://localhost:3000"

# Google OAuth (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"
```

### 3. Start Infrastructure

```bash
# Start PostgreSQL + Redis via Docker
docker compose up -d postgres redis

# Run database migrations
npx prisma migrate dev

# (Optional) Seed demo data
npm run seed
```

### 4. Start Services

```bash
# Terminal 1: Background worker (BullMQ job processor)
npm run worker

# Terminal 2: Next.js dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → Sign up → Connect a GitHub repository → Watch the memory build.

### 5. Full Docker (All-in-One)

```bash
# Starts postgres + redis + worker in Docker
docker compose up --build

# First run only — migrate the database
docker compose exec worker npx prisma migrate deploy

# Run Next.js outside Docker for hot reload
npm run dev
```

---

## 📁 Project Structure

```
src/
├── app/
│   ├── (marketing)/        # Landing page with features & architecture sections
│   ├── (dashboard)/        # Main app — repos, chat, memory, PR insights
│   ├── api/
│   │   ├── auth/           # NextAuth + register + forgot-password + reset-password
│   │   ├── repos/          # Repository CRUD + disconnect
│   │   ├── chat/           # AI chat session management
│   │   ├── github/         # App install callback
│   │   ├── memory/         # forget() + feedback
│   │   └── webhooks/       # GitHub event ingestion
│   ├── login/              # Sign in with GitHub/Google/email
│   ├── signup/             # 3-step onboarding flow
│   └── forgot-password/    # Full password recovery flow
├── components/
│   ├── layout/             # MarketingNavbar, DashboardHeader
│   ├── auth/               # AuthVisual, shared auth UI
│   └── ui/                 # Reusable components
├── lib/
│   ├── cognee-client.ts    # Cognee API wrapper with circuit breaker
│   ├── auth-options.ts     # NextAuth providers config
│   ├── redis.ts            # ioredis + Upstash fallback
│   └── github.ts           # Octokit helpers, formatters
└── server/
    ├── workers/
    │   ├── ingestion.worker.ts   # Webhook → Cognee remember()
    │   ├── embedding.worker.ts   # Cognee improve()
    │   ├── enrichment.worker.ts  # Scheduled graph enrichment
    │   ├── repo-backfill.ts      # Initial PR/issue/commit sync
    │   └── worker-registry.ts    # Process entry point
    ├── queues.ts                 # BullMQ queue definitions
    └── services/
        └── memory.service.ts     # GitHub content → Cognee memory
```

---

## 🌐 Production Deployment

### Vercel (Frontend + API Routes)

1. Import repo on [vercel.com](https://vercel.com)
2. Set **Build Command**: `prisma generate && next build`
3. Add all environment variables (see `.env.example`)
4. Set `NEXTAUTH_URL` to your Vercel domain
5. Update GitHub OAuth callback: `https://your-app.vercel.app/api/auth/callback/github`
6. Update Google OAuth redirect: `https://your-app.vercel.app/api/auth/callback/google`
7. Set GitHub App webhook URL: `https://your-app.vercel.app/api/webhooks/github`
8. Run migrations: `DATABASE_URL=prod_url npx prisma migrate deploy`

### Render (Background Worker)

1. New Web Service → Docker environment
2. Connect same GitHub repo
3. Set environment variables (DATABASE_URL, REDIS_URL, COGNEE_*)
4. Start command: `node_modules/.bin/tsx src/server/workers/worker-registry.ts`

Both services share the same **Upstash Redis** and **PostgreSQL** — Vercel enqueues jobs, Render processes them.

---

## 🔗 Resources

- **Cognee Repository**: [github.com/topoteretes/cognee](https://github.com/topoteretes/cognee)
- **Cognee Documentation**: [docs.cognee.ai](https://docs.cognee.ai)
- **Cognee Website**: [cognee.ai](https://cognee.ai)

---

<div align="center">

**Built for the Cognee Hackathon** · Made by Ali Mahmood

*MaintainerMind — Because repositories shouldn't have amnesia.*

</div>