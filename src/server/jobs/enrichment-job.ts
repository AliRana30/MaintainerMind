import { prisma } from "@/lib/prisma";
import { cogneeImprove, cogneeForget } from "@/lib/cognee-client";

const DEFAULT_STALE_DAYS = Number(process.env.ENRICHMENT_STALE_DAYS || 180);

export type EnrichmentTriggerSource = "scheduled" | "manual" | "backfill";

async function computeQualityScore(repoId: string): Promise<number> {
  const dataset = await prisma.dataset.findUnique({ where: { repoId } });
  if (!dataset) return 0;

  const feedbacks = await prisma.memoryFeedback.findMany({ where: { repoId } });
  const commitsCount = await prisma.commit.count({ where: { repoId } });

  let accuracy = 100;
  if (feedbacks.length > 0) {
    const helpfulCount = feedbacks.filter((feedback) => feedback.rating === "HELPFUL").length;
    accuracy = Math.round((helpfulCount / feedbacks.length) * 100);
  }

  const wAccuracy = accuracy * 0.5;
  const coverageRatio = commitsCount > 0 ? Math.min((dataset.nodeCount || 0) / (commitsCount * 3), 1) : 0;
  const wCoverage = coverageRatio * 100 * 0.3;
  const freshnessSource = dataset.updatedAt;
  const daysSinceUpdate = (Date.now() - new Date(freshnessSource).getTime()) / (1000 * 60 * 60 * 24);
  const freshnessRatio = Math.max(0, 1 - daysSinceUpdate / 30);
  const wFreshness = freshnessRatio * 100 * 0.2;

  return Math.max(0, Math.min(100, Math.round(wAccuracy + wCoverage + wFreshness)));
}

