# Cognee Usage Audit & Mapping Checklist

This document confirms the implementation and integration of the required Cognee operations (`remember`, `recall`, `improve`, `forget`) across the MaintainerMind workspace, ensuring correct logical scoping to repositories via dataset naming conventions.

---

## 1. Dataset Scoping Format
All Cognee memory datasets are dynamically scoped and partitioned per-repository using the format:
`repo:{owner}/{name}` (e.g. `repo:cognee/cognee`). 
This guarantees logical boundary isolation of memories and avoids cross-tenant contamination.

---

## 2. Cognee Operations Mapping

### `cognee.remember()`
*Ingests and processes repository activity (PRs, issues, commits) to build the semantic graph.*
- [x] **Ingestion Pipeline Call Site:** Called in `src/server/workers/embedding.worker.ts` inside the `embeddingQueue` worker processing loop.
- [x] **Initial Repository Connection Call Site:** Called in `src/app/api/repos/route.ts` inside the POST handler when connecting a new repository, which immediately triggers indexing of initial repo events.
- [x] **Service Wrapper:** Wrapped via `rememberGitHubContent` in `src/server/services/memory.service.ts`.

### `cognee.recall()`
*Retrieves context-aware knowledge graph elements and historical context for chat synthesis or PR reviews.*
- [x] **PR Review Worker Call Site:** Called in `src/server/workers/notification.worker.ts` to fetch past decision history and matching issue context to format automated comments on GitHub PRs.
- [x] **PR Details Page Call Site:** Called in `src/app/api/repos/[repoId]/prs/[prNumber]/route.ts` to enrich the dashboard PR Insights details screen with related contextual notes.
- [x] **PR Insights Feed Call Site:** Called in `src/app/api/repos/[repoId]/pr-insights/route.ts` to batch-verify file path associations and calculate risk scores based on recall hits.
- [x] **Graph View Path Traversal Call Site:** Called in `src/app/api/repos/[repoId]/graph/recall/route.ts` to trace semantic recall pathways between nodes.
- [x] **Chat Interface Call Sites:** Called in `src/app/api/chat/[sessionId]/message/route.ts` and `src/app/api/chat/stream/route.ts` to inject retrieved graph completions into the active LLM context.
- [x] **Service Wrapper:** Wrapped via `recallForPR` and `recallForChat` in `src/server/services/memory.service.ts`.

### `cognee.improve()`
*Registers user feedback (thumbs up/down) to mutate/optimize semantic relevance.*
- [x] **Feedback Mutation Route:** Called in `src/app/api/repos/[repoId]/pr-insights/feedback/route.ts` which handles 👍/👎 button submissions from the Knowledge Graph details panel, PR Insights page, and Chat citation cards.
- [x] **Service Wrapper:** Wrapped via `triggerImprove` in `src/server/services/memory.service.ts` with Redis rate-limiting (`cognee:improve:limit:${datasetName}`) to prevent API abuse.

### `cognee.forget()`
*Prunes specific graph nodes or disconnects entire repository memories.*
- [x] **Forget Single Node Call Site:** Called in `src/app/api/memory/forget/route.ts` when a user chooses to "Forget this node" from the Knowledge Graph detail sidebar.
- [x] **Disconnect Repository Memory Call Site:** Called when disconnecting a repo.
- [x] **Service Wrapper:** Wrapped via `pruneDataset` in `src/server/services/memory.service.ts`, which calls `cogneeForget` and automatically flushes associated Redis cache keys to prevent stale hits.

### Autonomous enrichment lifecycle
*Runs scheduled post-ingestion enrichment, records prune history, and refreshes quality scores without user feedback triggers.*
- [x] **Scheduled worker:** `src/server/workers/enrichment.worker.ts` consumes the `enrichmentQueue` and runs `runRepoEnrichment()`.
- [x] **Recurring schedule:** `src/server/workers/worker-registry.ts` registers a 6-hour repeatable enrichment job.
- [x] **Backfill handoff:** `src/server/workers/repo-backfill.ts` queues an immediate enrichment pass after repository backfill completes.
- [x] **Manual trigger API:** `src/app/api/repos/[repoId]/enrichment/route.ts` enqueues an on-demand enrichment run.
- [x] **Status API:** `src/app/api/repos/[repoId]/enrichment-status/route.ts` exposes `lastEnrichedAt`, `lastEnrichmentStatus`, and the latest enrichment run.
- [x] **Stats source of truth:** `src/app/api/repos/[repoId]/memory/stats/route.ts` now reads `EnrichmentRun` and `PruneEvent` history for the Memory Evolution chart and prune summary.

### Validation notes
- [x] `npx prisma validate` passes after the enrichment schema changes.
- [x] `npx prisma generate --no-engine` succeeds on Windows after the native engine rename issue.
- [x] Targeted error checks on the touched backend files returned no new errors.
- [ ] Full end-to-end demo sequence was not live-executed here because the workspace still contains unrelated pre-existing TypeScript errors outside this task.
