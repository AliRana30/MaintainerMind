import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import { getInstallationOctokit } from "@/lib/github";
import { recallForPR } from "@/server/services/memory.service";
import { formatRecallComment } from "@/lib/comment-formatter";
import { notificationEmitter } from "@/lib/notification-emitter";
import { createNotification } from "@/lib/notifications";

export const notificationWorker = new Worker(
  "notificationQueue",
  async (job) => {
    const { repoId, prNumber, datasetName, webhookEventId } = job.data;

    const pr = await prisma.pullRequest.findFirst({
      where: { repoId, githubPrNumber: prNumber },
    });

    if (!pr) {
      throw new Error(`PR #${prNumber} not found in database for repo ${repoId}`);
    }

    const files = (pr.filesAffected as string[]) || [];
    const results = await recallForPR(pr.title, pr.body || "", files, datasetName);

    const comment = formatRecallComment(results, {
      number: pr.githubPrNumber,
      title: pr.title,
      filesAffected: files,
    });

    const repository = await prisma.repository.findUnique({
      where: { id: repoId },
    });

    if (!repository) {
      throw new Error(`Repository not found: ${repoId}`);
    }

    if (comment) {
      const octokit = await getInstallationOctokit(repository.githubInstallationId);
      await octokit.rest.issues.createComment({
        owner: repository.owner,
        repo: repository.name,
        issue_number: prNumber,
        body: comment,
      });
    }

    if (webhookEventId) {
      const event = await prisma.webhookEvent.findUnique({
        where: { id: webhookEventId },
      });

      if (event) {
        const updatedPayload = {
          ...(event.payload as any),
          recallResults: results,
        };

        await prisma.webhookEvent.update({
          where: { id: webhookEventId },
          data: {
            status: "DONE",
            processedAt: new Date(),
            payload: updatedPayload,
          },
        });

        await createNotification({
          repoId,
          type: "pr_context",
          message: `Pull Request #${prNumber} analyzed and review comments posted for ${repository.fullName}`,
          payload: { prNumber }
        });
      }
    }
  },
  {
    connection: redis,
    concurrency: 5,
  }
);

export default notificationWorker;
