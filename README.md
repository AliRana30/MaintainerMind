# MaintainerMind

**Long-Term Cognitive Memory Layer for Open Source Repositories**

MaintainerMind is an intelligent repository assistant that gives GitHub repositories long-term memory. Instead of treating every pull request as an isolated event, it continuously learns from commits, pull requests, issues, discussions, code reviews, and architectural decisions to build a persistent knowledge graph that can be queried at any time.

Modern open-source maintainers spend a significant amount of time repeating the same explanations during code reviews. Architectural decisions are buried inside months-old pull requests, issues are closed without preserving their reasoning, and new contributors unknowingly repeat mistakes that have already been solved. As repositories grow, this institutional knowledge becomes increasingly difficult to recover.

MaintainerMind solves this by continuously syncing repository activity into Cognee Cloud, transforming historical development data into a structured memory layer that AI agents can reason over. When a new pull request is opened, the system recalls previous implementation decisions, similar bugs, related files, rejected approaches, and architectural discussions before the maintainer even begins the review.

Instead of asking:  
**"Has this problem been solved before?"**  
MaintainerMind already knows the answer.

## The Problem

Open source has changed dramatically with the rise of AI-assisted coding. Developers can generate pull requests within minutes, dramatically increasing repository activity. While this accelerates contribution, it also creates a new bottleneck:

- Hundreds of repetitive pull requests
- Duplicated issues
- Forgotten architectural decisions
- Maintainers repeatedly explaining the same concepts
- Context disappearing after issues and PRs are closed

Eventually repositories lose their institutional memory.

Knowledge exists...

- Inside merged pull requests
- Inside commit messages
- Inside discussions
- Inside issue comments
- Inside documentation
- Inside code reviews

...but nobody can efficiently retrieve it.

MaintainerMind transforms all of this into searchable long-term memory.

## Solution

MaintainerMind automatically listens to GitHub webhooks. Every important repository event is processed through a background queue and sent into Cognee Cloud.

The system continuously builds a semantic knowledge graph containing relationships between:

- Pull Requests
- Commits
- Issues
- Files
- Contributors
- Discussions
- Repository Decisions

Whenever someone opens a new Pull Request, MaintainerMind performs semantic recall against this knowledge graph and generates contextual insights such as:

- Similar historical pull requests
- Previous implementation decisions
- Related files
- Potential regressions
- Architectural conflicts
- Previously rejected solutions

Instead of manually remembering months of repository history, maintainers receive relevant context automatically.

## How Cognee Powers MaintainerMind

MaintainerMind uses Cognee Cloud as its cognitive memory engine. Unlike a traditional vector database that retrieves isolated chunks of text, Cognee builds a semantic graph connecting entities across the repository. This allows the application to understand relationships rather than just similarity.

For example:

```text
┌─────────┐             ┌──────────┐             ┌────────┐             ┌──────────────┐
│  Issue  │ ──requested──>│  Commit  │ ──modified──>│  File  │ ──reviewed in──>│ Pull Request │
└─────────┘             └──────────┘             └────────┘             └──────────────┘
```

Or visualized as a relationship chain:

```mermaid
graph LR
    classDef entity fill:#6E56F2,stroke:#30363d,color:#fff,font-weight:bold;
    classDef rel fill:#F0ECF5,stroke:#E4E1EC,color:#1C1B1F;

    Issue[Issue] -->|requested| Commit[Commit]
    Commit -->|modified| File[File]
    File -->|reviewed in| PR[Pull Request]

    class Issue,Commit,File,PR entity;
```

These relationships allow MaintainerMind to answer questions that keyword search cannot.

### Cognee Features Used

MaintainerMind implements the complete Cognee memory lifecycle.

**remember()**  
Every GitHub event is automatically converted into repository memory. Examples include:

- Pull Requests
- Issues
- Commits
- Discussions
- Documentation
- Release Notes

Each repository receives its own isolated dataset.
Repository
↓
remember()
↓
Cognee Dataset
↓
Knowledge Graph


**Dataset Status Monitoring**  
Since processing happens asynchronously, MaintainerMind continuously checks processing status until the dataset has finished indexing. Only after indexing completes does the repository become searchable.

**recall()**  
Whenever maintainers search the repository or a new PR is opened, MaintainerMind performs semantic retrieval. This powers:

- AI Chat
- PR Context Suggestions
- Repository Search
- Historical Decision Lookup
- Similar Pull Requests

Different retrieval strategies are used depending on the query:

- GRAPH_COMPLETION
- CHUNKS

Session IDs preserve conversational memory across chats.

**improve()**  
Repository knowledge evolves over time. Maintainers can trigger graph optimization to:

- Improve entity relationships
- Rebuild graph quality
- Enhance retrieval accuracy
- Improve semantic links

This powers the Memory Health dashboard.

**forget()**  
Large refactors can invalidate historical knowledge. Instead of deleting datasets, MaintainerMind selectively removes outdated graph memory while preserving raw repository data. This prevents obsolete architecture from influencing future AI responses.

## Traditional Tools vs MaintainerMind

| Feature                        | Traditional Repository Tools | MaintainerMind              |
|--------------------------------|------------------------------|-----------------------------|
| Repository Search              | Keyword Search               | Semantic Graph Search       |
| Historical Context             | Manual                       | Automatic                   |
| Pull Request Review            | Manual                       | AI Context Assistance       |
| Architectural Memory           | Lost Over Time               | Persistent                  |
| Similar PR Detection           | No                           | Yes                         |
| Repository Knowledge Graph     | No                           | Yes                         |
| Semantic Relationships         | No                           | Yes                         |
| Context-Aware AI Chat          | Limited                      | Yes                         |
| Memory Evolution               | Static                       | improve()                   |
| Memory Cleanup                 | Manual                       | forget()                    |
| Long-Term Repository Memory    | No                           | Yes                         |

