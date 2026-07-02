import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cogneeForget } from "@/lib/cognee-client";
import { Octokit } from "@octokit/rest";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { repoId } = await params;

    // 1. Find the Repository with slug resolution support
    let foundRepo = null;
    if (repoId.includes("-")) {
      const parts = repoId.split("-");
      const owner = parts[0];
      const name = parts.slice(1).join("-");
      foundRepo = await prisma.repository.findFirst({
        where: {
          OR: [
            { id: repoId },
            { fullName: `${owner}/${name}` },
            { name: name }
          ]
        },
        include: {
          organization: true,
        },
      });
    } else {
      foundRepo = await prisma.repository.findFirst({
        where: {
          OR: [
            { id: repoId },
            { name: repoId }
          ]
        },
        include: {
          organization: true,
        },
      });
    }

    if (!foundRepo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }
    const repo = foundRepo;

    const datasetName = repo.datasetName || `repo:${repo.fullName}`;

    // 2. Attempt Webhook Removal via GitHub API
    try {
      const githubToken = process.env.GITHUB_TOKEN;
      if (githubToken) {
        const octokit = new Octokit({ auth: githubToken });
        // List hooks to find our webhook URL or delete hooks matching webhook pattern
        const { data: hooks } = await octokit.repos.listWebhooks({
          owner: repo.owner,
          repo: repo.name,
        });

        // Find hooks pointing to our domain/api/webhooks/github
        const webhookUrl = process.env.NEXT_PUBLIC_APP_URL || "https://maintainermind.ai";
        const hookToDelete = hooks.find((hook: any) => hook.config?.url && hook.config.url.includes("webhooks/github"));
        
        if (hookToDelete) {
          await octokit.repos.deleteWebhook({
            owner: repo.owner,
            repo: repo.name,
            hook_id: hookToDelete.id,
          });
        }
      }
    } catch (hookErr: any) {
      console.warn("Could not delete GitHub webhook (might not exist or token lacking permissions):", hookErr.message);
    }

    // 3. Call cognee forget operation
    try {
      await cogneeForget({
        dataset: datasetName,
        everything: true,
      });
    } catch (forgetErr: any) {
      console.warn("cogneeForget failed during disconnect (graceful continue):", forgetErr.message);
    }

    // 4. Delete the Repository from DB (cascading deletes will clean up related records)
    await prisma.repository.delete({
      where: { id: repo.id },
    });

    return NextResponse.json({
      success: true,
      message: "Repository disconnected and pruned successfully.",
    });
  } catch (err: any) {
    console.error("Error in repository disconnect:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
