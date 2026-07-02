import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { cogneeImprove } from "@/lib/cognee-client";

export const analyticsWorker = new Worker(
  "analyticsQueue",
  async (job) => {
    const { repoId, datasetName } = job.data;

    const limitKey = `cognee:improve:last:${datasetName}`;
    const isLocked = await redis.get(limitKey);

    if (!isLocked) {
      await cogneeImprove(datasetName, { runInBackground: true });
      await redis.set(limitKey, "true", "EX", 1800);
    }

    const feedbacks = await prisma.memoryFeedback.findMany({
      where: { repoId },
    });

    let qualityScore = 1.0;
    if (feedbacks.length > 0) {
      const positive = feedbacks.filter(
        (f) => f.rating === "HELPFUL" || f.rating === "HIGHLY_RELEVANT"
      ).length;
      qualityScore = positive / feedbacks.length;
    }

    await prisma.dataset.update({
      where: { repoId },
      data: {
        lastImprovedAt: new Date(),
        qualityScore,
      },
    });
  },
  {
    connection: redis,
    concurrency: 2,
  }
);

export default analyticsWorker;
