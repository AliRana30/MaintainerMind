import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

const connection = redis;

export const ingestionQueue = new Queue("ingestionQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 2000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const embeddingQueue = new Queue("embeddingQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const notificationQueue = new Queue("notificationQueue", {
  connection,
  defaultJobOptions: {
    attempts: 2,
    backoff: {
      type: "fixed",
      delay: 3000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const analyticsQueue = new Queue("analyticsQueue", {
  connection,
  defaultJobOptions: {
    attempts: 1,
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export const enrichmentQueue = new Queue("enrichmentQueue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 5000,
    },
    removeOnComplete: true,
    removeOnFail: false,
  },
});

export async function addJob(queue: Queue, name: string, data: any, jobId?: string) {
  if (jobId) {
    const existing = await queue.getJob(jobId);
    if (existing) {
      return existing;
    }
  }
  return queue.add(name, data, { jobId });
}
