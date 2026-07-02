import { ingestionWorker } from "./ingestion.worker";
import { embeddingWorker } from "./embedding.worker";
import { notificationWorker } from "./notification.worker";
import { analyticsWorker } from "./analytics.worker";
import { enrichmentWorker } from "./enrichment.worker";
import { backfillWorker } from "./repo-backfill";
import {
  ingestionQueue,
  embeddingQueue,
  notificationQueue,
  analyticsQueue,
  enrichmentQueue
} from "../queues";

let monitorInterval: NodeJS.Timeout | null = null;
let enrichmentScheduleReady = false;

async function logToPostHog(eventName: string, properties: Record<string, any>) {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY;
  if (!key) return;
  try {
    await fetch("https://app.posthog.com/capture/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: key,
        event: eventName,
        properties: {
          distinct_id: "system_monitor",
          ...properties,
        },
      }),
    });
  } catch (error) {}
}

export function startWorkers() {
  if (monitorInterval) {
    return;
  }

  if (!enrichmentScheduleReady) {
    enrichmentQueue.add(
      "scheduled-enrichment",
      {},
      {
        repeat: { every: 6 * 60 * 60 * 1000 },
        jobId: "scheduled-enrichment",
        removeOnComplete: true,
        removeOnFail: false,
      }
    ).catch((error) => {
      console.warn("[Enrichment Scheduler] Failed to register repeatable job:", error);
    });
    enrichmentScheduleReady = true;
  }

  monitorInterval = setInterval(async () => {
    try {
      const [
        ingestionCounts,
        embeddingCounts,
        notificationCounts,
        analyticsCounts,
        enrichmentCounts
      ] = await Promise.all([
        ingestionQueue.getJobCounts(),
        embeddingQueue.getJobCounts(),
        notificationQueue.getJobCounts(),
        analyticsQueue.getJobCounts(),
        enrichmentQueue.getJobCounts(),
      ]);

      const totalDepth =
        (ingestionCounts.waiting || 0) +
        (embeddingCounts.waiting || 0) +
        (notificationCounts.waiting || 0) +
        (analyticsCounts.waiting || 0) +
        (enrichmentCounts.waiting || 0);

      console.log(
        `[Queue Monitor] Active Queue Depth: ${totalDepth} (Ingestion: ${ingestionCounts.waiting}, Embedding: ${embeddingCounts.waiting})`
      );

      if (totalDepth > 500) {
        await logToPostHog("queue_depth_alert", {
          totalDepth,
          ingestion: ingestionCounts.waiting,
          embedding: embeddingCounts.waiting,
        });
      }
    } catch (err) {
      console.error("[Queue Monitor Error]", err);
    }
  }, 60000);
}

export async function stopWorkers() {
  if (monitorInterval) {
    clearInterval(monitorInterval);
    monitorInterval = null;
  }

  await Promise.all([
    ingestionWorker.close(),
    embeddingWorker.close(),
    notificationWorker.close(),
    analyticsWorker.close(),
    enrichmentWorker.close(),
    backfillWorker.close(),
  ]);
}

// Start workers automatically if run directly
if (typeof require !== "undefined" && require.main === module) {
  console.log("[Worker Registry] Running standalone worker process...");
  startWorkers();
  
  process.on("SIGTERM", async () => {
    console.log("[Worker Registry] SIGTERM received. Shutting down...");
    await stopWorkers();
    process.exit(0);
  });
  
  process.on("SIGINT", async () => {
    console.log("[Worker Registry] SIGINT received. Shutting down...");
    await stopWorkers();
    process.exit(0);
  });
}
