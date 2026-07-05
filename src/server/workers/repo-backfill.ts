import { Worker, Job } from "bullmq";
import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";
import { PrismaClient } from "@prisma/client";
import { rememberGitHubContent } from "../services/memory.service"; // assuming memory.service handles cognee.remember calls
import { enrichmentQueue } from "../queues";
import { redis } from "@/lib/redis";

const prisma = new PrismaClient();

export const backfillWorker = new Worker(
  "repo-backfill",
  async (job: Job) => {
    const { repoId, fullName, owner, name, installationId } = job.data;

    try {
      console.log(`[Backfill] Starting backfill for ${fullName}`);

      // 0. Ensure the repository still exists in the DB before starting work
      const repoExists = await prisma.repository.findUnique({
        where: { id: repoId },
      });
      if (!repoExists) {
        console.warn(`[Backfill] Repository ${repoId} no longer exists in database. Skipping job.`);
        return;
      }

      // 1. Initialize GitHub App Octokit for this installation
      const appId = process.env.GITHUB_APP_ID!;
      const privateKey = process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n");
      
      const appOctokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          appId,
          privateKey,
          installationId: parseInt(installationId, 10),
        },
      });

      // 2. Paginate Commits (Limit to 100 for demo/performance, adjust for production)
      let commitsData: any[] = [];
      try {
        const commits = await appOctokit.repos.listCommits({
          owner,
          repo: name,
          per_page: 100,
        });
        commitsData = commits.data;

        for (const commit of commitsData) {
          try {
            await rememberGitHubContent({
              type: "commit",
              owner,
              repo: name,
              id: commit.sha,
              commitMessage: commit.commit.message,
              author: commit.commit.author?.name || "Unknown",
              url: commit.html_url,
            });
          } catch (cogneeErr: any) {
            console.warn(`[Backfill] Cognee remember failed for commit ${commit.sha}:`, cogneeErr.message);
          }

          await prisma.commit.upsert({
            where: { sha: commit.sha },
            update: {
              message: commit.commit.message,
              authorLogin: commit.author?.login || commit.commit.author?.name || "Unknown",
              createdAt: commit.commit.author?.date ? new Date(commit.commit.author.date) : new Date(),
            },
            create: {
              repoId,
              sha: commit.sha,
              message: commit.commit.message,
              authorLogin: commit.author?.login || commit.commit.author?.name || "Unknown",
              createdAt: commit.commit.author?.date ? new Date(commit.commit.author.date) : new Date(),
            },
          });
        }
      } catch (commitErr: any) {
        console.warn(`[Backfill] Commits failed for ${fullName}, repo might be empty`, commitErr.message);
      }

      // 3. Paginate Issues & PRs
      let issuesData: any[] = [];
      try {
        const issues = await appOctokit.issues.listForRepo({
          owner,
          repo: name,
          state: "all",
          per_page: 100,
        });
        issuesData = issues.data;
      } catch (err: any) {
        console.warn(`[Backfill] Issues might be disabled for ${fullName}. Fetching PRs directly.`, err.message);
        try {
          const pulls = await appOctokit.pulls.list({
            owner,
            repo: name,
            state: "all",
            per_page: 100,
          });
          issuesData = pulls.data.map((p: any) => ({
            ...p,
            pull_request: { url: p.url }
          }));
        } catch (pullErr: any) {
          console.warn(`[Backfill] Pulls failed for ${fullName}`, pullErr.message);
        }
      }

      for (const issue of issuesData) {
        if (issue.pull_request) {
          // It's a PR
          try {
            await rememberGitHubContent({
              type: "pull_request",
              owner,
              repo: name,
              id: issue.number.toString(),
              title: issue.title,
              body: issue.body || "",
              state: issue.state,
              author: issue.user?.login || "Unknown",
              url: issue.html_url,
            });
          } catch (cogneeErr: any) {
            console.warn(`[Backfill] Cognee remember failed for PR ${issue.number}:`, cogneeErr.message);
          }

          // Save PR to PostgreSQL
          await prisma.pullRequest.upsert({
            where: {
              repoId_githubPrNumber: {
                repoId,
                githubPrNumber: issue.number,
              },
            },
            update: {
              title: issue.title,
              body: issue.body,
              state: issue.state,
              authorLogin: issue.user?.login || "Unknown",
              updatedAt: issue.updated_at ? new Date(issue.updated_at) : new Date(),
              closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
            },
            create: {
              repoId,
              githubPrNumber: issue.number,
              title: issue.title,
              body: issue.body,
              state: issue.state,
              authorLogin: issue.user?.login || "Unknown",
              createdAt: issue.created_at ? new Date(issue.created_at) : new Date(),
              updatedAt: issue.updated_at ? new Date(issue.updated_at) : new Date(),
              closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
            },
          });
        } else {
          // It's an issue
          try {
            await rememberGitHubContent({
              type: "issue",
              owner,
              repo: name,
              id: issue.number.toString(),
              title: issue.title,
              body: issue.body || "",
              state: issue.state,
              author: issue.user?.login || "Unknown",
              url: issue.html_url,
            });
          } catch (cogneeErr: any) {
            console.warn(`[Backfill] Cognee remember failed for issue ${issue.number}:`, cogneeErr.message);
          }

          // Save Issue to PostgreSQL
          await prisma.issue.upsert({
            where: {
              repoId_githubIssueNumber: {
                repoId,
                githubIssueNumber: issue.number,
              },
            },
            update: {
              title: issue.title,
              body: issue.body,
              state: issue.state,
              closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
            },
            create: {
              repoId,
              githubIssueNumber: issue.number,
              title: issue.title,
              body: issue.body,
              state: issue.state,
              createdAt: issue.created_at ? new Date(issue.created_at) : new Date(),
              closedAt: issue.closed_at ? new Date(issue.closed_at) : null,
            },
          });
        }
      }

      let nodeCount = 0;
      if (commitsData) nodeCount += commitsData.length;
      if (issuesData) nodeCount += issuesData.length;

      // 4. Update Repository Status to SYNCED
      await prisma.repository.update({
        where: { id: repoId },
        data: {
          syncStatus: "SYNCED",
          lastSyncAt: new Date(),
        },
      });

      // Also update Dataset status and nodeCount
      await prisma.dataset.update({
        where: { repoId: repoId },
        data: { 
          processingStatus: "COMPLETED",
          nodeCount: nodeCount,
          qualityScore: 100 // baseline quality score
        },
      });

      await enrichmentQueue.add(
        "run-repo-enrichment",
        {
          repoId,
          triggerSource: "backfill",
        },
        {
          jobId: `backfill-enrichment:${repoId}:${Date.now()}`,
          removeOnComplete: true,
          removeOnFail: false,
        }
      );

      console.log(`[Backfill] Successfully finished backfill for ${fullName}`);
    } catch (error: any) {
      console.error(`[Backfill] Failed backfill for ${fullName}:`, error);

      try {
        // 5. On failure, update Repository Status to FAILED
        await prisma.repository.update({
          where: { id: repoId },
          data: {
            syncStatus: "FAILED",
          },
        });
        
        // Also update Dataset status
        await prisma.dataset.update({
          where: { repoId: repoId },
          data: { processingStatus: "FAILED" },
        });
      } catch (updateErr) {
        console.warn(`[Backfill] Could not update status to FAILED for ${repoId} (likely deleted).`);
      }

      throw error; // Let BullMQ handle retries/failure logging
    }
  },
  {
    connection: redis,
  }
);

backfillWorker.on("completed", (job) => {
  console.log(`Job ${job.id} completed successfully`);
});

backfillWorker.on("failed", (job, err) => {
  console.error(`Job ${job?.id} failed with error ${err.message}`);
});

console.log("Repo backfill worker started successfully.");
