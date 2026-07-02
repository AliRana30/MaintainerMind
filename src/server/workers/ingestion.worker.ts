import { Worker } from "bullmq";
import { redis } from "@/lib/redis";
import { prisma } from "@/lib/prisma";
import {
  getInstallationOctokit,
  formatPRForMemory,
  formatIssueForMemory,
  formatCommitForMemory
} from "@/lib/github";
import { embeddingQueue } from "@/server/queues";
import { notificationEmitter } from "@/lib/notification-emitter";
import { createNotification } from "@/lib/notifications";

export const ingestionWorker = new Worker(
  "ingestionQueue",
  async (job) => {
    const { webhookEventId, repoFullName, eventType, payload } = job.data;

    let repository = null;

    await prisma.webhookEvent.update({
      where: { id: webhookEventId },
      data: { status: "PROCESSING" },
    });

    try {
      const owner = repoFullName.split("/")[0];
      const repo = repoFullName.split("/")[1];
      const installationId = String(payload.installation?.id);

      if (!installationId) {
        throw new Error("Missing installation ID in payload");
      }

      const octokit = await getInstallationOctokit(installationId);
      repository = await prisma.repository.findFirst({
        where: { fullName: repoFullName },
      });

      if (!repository) {
        throw new Error(`Repository not found in DB: ${repoFullName}`);
      }

      const datasetName = `repo:${owner}/${repo}`;
      let text = "";

      if (eventType === "pull_request") {
        const prNumber = payload.pull_request.number;

        const [filesRes, commentsRes, reviewsRes] = await Promise.all([
          octokit.rest.pulls.listFiles({ owner, repo, pull_number: prNumber }),
          octokit.rest.pulls.listReviewComments({ owner, repo, pull_number: prNumber }),
          octokit.rest.pulls.listReviews({ owner, repo, pull_number: prNumber }),
        ]);

        text = formatPRForMemory(
          payload.pull_request,
          filesRes.data,
          reviewsRes.data.map((review) => ({
            user: { login: review.user?.login || "unknown" },
            state: review.state,
            body: review.body || "",
          })),
          commentsRes.data.map((comment) => ({
            user: { login: comment.user?.login || "unknown" },
            body: comment.body || "",
          }))
        );

        if (text) {
          await prisma.pullRequest.upsert({
            where: {
              repoId_githubPrNumber: {
                repoId: repository.id,
                githubPrNumber: prNumber,
              },
            },
            update: {
              title: payload.pull_request.title,
              body: payload.pull_request.body,
              state: payload.pull_request.state,
              filesAffected: filesRes.data.map((f) => f.filename),
              labels: (payload.pull_request.labels || []).map((l: any) => l.name),
              mergedAt: payload.pull_request.merged_at ? new Date(payload.pull_request.merged_at) : null,
              closedAt: payload.pull_request.closed_at ? new Date(payload.pull_request.closed_at) : null,
            },
            create: {
              repoId: repository.id,
              githubPrNumber: prNumber,
              title: payload.pull_request.title,
              body: payload.pull_request.body || "",
              state: payload.pull_request.state,
              authorLogin: payload.pull_request.user.login,
              filesAffected: filesRes.data.map((f) => f.filename),
              labels: (payload.pull_request.labels || []).map((l: any) => l.name),
              mergedAt: payload.pull_request.merged_at ? new Date(payload.pull_request.merged_at) : null,
              closedAt: payload.pull_request.closed_at ? new Date(payload.pull_request.closed_at) : null,
            },
          });
        }
      } else if (eventType === "issues") {
        const issueNumber = payload.issue.number;

        const commentsRes = await octokit.rest.issues.listComments({
          owner,
          repo,
          issue_number: issueNumber,
        });

        text = formatIssueForMemory(
          payload.issue,
          commentsRes.data.map((comment) => ({
            user: { login: comment.user?.login || "unknown" },
            body: comment.body || "",
          }))
        );

        if (text) {
          await prisma.issue.upsert({
            where: {
              repoId_githubIssueNumber: {
                repoId: repository.id,
                githubIssueNumber: issueNumber,
              },
            },
            update: {
              title: payload.issue.title,
              body: payload.issue.body,
              state: payload.issue.state,
              labels: (payload.issue.labels || []).map((l: any) => l.name),
              closedAt: payload.issue.closed_at ? new Date(payload.issue.closed_at) : null,
            },
            create: {
              repoId: repository.id,
              githubIssueNumber: issueNumber,
              title: payload.issue.title,
              body: payload.issue.body || "",
              state: payload.issue.state,
              labels: (payload.issue.labels || []).map((l: any) => l.name),
              closedAt: payload.issue.closed_at ? new Date(payload.issue.closed_at) : null,
            },
          });
        }
      } else if (eventType === "push") {
        const commits = payload.commits || [];
        for (const c of commits) {
          const commitText = formatCommitForMemory({
            sha: c.id,
            commit: {
              message: c.message,
              author: { name: c.author?.name },
            },
            author: { login: c.author?.username },
          });

          if (commitText) {
            await prisma.commit.upsert({
              where: { sha: c.id },
              update: {
                message: c.message,
                filesChanged: [],
              },
              create: {
                repoId: repository.id,
                sha: c.id,
                message: c.message,
                authorLogin: c.author?.username || c.author?.name || "unknown",
                filesChanged: [],
              },
            });

            await embeddingQueue.add("embed", {
              text: commitText,
              datasetName,
              repoId: repository.id,
              webhookEventId,
              eventType: "commit",
            });
          }
        }
        return;
      }

      if (text) {
        await embeddingQueue.add("embed", {
          text,
          datasetName,
          repoId: repository.id,
          webhookEventId,
          eventType,
        });
      }
    } catch (error: any) {
      await prisma.webhookEvent.update({
        where: { id: webhookEventId },
        data: {
          status: "FAILED",
          errorMsg: error.message,
        },
      });

      await prisma.auditLog.create({
        data: {
          action: "GITHUB_INGESTION_FAILED",
          entityType: "WebhookEvent",
          entityId: webhookEventId,
          metadata: { error: error.message },
        },
      });

      if (repository) {
        await createNotification({
          repoId: repository.id,
          type: "sync_failure",
          message: `Ingestion failed: ${error.message}`,
          payload: { error: error.message }
        });
      }

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);
export default ingestionWorker;
