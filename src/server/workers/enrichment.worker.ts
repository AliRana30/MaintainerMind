import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { runRepoEnrichment } from "@/server/jobs/enrichment-job";

export const enrichmentWorker = new Worker(
  "enrichmentQueue",
  async (job) => {
    const { repoId, triggerSource = "scheduled" } = job.data;
    await runRepoEnrichment(repoId, triggerSource);
  },
  {
    connection: redis,
    concurrency: 1,
  }
);

export default enrichmentWorker;
