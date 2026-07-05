# MaintainerMind

**Long-term cognitive memory for open source repositories.**

MaintainerMind gives GitHub repositories persistent institutional knowledge. Every pull request, commit, issue, discussion, and architectural decision is continuously ingested into a semantic knowledge graph that can be queried at any time by maintainers, by AI agents, and by the review pipeline itself.

When a new pull request opens, MaintainerMind recalls previous implementation decisions, similar bugs, related files, rejected approaches, and architectural discussions before the maintainer reads a single line of diff.

Built for the [WeMakeDevs x Cognee Hackathon](https://www.wemakedevs.org/hackathons/cognee), June-July 2026.

---

## The Problem

AI-assisted coding has dramatically accelerated pull request volume. Repositories now receive hundreds of contributions per week. The review bottleneck has not moved it has gotten worse.

Institutional knowledge lives inside merged pull requests, commit messages, closed issues, code review threads, and architectural discussions. As repositories grow, this knowledge becomes progressively harder to recover. Maintainers spend significant time re-explaining decisions that were already made, triaging duplicate issues, and reviewing code that repeats known mistakes.

MaintainerMind treats this as a memory problem and solves it at the infrastructure level.

---

## Solution

MaintainerMind listens to GitHub webhooks. Every repository event is processed through a background queue and stored in Cognee Cloud as a structured knowledge graph node. Each node carries typed metadata - PR outcome, files affected, author, timestamp, architectural category - and is linked to related nodes across the graph.

When a new pull request opens, the system performs semantic recall against this graph and surfaces relevant historical context: similar PRs, prior decisions on affected files, previously rejected approaches, and known regressions. Maintainers receive this context before they begin review.

The knowledge graph is queryable at any time through the AI chat interface, the PR insights panel, and the knowledge graph explorer.

---

## How Cognee Powers MaintainerMind

MaintainerMind uses all four Cognee memory operations across the full application lifecycle.

### remember()

Every GitHub webhook event is converted into a typed graph node and stored via `remember()`, scoped to a per-repository dataset:

```
dataset = "repo:{owner}/{name}"
```

Node types include pull requests, commits, issues, discussions, documentation, and release notes. Each node carries structured metadata (type, date, author, files affected, outcome) and is linked to related nodes by Cognee's graph engine.

Processing runs in the background. MaintainerMind polls dataset status until indexing completes before marking a repository as searchable.

**Codebase reference:**
- API Endpoint - `src/app/api/repos/route.ts`
- Background Ingestion Worker - `src/server/workers/embedding.worker.ts`
- Service Handler - `rememberGitHubContent()` in `src/server/services/memory.service.ts`

### recall()

Semantic retrieval powers every query surface in the application:

- AI chat interface (conversational, session-scoped)
- PR context suggestions (triggered on PR open webhook)
- Repository search
- Historical decision lookup
- Knowledge graph explorer

Two retrieval strategies are used depending on context:

- `GRAPH_COMPLETION` - for relationship traversal queries ("what decisions were made about authentication?")
- `CHUNKS` - for fast similarity retrieval against raw content

Session IDs preserve conversational context across multi-turn chat.

**Codebase reference:**
- Graph Recall Path API - `src/app/api/repos/[repoId]/graph/recall/route.ts`
- Chat Stream API - `src/app/api/chat/[sessionId]/message/route.ts`
- Service Handler - `recallForPR()` / `recallForChat()` in `src/server/services/memory.service.ts`

### improve()

Graph enrichment runs post-ingestion and on demand. Maintainers can trigger `improve()` from the Memory Evolution dashboard to re-weight entity relationships, rebuild semantic links, and improve retrieval accuracy over time. The Memory Quality Score on the dashboard reflects the real output of this operation - it is computed from recall accuracy (helpful/not-helpful feedback ratio), node freshness, and file coverage.

**Codebase reference:**
- API Endpoint - `src/app/api/repos/[repoId]/pr-insights/feedback/route.ts`
- Service Handler - `triggerImprove()` in `src/server/services/memory.service.ts`

### forget()

Large refactors can invalidate historical knowledge. Rather than deleting entire datasets, `forget()` removes stale node epochs while preserving raw repository data. This prevents obsolete architecture from influencing future AI responses. The Memory Evolution dashboard shows the last prune timestamp and nodes removed.

**Codebase reference:**
- API Endpoint - `src/app/api/memory/forget/route.ts`
- Service Handler - `pruneDataset()` in `src/server/services/memory.service.ts`

---

## Knowledge Graph Structure

Cognee builds a semantic graph connecting entities across the repository. This allows MaintainerMind to answer questions that keyword search cannot - understanding relationships between events, not just textual similarity.

```mermaid
graph LR
    Issue -->|requested| Commit
    Commit -->|modified| File
    File -->|reviewed in| PR
    PR -->|rejected approach| Decision
    Decision -->|informs| Issue2[Issue]
```

```mermaid
graph LR
    PR2[Pull Request] -->|touches| File2[File]
    File2 -->|has history in| Decision2[Decision]
    Decision2 -->|was made in| PR3[Past PR]
    PR3 -->|by| Contributor
```

---

## Architecture

```mermaid
graph TD
    subgraph Client [Client Tier]
        Dashboard[Web Dashboard]
        Chat[AI Chat Interface]
        PRPanel[PR Insights Panel]
    end

    subgraph API [API Tier - Vercel]
        WebhookRoute["Webhook API Route /api/webhooks/github"]
        AuthRoute["Auth API Routes /api/auth/*"]
        RepoRoute["Repo Management /api/repos/*"]
    end

    subgraph Queues [Queue Tier - Upstash Redis]
        BullMQ[(BullMQ Queues)]
    end

    subgraph Workers [Worker Tier - Render / Docker]
        Registry[Worker Registry]
        IngestWorker[Ingestion Worker]
        EmbedWorker[Embedding Worker]
        EnrichWorker[Enrichment Worker]
    end

    subgraph Storage [Data Tier]
        Postgres[(PostgreSQL / Prisma)]
        Cognee[(Cognee Cloud API / Knowledge Graph)]
    end

    GH[GitHub Repository] -->|Webhook Events| WebhookRoute
    WebhookRoute -->|"Validate & Enqueue"| BullMQ

    Registry -->|Spawns| IngestWorker
    Registry -->|Spawns| EmbedWorker
    Registry -->|Spawns| EnrichWorker

    BullMQ -->|Consume Jobs| IngestWorker
    BullMQ -->|Consume Jobs| EmbedWorker
    BullMQ -->|Consume Jobs| EnrichWorker

    IngestWorker -->|Persist Metadata| Postgres
    IngestWorker -->|"remember()"| Cognee

    EmbedWorker -->|"improve()"| Cognee
    EnrichWorker -->|"improve()"| Cognee

    Dashboard -->|Read Metadata| Postgres
    Dashboard -->|"forget() / recall()"| Cognee
    Chat -->|"recall() GRAPH_COMPLETION"| Cognee
    PRPanel -->|"recall() CHUNKS"| Cognee
```

---

## Feature Comparison

| Capability | Traditional Tools | MaintainerMind |
|---|---|---|
| Repository search | Keyword | Semantic graph |
| Historical context | Manual | Automatic |
| PR review assistance | Manual | AI context suggestions |
| Architectural memory | Lost over time | Persistent |
| Similar PR detection | No | Yes |
| Knowledge graph | No | Yes |
| Semantic relationships | No | Yes |
| Context-aware chat | Limited | Yes |
| Memory evolution | Static | improve() |
| Memory cleanup | Manual | forget() |

---

## Technology Stack

**Frontend** - Next.js 15, React 19, TypeScript, Tailwind CSS, Framer Motion, TanStack Query v5, Recharts, Lenis

**Backend** - Next.js API Routes, BullMQ, Redis, PostgreSQL, Prisma, Octokit

**AI Memory** - Cognee Cloud, OpenAI

**Auth** - Clerk, GitHub OAuth, Google OAuth, NextAuth.js

**Deployment** - Docker, Docker Compose, Vercel

---

## Local Development

### Prerequisites

- Node.js 20+
- Docker (for PostgreSQL and Redis)
- A Cognee Cloud account
- A GitHub App (setup guide below)

### 1. Clone and install

```bash
git clone https://github.com/AliRana30/maintainermind.git
cd maintainermind
npm install
```

### 2. Configure environment

```bash
cp .env.example .env.local
```

Fill in `.env.local`:

```env
# Database (Local)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maintainermind?schema=public"

# Database (Production / Supabase on Vercel)
# IMPORTANT: When deploying to Vercel with Supabase, you MUST use the Transaction pooler URL (port 6543)
# and append ?pgbouncer=true&connection_limit=1 to prevent Prisma 500 connection errors.
# DATABASE_URL="postgresql://postgres.your_project:YOUR_PASSWORD@aws-0-region.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1"

# Redis
REDIS_URL="redis://localhost:6379"
UPSTASH_REDIS_REST_URL="https://your-upstash-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token_here"

# Cognee Cloud
COGNEE_BASE_URL="https://tenant-e49b36eb-62fb-48f3-a123-f5db20a69429.aws.cognee.ai"
COGNEE_API_KEY="your_cognee_api_key_here"

# GitHub App
GITHUB_APP_ID="your_github_app_id_here"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="your_webhook_secret_here"

# GitHub OAuth
GITHUB_CLIENT_ID="your_github_client_id_here"
GITHUB_CLIENT_SECRET="your_github_client_secret_here"

# Google OAuth
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"

# NextAuth
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# Clerk
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Monitoring (optional)
SENTRY_DSN="https://your_sentry_dsn_here"
NEXT_PUBLIC_POSTHOG_KEY="phc_..."
```

### 3. Start infrastructure

```bash
docker compose up -d
```

### 4. Run migrations and seed

```bash
npx prisma migrate dev
npm run seed
```

### 5. Start the worker and dev server

```bash
# Terminal 1 - background job worker
npm run worker

# Terminal 2 - Next.js dev server
npm run dev
```

Open http://localhost:3000.

### Troubleshooting: Repositories Stuck in "SYNCING"

If your repositories are stuck in a continuous "SYNCING" state on the dashboard, it means your background worker is either not running or failing to connect to your Upstash Redis queue. 

**Fix 1: Configure Redis for the Worker**
1. Check your `.env` file. If `REDIS_URL` is set to `redis://localhost:6379`, your worker is trying to connect to a local Redis instance.
2. If you are using Upstash in production, go to your Upstash Redis dashboard, scroll to **Endpoints**, and copy the **Node (ioredis)** connection string (it looks like `rediss://default:YOUR_PASSWORD@your-url.upstash.io:PORT`).
3. Replace `REDIS_URL` in your `.env` with that `rediss://` string.
4. Restart your worker (`npm run worker`). It will immediately connect to the cloud queue and process the stuck repositories.

**Fix 2: Force Reset the Status**
If you just want to clear the "SYNCING" status from the UI:
- **Production Environment**: Go to the **Settings** page in your dashboard, locate the repository under the "Connected Repositories" section, and click the **Force Reset** button.
- **Local Development**: Run `npx prisma studio`, open the `Repository` table, and manually change the `syncStatus` from `SYNCING` to `FAILED` or `SYNCED`.

### Optional: run Cognee locally

```bash
git clone https://github.com/topoteretes/cognee
cd cognee
pip install -e .
cognee server
```

Then set `COGNEE_BASE_URL=http://localhost:8000` in your `.env.local`.

---

## GitHub App Setup

MaintainerMind requires a GitHub App (not a plain OAuth App) to receive webhook events and access repository data.

1. Go to **GitHub Settings -> Developer settings -> GitHub Apps -> New GitHub App**
2. Set the webhook URL to `https://your-domain.com/api/webhooks/github`
3. Generate a webhook secret and copy it to `GITHUB_WEBHOOK_SECRET`
4. Set these repository permissions: Contents (read), Issues (read), Pull requests (read), Metadata (read)
5. Subscribe to these webhook events: `pull_request`, `issues`, `push`, `issue_comment`, `pull_request_review`
6. After creating the app, generate a private key and copy the contents to `GITHUB_APP_PRIVATE_KEY`
7. Copy the App ID to `GITHUB_APP_ID`

---

## Project Structure

```
├── prisma/               Prisma database schema and migrations
├── public/               Static assets
├── scripts/              Database seed scripts
└── src/
    ├── app/              Next.js Pages, Routing, and API routes
    ├── components/       React UI components
    ├── env.ts            Environment variables validation and configuration
    ├── features/         Feature-specific modules (e.g., Knowledge Graph visualizer)
    ├── lib/              Helper client libraries (Cognee, GitHub App rest, auth options)
    ├── middleware.ts     NextAuth request routing middleware
    ├── registry/         Reusable styling components registry (e.g., MagicUI elements)
    ├── server/           Backend services, workers, queues, and jobs
    │   ├── workers/      Background BullMQ workers for ingestion, embedding, and enrichment
    │   ├── queues/       BullMQ queue definitions
    │   ├── services/     Business services (repository sync, memory management, user management)
    │   └── jobs/         Specific background job handlers
    └── types/            Global TypeScript declarations
```

---

## Resources

- [Cognee repository](https://github.com/topoteretes/cognee)
- [Cognee documentation](https://docs.cognee.ai)
- [WeMakeDevs x Cognee Hackathon](https://www.wemakedevs.org/hackathons/cognee)

---

## AI Tools Used
- **Antigravity**: for helping me in building this project
- **Cognee**: a Knowledge Graph Memory Platform
- **Claude Sonnet 4.5**: for generation of images and other assets

## Author

Ali Rana - [AliRana30](https://github.com/AliRana30)

*Built for the WeMakeDevs x Cognee Hackathon, June-July 2026.*