## Architecture

```mermaid
graph TD
    %% Styling
    classDef main fill:#6E56F2,stroke:#fff,stroke-width:2px,color:#fff;
    classDef worker fill:#D78B00,stroke:#fff,stroke-width:1px,color:#fff;
    classDef db fill:#0091EA,stroke:#fff,stroke-width:1px,color:#fff;
    classDef ext fill:#79747E,stroke:#fff,stroke-width:1px,color:#fff;

    subgraph GitHub Integration
        GH[GitHub Repository] -->|Webhooks| API[Next.js API Routes]
    end

    subgraph Processing Pipeline
        API -->|Enqueue Jobs| Queue[(BullMQ Redis Queue)]
        Queue -->|Consume| Worker[Background Workers]
        Worker -->|Ingest / sync| DB[(PostgreSQL Database)]
    end

    subgraph Cognitive Layer
        Worker -->|"remember()"| Cognee[Cognee Cloud API]
        Cognee -->|Constructs| KG[(Knowledge Graph)]
    end

    subgraph Client Application
        Dashboard[Web Dashboard] -->|Query Stats| DB
        Dashboard -->|"recall()"| Cognee
        Chat[AI Chat Interface] -->|"recall() / GRAPH_COMPLETION"| Cognee
        PR[PR Context Suggestions] -->|"recall()"| Cognee
    end

    class GH,Cognee ext;
    class API,Dashboard,Chat,PR main;
    class Worker worker;
    class Queue,DB,KG db;
```

## Technology Stack

### Frontend
- Next.js 15
- React 19
- TypeScript
- TailwindCSS
- Framer Motion

### Backend
- Next.js API Routes
- BullMQ
- Redis
- PostgreSQL
- Prisma

### AI Memory
- Cognee Cloud
- OpenAI
- Knowledge Graph Retrieval

### Authentication
- Clerk
- GitHub OAuth

### Deployment
- Docker
- Docker Compose

## Local Development

### Clone Repository
```bash
git clone https://github.com/yourusername/maintainermind.git
cd maintainermind
```

### Install Dependencies
```bash
npm install
```

### Environment Variables
```bash
cp .env.example .env
```

### Configure

Create .env with the following content (update the placeholder values):

```env
# PostgreSQL connection string (Prisma compatible)
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/maintainermind?schema=public"

# Redis connection string (ioredis and BullMQ compatible)
REDIS_URL="redis://localhost:6379"

# Cognee API (Knowledge Graph Memory Platform)
COGNEE_BASE_URL=https://tenant-e49b36eb-62fb-48f3-a123-f5db20a69429.aws.cognee.ai
COGNEE_API_KEY=your_api_key_here

# GitHub App credentials
GITHUB_APP_ID="your_github_app_id_here"
GITHUB_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_APP_PRIVATE_KEY="-----BEGIN RSA PRIVATE KEY-----\n...\n-----END RSA PRIVATE KEY-----"
GITHUB_WEBHOOK_SECRET="your_github_webhook_secret_here"

# OAuth Credentials for GitHub Login / Repository Access
GITHUB_CLIENT_ID="your_github_client_id_here"
GITHUB_CLIENT_SECRET="your_github_client_secret_here"

# OAuth Credentials for Google Login
GOOGLE_CLIENT_ID="your_google_client_id_here"
GOOGLE_CLIENT_SECRET="your_google_client_secret_here"

# NextAuth
NEXTAUTH_SECRET="your_nextauth_secret_here"
NEXTAUTH_URL="http://localhost:3000"

# Clerk Authentication
# Get your keys from: dashboard.clerk.com
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="pk_test_..."
CLERK_SECRET_KEY="sk_test_..."

# Monitoring & Telemetry
# Sentry DSN for error reporting
SENTRY_DSN="https://your_sentry_dsn_here"

# PostHog API Key for product analytics
NEXT_PUBLIC_POSTHOG_KEY="phc_..."

UPSTASH_REDIS_REST_URL="https://your-upstash-url.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your_upstash_token_here"
RAILWAY_TOKEN=
VERCEL_TOKEN=
VERCEL_ORG_ID=
VERCEL_PROJECT_ID=
```


### Start Docker Services
```bash
docker compose up -d
```

### Run Database Migrations and Seed
```bash
npx prisma migrate dev
npm run seed
```

### Start Queue Worker
```bash
npm run worker
```

### Start Development Server
```bash
npm run dev
```

### Optional: Run Cognee Locally
If you'd like to use a local Cognee instance instead of Cognee Cloud:
```bash
git clone https://github.com/topoteretes/cognee
cd cognee
pip install -e .
cognee server
```

Then update COGNEE_BASE_URL=http://localhost:8000 in your .env file.

### Project Structure
```text
src/
 ├── app/
 ├── components/
 ├── lib/
 ├── workers/
 ├── services/
 ├── hooks/
 ├── types/
 ├── prisma/
 └── api/
```


### Official Cognee Resources

### Repository: 
https://github.com/topoteretes/cognee

### Documentation: 
https://docs.cognee.ai

### Website: 
https://cognee.ai

### Made by
Ali Mahmood