async function getStaleNodeIds(repoId: string) {
  const cutoff = new Date(Date.now() - DEFAULT_STALE_DAYS * 24 * 60 * 60 * 1000);
  const [pullRequests, issues, commits] = await Promise.all([
    prisma.pullRequest.findMany({
      where: {
        repoId,
        stale: false,
        recallHitCount: 0,
        feedbackCount: 0,
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    }),
    prisma.issue.findMany({
      where: {
        repoId,
        stale: false,
        recallHitCount: 0,
        feedbackCount: 0,
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    }),
    prisma.commit.findMany({
      where: {
        repoId,
        stale: false,
        recallHitCount: 0,
        feedbackCount: 0,
        createdAt: { lt: cutoff },
      },
      select: { id: true },
    }),
  ]);

  return [...pullRequests.map((record) => record.id), ...issues.map((record) => record.id), ...commits.map((record) => record.id)];
}

async function markStaleNodes(repoId: string, staleNodeIds: string[]) {
  if (staleNodeIds.length === 0) return;

  const now = new Date();
  await Promise.all([
    prisma.pullRequest.updateMany({ where: { repoId, id: { in: staleNodeIds } }, data: { stale: true, staleAt: now } }),
    prisma.issue.updateMany({ where: { repoId, id: { in: staleNodeIds } }, data: { stale: true, staleAt: now } }),
    prisma.commit.updateMany({ where: { repoId, id: { in: staleNodeIds } }, data: { stale: true, staleAt: now } }),
  ]);
}

export async function recordRecallHits(repoId: string, recalledNodeIds: string[]) {
  const uniqueIds = Array.from(new Set(recalledNodeIds.filter(Boolean)));
  if (uniqueIds.length === 0) return;

  const now = new Date();
  await Promise.all([
    prisma.pullRequest.updateMany({ where: { repoId, id: { in: uniqueIds } }, data: { recallHitCount: { increment: 1 }, lastRecalledAt: now } }),
    prisma.issue.updateMany({ where: { repoId, id: { in: uniqueIds } }, data: { recallHitCount: { increment: 1 }, lastRecalledAt: now } }),
    prisma.commit.updateMany({ where: { repoId, id: { in: uniqueIds } }, data: { recallHitCount: { increment: 1 }, lastRecalledAt: now } }),
  ]);
}

export async function recordFeedbackHit(repoId: string, nodeId: string, helpful: boolean) {
  const data = {
    feedbackCount: { increment: 1 },
    ...(helpful ? { helpfulFeedbackCount: { increment: 1 } } : {}),
  };

  await Promise.all([
    prisma.pullRequest.updateMany({ where: { repoId, id: nodeId }, data }),
    prisma.issue.updateMany({ where: { repoId, id: nodeId }, data }),
    prisma.commit.updateMany({ where: { repoId, id: nodeId }, data }),
  ]);
}

export async function recordPullRequestFeedback(repoId: string, githubPrNumber: number, helpful: boolean) {
  const data = {
    feedbackCount: { increment: 1 },
    ...(helpful ? { helpfulFeedbackCount: { increment: 1 } } : {}),
  };

  await prisma.pullRequest.updateMany({
    where: { repoId, githubPrNumber },
    data,
  });
}

export async function runRepoEnrichment(repoId: string, triggerSource: EnrichmentTriggerSource) {
  const repo = await prisma.repository.findUnique({ where: { id: repoId } });
  if (!repo) {
    throw new Error(`Repository not found: ${repoId}`);
  }

  const datasetName = repo.datasetName || `repo:${repo.owner}/${repo.name}`;
  const startedAt = new Date();

  await prisma.repository.update({
    where: { id: repoId },
    data: {
      lastEnrichedAt: startedAt,
      lastEnrichmentStatus: "RUNNING",
    },
  });

  const runRecord = await prisma.enrichmentRun.create({
    data: {
      repoId,
      startedAt,
      status: "RUNNING",
      triggerSource,
    },
  });

  try {
    await cogneeImprove(datasetName, {
      runInBackground: true,
      buildGlobalContextIndex: true,
      enrichmentTasks: ["summarization", "relationship-pruning"],
    });

    const staleNodeIds = await getStaleNodeIds(repoId);
    if (staleNodeIds.length > 0) {
      console.log(`[Enrichment] ${repo.fullName} stale node candidates:`, staleNodeIds);
      try {
        await cogneeForget({ dataset: datasetName, nodeIds: staleNodeIds });
      } catch (forgetError) {
        console.warn(`[Enrichment] Cognee scoped forget unavailable for ${repo.fullName}; falling back to local stale markers.`, forgetError);
      }

      await markStaleNodes(repoId, staleNodeIds);
      await prisma.pruneEvent.create({
        data: {
          repoId,
          nodesPruned: staleNodeIds.length,
          staleNodeIds,
        },
      });
    }

    const qualityScore = await computeQualityScore(repoId);
    const completedAt = new Date();
    const nodesEnriched =
      (await prisma.pullRequest.count({ where: { repoId, stale: false } })) +
      (await prisma.issue.count({ where: { repoId, stale: false } })) +
      (await prisma.commit.count({ where: { repoId, stale: false } }));

    await Promise.all([
      prisma.dataset.updateMany({
        where: { repoId },
        data: {
          qualityScore,
          lastImprovedAt: completedAt,
          processingStatus: "COMPLETED",
        },
      }),
      prisma.repository.update({
        where: { id: repoId },
        data: {
          memoryScore: qualityScore,
          lastEnrichedAt: completedAt,
          lastEnrichmentStatus: "SUCCESS",
        },
      }),
      prisma.enrichmentRun.update({
        where: { id: runRecord.id },
        data: {
          completedAt,
          nodesEnriched,
          nodesPruned: staleNodeIds.length,
          newQualityScore: qualityScore,
          status: "SUCCESS",
        },
      }),
    ]);

    return { qualityScore, nodesPruned: staleNodeIds.length };
  } catch (error: any) {
    const completedAt = new Date();
    await Promise.all([
      prisma.repository.update({
        where: { id: repoId },
        data: {
          lastEnrichedAt: completedAt,
          lastEnrichmentStatus: "FAILED",
        },
      }),
      prisma.enrichmentRun.update({
        where: { id: runRecord.id },
        data: {
          completedAt,
          status: "FAILED",
          errorMessage: error.message,
        },
      }),
    ]);

    throw error;
  }
}

export async function computeLatestQualityScore(repoId: string) {
  return computeQualityScore(repoId);
}
