import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { createAppAuth } from "@octokit/auth-app";
import { Octokit } from "@octokit/rest";
import { Queue } from "bullmq";

import { redis } from "@/lib/redis";

// BullMQ Queue setup for backfilling (will run on a worker process)
const backfillQueue = new Queue("repo-backfill", {
  connection: redis,
});

export async function GET(req: NextRequest) {
  try {
    const searchParams = req.nextUrl.searchParams;
    const installationId = searchParams.get("installation_id");
    const state = searchParams.get("state");

    if (!installationId || !state) {
      return NextResponse.redirect(new URL("/dashboard/repositories?error=MissingParams", req.url));
    }

    const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
    const sessionUserId = token?.id as string | undefined;
    const expectedUserId = decodeURIComponent(state);

    let targetUserId: string | undefined = sessionUserId || expectedUserId;

    if (!targetUserId || targetUserId === "null" || targetUserId === "undefined") {
      const dbUser = await prisma.user.findFirst();
      targetUserId = dbUser?.id;
    }

    if (!targetUserId) {
      return NextResponse.redirect(new URL("/dashboard/repositories?error=Unauthorized", req.url));
    }

    // Fetch the user's default organization
    let dbOrg = await prisma.organization.findFirst({
      where: { ownerId: targetUserId },
    });

    if (!dbOrg) {
      const user = await prisma.user.findUnique({ where: { id: targetUserId } });
      dbOrg = await prisma.organization.create({
        data: {
          name: `${user?.name || "Default"}'s Organization`,
          githubOrgId: `org_${targetUserId}`,
          ownerId: targetUserId,
        },
      });
    }

    console.log("=== GitHub Installation Callback starting ===");
    console.log("installationId:", installationId);
    console.log("targetUserId:", targetUserId);
    console.log("dbOrg found/created ID:", dbOrg.id);

    // Setup Octokit with GitHub App Authentication
    const appId = process.env.GITHUB_APP_ID!;
    const privateKey = process.env.GITHUB_PRIVATE_KEY!.replace(/\\n/g, "\n");

    const appOctokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: appId,
        privateKey: privateKey,
        installationId: parseInt(installationId, 10),
      },
    });

    // 1. Fetch repos the user granted access to in this installation
    const response = await appOctokit.apps.listReposAccessibleToInstallation({
      per_page: 100,
    });

    const repos = response.data.repositories;
    console.log("Number of repositories returned by GitHub:", repos.length);
    console.log("Repositories list:", repos.map((r: any) => r.full_name));
    
    const createdRepos = [];

    // 2. Create actual DB records for the real repos
    for (const repo of repos) {
      const repository = await prisma.repository.upsert({
        where: { fullName: repo.full_name },
        update: {
          syncStatus: "SYNCING",
          githubInstallationId: installationId,
        },
        create: {
          orgId: dbOrg.id,
          owner: repo.owner.login,
          name: repo.name,
          fullName: repo.full_name,
          githubRepoId: repo.id.toString(),
          defaultBranch: repo.default_branch || "main",
          datasetName: `repo:${repo.owner.login}/${repo.name}`,
          githubInstallationId: installationId,
          syncStatus: "SYNCING",
        },
      });

      // Initialize Cognee dataset mapping
      await prisma.dataset.upsert({
        where: { repoId: repository.id },
        update: { processingStatus: "PROCESSING" },
        create: {
          repoId: repository.id,
          cogneeName: repository.datasetName,
          processingStatus: "PROCESSING",
        },
      });

      // 3. Queue the background backfill job
      try {
        await backfillQueue.add("backfill-repo", {
          repoId: repository.id,
          fullName: repo.full_name,
          owner: repo.owner.login,
          name: repo.name,
          installationId: installationId,
        });
      } catch (queueErr: any) {
        console.warn("[BullMQ Queue Warning] Failed to queue repository backfill:", queueErr.message);
      }

      // Add audit log
      await prisma.auditLog.create({
        data: {
          userId: targetUserId,
          action: "GITHUB_APP_INSTALLED",
          entityType: "Repository",
          entityId: repository.id,
          metadata: { repoFullName: repo.full_name, installationId },
        },
      });

      createdRepos.push(repository);
    }

    // Redirect to the UI with a success state so it can display the SYNCING status accurately
    return NextResponse.redirect(new URL("/dashboard/repositories?justConnected=true", req.url));
    
  } catch (err: any) {
    console.error("Error processing GitHub app install callback:", err);
    return NextResponse.redirect(new URL(`/dashboard/repositories?error=${encodeURIComponent(err.message)}`, req.url));
  }
}
