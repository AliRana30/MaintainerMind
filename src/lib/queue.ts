import { Queue } from "bullmq";
import { redis } from "@/lib/redis";

export const ingestionQueue = new Queue("ingestionQueue", {
  connection: redis,
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
