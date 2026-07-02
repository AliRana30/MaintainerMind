import {
  PrismaClient,
  OrgPlan,
  SyncStatus,
  ProcessingStatus,
  FeedbackRating,
  MessageRole,
} from ".prisma/client/index";

const prisma = new PrismaClient();

function subDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setDate(result.getDate() - days);
  return result;
}

async function main() {
  console.log("Cleaning database...");
  await prisma.auditLog.deleteMany({});
  await prisma.webhookEvent.deleteMany({});
  await prisma.chatMessage.deleteMany({});
  await prisma.chatSession.deleteMany({});
  await prisma.memoryFeedback.deleteMany({});
  await prisma.commit.deleteMany({});
  await prisma.issue.deleteMany({});
  await prisma.pullRequest.deleteMany({});
  await prisma.dataset.deleteMany({});
  await prisma.repository.deleteMany({});
  await prisma.apiKey.deleteMany({});
  await prisma.organization.deleteMany({});
  await prisma.user.deleteMany({});

  console.log("Seeding demo data...");

  const now = new Date();

  // 1. Demo User
  const demoUser = await prisma.user.create({
    data: {
      clerkId: "user_2demo1234567890abcdef",
      email: "maintainer@cognee.ai",
      name: "Tasos Kakouris",
      avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=100&q=80",
      plan: OrgPlan.PRO,
    },
  });

  // 2. 1 Organization
  const org = await prisma.organization.create({
    data: {
      name: "Cognee Community",
      githubOrgId: "org_987654321",
      plan: OrgPlan.PRO,
      ownerId: demoUser.id,
    },
  });

  // 3. 1 Repository
  const repo = await prisma.repository.create({
    data: {
      orgId: org.id,
      owner: "cognee",
      name: "cognee",
      fullName: "cognee/cognee",
      githubRepoId: "repo_11223344",
      defaultBranch: "main",
      datasetName: "repo:cognee/cognee",
      syncStatus: SyncStatus.SYNCED,
      memoryScore: 87.0,
      githubInstallationId: "12345678",
      lastSyncAt: subDays(now, 1),
    },
  });

  // 4. 1 Dataset
  await prisma.dataset.create({
    data: {
      repoId: repo.id,
      cogneeName: "repo:cognee/cognee",
      nodeCount: 340,
      edgeCount: 892,
      qualityScore: 87.0,
      processingStatus: ProcessingStatus.COMPLETED,
      lastImprovedAt: subDays(now, 2),
    },
  });

  // 5. 25 Pull Requests spanning 6 months
  const authors = ["mtinte", "anu-ushya", "vasilije-sinik", "tasoskakour"];
  const prsData = [
    {
      title: "feat: add session_id parameter to recall() endpoint",
      state: "MERGED",
      author: "mtinte",
      daysAgo: 170,
      files: ["src/api/recall.ts", "src/lib/cognee-client.ts"],
    },
    {
      title: "fix: background cognify not updating dataset status correctly",
      state: "MERGED",
      author: "anu-ushya",
      daysAgo: 160,
      files: ["src/server/workers/ingestion.worker.ts"],
    },
    {
      title: "refactor: replace synchronous ingestion with BullMQ worker pipeline",
      state: "MERGED",
      author: "tasoskakour",
      daysAgo: 152,
      files: ["src/server/queues/index.ts", "src/lib/queue.ts"],
    },
    {
      title: "feat: implement per-dataset isolation for multi-tenant deployments",
      state: "MERGED",
      author: "vasilije-sinik",
      daysAgo: 145,
      files: ["src/lib/cognee-client.ts", "prisma/schema.prisma"],
    },
    {
      title: "fix: GRAPH_COMPLETION returning empty results after remember() timeout",
      state: "MERGED",
      author: "mtinte",
      daysAgo: 138,
      files: ["src/server/services/memory.service.ts"],
    },
    {
      title: "feat: add memoryOnly flag to forget() endpoint",
      state: "MERGED",
      author: "tasoskakour",
      daysAgo: 130,
      files: ["src/lib/cognee-client.ts", "src/api/forget.ts"],
    },
    {
      title: "perf: cache recall() results in Redis with 5-minute TTL",
      state: "MERGED",
      author: "anu-ushya",
      daysAgo: 121,
      files: ["src/lib/redis.ts", "src/api/recall.ts"],
    },
    {
      title: "fix: datasetName vs dataset_name inconsistency in improve() handler",
      state: "MERGED",
      author: "vasilije-sinik",
      daysAgo: 110,
      files: ["src/app/api/repos/[repoId]/memory/improve/route.ts"],
    },
    {
      title: "feat: export dataset as Markdown via /activity/export endpoint",
      state: "MERGED",
      author: "mtinte",
      daysAgo: 101,
      files: ["src/api/export.ts"],
    },
    {
      title: "docs: add OpenAPI spec for remember, recall, improve, forget",
      state: "MERGED",
      author: "tasoskakour",
      daysAgo: 92,
      files: ["README.md", "openapi.yaml"],
    },
    {
      title: "feat: integrate vector index support for Agentic completion mode",
      state: "MERGED",
      author: "anu-ushya",
      daysAgo: 85,
      files: ["src/lib/cognee-client.ts"],
    },
    {
      title: "fix: parallel chunk ingestion exceeding pgvector connection pool limit",
      state: "MERGED",
      author: "vasilije-sinik",
      daysAgo: 77,
      files: ["src/lib/prisma.ts"],
    },
    {
      title: "refactor: simplify layout logic for memory evolution page",
      state: "MERGED",
      author: "tasoskakour",
      daysAgo: 68,
      files: ["src/app/(dashboard)/layout.tsx"],
    },
    {
      title: "fix: token limits for OpenAI embedding api calls during cognify process",
      state: "MERGED",
      author: "mtinte",
      daysAgo: 60,
      files: ["src/server/workers/embedding.worker.ts"],
    },
    {
      title: "feat: add local Ollama support for offline recall testing",
      state: "MERGED",
      author: "anu-ushya",
      daysAgo: 52,
      files: ["src/lib/cognee-client.ts", "src/lib/cache.ts"],
    },
    {
      title: "perf: optimize triplet extraction pipeline with system prompt overrides",
      state: "MERGED",
      author: "vasilije-sinik",
      daysAgo: 45,
      files: ["src/server/workers/ingestion.worker.ts"],
    },
    {
      title: "fix: unhandled exception when deleting non-existent graph nodes",
      state: "MERGED",
      author: "tasoskakour",
      daysAgo: 38,
      files: ["src/server/services/memory.service.ts"],
    },
    {
      title: "feat: add filterBySource options in REST recall endpoint parameters",
      state: "MERGED",
      author: "mtinte",
      daysAgo: 30,
      files: ["src/api/recall.ts"],
    },
    {
      title: "docs: add architecture guidelines diagram to project readme",
      state: "MERGED",
      author: "tasoskakour",
      daysAgo: 22,
      files: ["README.md"],
    },
    {
      title: "fix: clerk login redirects failing on multi-domain layout settings",
      state: "MERGED",
      author: "anu-ushya",
      daysAgo: 15,
      files: ["src/middleware.ts"],
    },
    {
      title: "refactor: migrate prisma schemas and enable cascading deletes",
      state: "MERGED",
      author: "vasilije-sinik",
      daysAgo: 10,
      files: ["prisma/schema.prisma"],
    },
    {
      title: "feat: add SSE real-time sync stream for background worker processes",
      state: "OPEN",
      author: "mtinte",
      daysAgo: 6,
      files: ["src/app/api/notifications/stream/route.ts"],
    },
    {
      title: "fix: prevent redundant state invalidation triggers in overview page",
      state: "OPEN",
      author: "anu-ushya",
      daysAgo: 4,
      files: ["src/app/(dashboard)/dashboard/page.tsx"],
    },
    {
      title: "feat: add unread count badge and active repo links in topbar",
      state: "OPEN",
      author: "tasoskakour",
      daysAgo: 2,
      files: ["src/components/layout/DashboardHeader.tsx"],
    },
    {
      title: "perf: reduce payload sizes for active repository metadata queries",
      state: "CLOSED",
      author: "vasilije-sinik",
      daysAgo: 12,
      files: ["src/app/api/dashboard/stats/route.ts"],
    },
  ];

  for (let i = 0; i < prsData.length; i++) {
    const pr = prsData[i];
    const createdDate = subDays(now, pr.daysAgo);
    await prisma.pullRequest.create({
      data: {
        repoId: repo.id,
        githubPrNumber: i + 1,
        title: pr.title,
        body: `Resolves context queries regarding ${pr.title}. Tested locally against live datasets.`,
        state: pr.state,
        authorLogin: pr.author,
        filesAffected: pr.files,
        labels: pr.state === "MERGED" ? ["automerge", "memory-update"] : ["needs-review"],
        createdAt: createdDate,
        updatedAt: pr.state !== "OPEN" ? subDays(createdDate, -2) : createdDate,
        mergedAt: pr.state === "MERGED" ? subDays(createdDate, -1) : null,
        closedAt: pr.state === "CLOSED" ? subDays(createdDate, -1) : null,
      },
    });
  }

  // 6. 15 Issues
  const issuesData = [
    { title: "Ingestion memory leaks on large codebase imports", state: "CLOSED", daysAgo: 120 },
    { title: "Improve recall response relevance with agentic search fallback", state: "CLOSED", daysAgo: 112 },
    { title: "Triplet extraction fails on Python async function syntax", state: "CLOSED", daysAgo: 98 },
    { title: "Next.js hot reload causes local postgres connections to overflow", state: "CLOSED", daysAgo: 85 },
    { title: "BullMQ worker locks database when schema migrations run", state: "CLOSED", daysAgo: 72 },
    { title: "Add support for custom metadata mapping in remember()", state: "CLOSED", daysAgo: 61 },
    { title: "Graph database queries timing out on highly-connected nodes", state: "CLOSED", daysAgo: 50 },
    { title: "Webhook authentication checks failing during github event stream", state: "CLOSED", daysAgo: 40 },
    { title: "Sidebar component hides navigation buttons on small screens", state: "CLOSED", daysAgo: 32 },
    { title: "Search dropdown lists empty repositories on fresh organization load", state: "OPEN", daysAgo: 18 },
    { title: "Redis connection warnings logs during local docker runs", state: "OPEN", daysAgo: 14 },
    { title: "Enable search inside PR comments and decision files", state: "OPEN", daysAgo: 9 },
    { title: "Missing index on pull request githubPrNumber fields", state: "OPEN", daysAgo: 7 },
    { title: "Optimize cognee memory fresh bar transition timing", state: "OPEN", daysAgo: 4 },
    { title: "Rate limiter blocks legitimate webhook payloads during bulk push", state: "OPEN", daysAgo: 2 },
  ];

  for (let i = 0; i < issuesData.length; i++) {
    const issue = issuesData[i];
    await prisma.issue.create({
      data: {
        repoId: repo.id,
        githubIssueNumber: 100 + i + 1,
        title: issue.title,
        body: `Reported issue concerning: ${issue.title}. Reproducible on node environments.`,
        state: issue.state,
        labels: issue.state === "OPEN" ? ["bug", "priority-medium"] : ["resolved"],
        createdAt: subDays(now, issue.daysAgo),
        closedAt: issue.state === "CLOSED" ? subDays(now, issue.daysAgo - 4) : null,
      },
    });
  }

  // 7. 40 Commits
  const commitMessages = [
    "feat: add session_id recall parameter",
    "fix: background status checks on cognify",
    "refactor: introduce BullMQ queues",
    "feat: multi-tenant dataset isolation",
    "fix: remember timeout handling",
    "feat: memoryOnly flag for forget",
    "perf: add Redis query caching",
    "fix: match datasetName to dataset_name",
    "feat: export graph layout to Markdown",
    "docs: document REST memory actions",
    "feat: vector indexing for agentic mode",
    "fix: pgvector connection pool limits",
    "refactor: clean up dashboard header code",
    "fix: OpenAI embedding token count caps",
    "feat: local Ollama testing profile",
    "perf: refine triplet system prompt rules",
    "fix: missing exception handler on delete",
    "feat: support source filters in recall",
    "docs: add setup and guidelines",
    "fix: clerk redirect issues resolved",
    "refactor: db cascades and migrations",
    "feat: live notifications SSE streams",
    "fix: filter layout react key issues",
    "feat: unread counts and nav pill UI",
    "perf: select payload fields in stats",
    "chore: update package lock files",
    "test: verify ingestion pipeline states",
    "fix: typo in analytics task registry",
    "perf: pre-render graph metadata cards",
    "docs: fix typo in cognee API tutorial",
    "feat: active repository selection persistence",
    "fix: avoid duplicate sync triggers",
    "chore: update docker ignore rules",
    "refactor: extract constants in store.ts",
    "fix: user state flash on clerk load",
    "feat: support github context headers",
    "perf: parallel file ingest chunks",
    "fix: error page layout issues",
    "chore: cleanup unused devDependencies",
    "feat: custom theme options in settings",
  ];

  for (let i = 0; i < commitMessages.length; i++) {
    const msg = commitMessages[i];
    await prisma.commit.create({
      data: {
        repoId: repo.id,
        sha: `sha256_${Math.random().toString(36).substring(2, 10)}${Math.random().toString(36).substring(2, 10)}`,
        message: msg,
        authorLogin: authors[i % authors.length],
        filesChanged: ["src/lib/redis.ts", "package.json"],
        createdAt: subDays(now, 180 - i * 4.2),
      },
    });
  }

  // 8. 1 ChatSession with 6 ChatMessages
  const chatSession = await prisma.chatSession.create({
    data: {
      userId: demoUser.id,
      repoId: repo.id,
      cogneeSessionId: "session_cognee_demo_12345",
      createdAt: subDays(now, 3),
    },
  });

  const chatMessages = [
    {
      role: MessageRole.USER,
      content: "Why was synchronous ingestion removed from the pipeline?",
      citations: [],
    },
    {
      role: MessageRole.ASSISTANT,
      content: "Synchronous ingestion was removed because it blocked the main HTTP request-response cycle on large repository imports, causing gateway timeouts. It was replaced with an asynchronous BullMQ worker queue pipeline in PR #3 ('refactor: replace synchronous ingestion with BullMQ worker pipeline'), which processes file chunks in background worker threads, improving system reliability.",
      confidenceScore: 0.91,
      recallSource: "graph",
      citations: [
        {
          type: "pull_request",
          number: 3,
          title: "refactor: replace synchronous ingestion with BullMQ worker pipeline",
        },
      ],
    },
    {
      role: MessageRole.USER,
      content: "Show all decisions related to the recall() endpoint",
      citations: [],
    },
    {
      role: MessageRole.ASSISTANT,
      content: "The memory recall() endpoint has undergone several architectural changes:\n1. **Session Context Tracking** (PR #1): Added a `session_id` parameter to isolate recall scope across multiple conversation histories.\n2. **Response Cache Layer** (PR #7): Caches query lookups in Redis with a 5-minute TTL to reduce embedding API costs.\n3. **Source Filtering** (PR #18): Added `filterBySource` options to allow clients to restrict searches to either session-only context or graph memory records.",
      confidenceScore: 0.88,
      recallSource: "graph",
      citations: [
        { type: "pull_request", number: 1, title: "feat: add session_id parameter to recall() endpoint" },
        { type: "pull_request", number: 7, title: "perf: cache recall() results in Redis with 5-minute TTL" },
        { type: "pull_request", number: 18, title: "feat: add filterBySource options in recall parameter" },
      ],
    },
    {
      role: MessageRole.USER,
      content: "What was the reason for adding memoryOnly to forget()?",
      citations: [],
    },
    {
      role: MessageRole.ASSISTANT,
      content: "The `memoryOnly` parameter was added to the forget() endpoint in PR #6 ('feat: add memoryOnly flag to forget() endpoint'). This flag allows clients to clear graph nodes and context links from memory without deleting the underlying physical raw files from disk, which allows developers to easily re-cognify the codebase from scratch without re-uploading files.",
      confidenceScore: 0.85,
      recallSource: "graph",
      citations: [
        { type: "pull_request", number: 6, title: "feat: add memoryOnly flag to forget() endpoint" },
      ],
    },
  ];

  for (const msg of chatMessages) {
    await prisma.chatMessage.create({
      data: {
        sessionId: chatSession.id,
        role: msg.role,
        content: msg.content,
        citations: msg.citations,
        confidenceScore: msg.confidenceScore || null,
        recallSource: msg.recallSource || null,
      },
    });
  }

  // 9. 20 MemoryFeedback records (14 HELPFUL, 4 HIGHLY_RELEVANT, 2 NOT_HELPFUL)
  const feedbacks = [
    ...Array(14).fill(FeedbackRating.HELPFUL),
    ...Array(4).fill(FeedbackRating.HIGHLY_RELEVANT),
    ...Array(2).fill(FeedbackRating.NOT_HELPFUL),
  ];

  for (let i = 0; i < feedbacks.length; i++) {
    const rating = feedbacks[i];
    await prisma.memoryFeedback.create({
      data: {
        userId: demoUser.id,
        repoId: repo.id,
        recallQuery: "Querying codebase files and history",
        recallResults: [
          { source: "graph", kind: "Commit", text: "Commit info for search", score: 0.82 },
        ],
        rating,
        idempotencyKey: `feedback_idempotency_key_${i}_${Math.random().toString(36).substring(2, 8)}`,
        createdAt: subDays(now, 30 - i * 1.5),
      },
    });
  }

  // 10. 5 AuditLog entries
  const auditLogs = [
    { action: "IMPROVE", metadata: { scoreBefore: 55, scoreAfter: 61 } },
    { action: "IMPROVE", metadata: { scoreBefore: 61, scoreAfter: 72 } },
    { action: "IMPROVE", metadata: { scoreBefore: 72, scoreAfter: 79 } },
    { action: "IMPROVE", metadata: { scoreBefore: 79, scoreAfter: 84 } },
    { action: "IMPROVE", metadata: { scoreBefore: 84, scoreAfter: 87 } },
    { action: "FORGET", metadata: { nodesPrunedCount: 34 } },
  ];

  for (let i = 0; i < auditLogs.length; i++) {
    const log = auditLogs[i];
    await prisma.auditLog.create({
      data: {
        userId: demoUser.id,
        action: log.action,
        entityType: "dataset",
        entityId: repo.id,
        metadata: log.metadata,
        createdAt: subDays(now, 20 - i * 3),
      },
    });
  }

  console.log("✅ Demo data seeded. Start the app and visit /dashboard");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
