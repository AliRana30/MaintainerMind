import { NextResponse, NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { rememberGitHubContent } from "@/server/services/memory.service";
import { cogneeForget } from "@/lib/cognee-client";

async function getOrCreateUser(req: NextRequest) {
  let sessionUserId = req.headers.get("x-user-id") || req.cookies.get("session")?.value;
  let dbUser = null;

  console.log("=== getOrCreateUser starting ===");
  console.log("sessionUserId from headers/cookies:", sessionUserId);

  if (sessionUserId) {
    dbUser = await prisma.user.findUnique({
      where: { id: sessionUserId },
    });
    if (dbUser) {
      console.log("Found dbUser by sessionUserId:", dbUser.id, dbUser.email);
      return dbUser;
    }
  }

  const authObj = await auth();
  const userId = authObj?.userId;
  console.log("userId from authObj:", userId);

  if (userId) {
    dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });
    if (dbUser) {
      console.log("Found dbUser by authObj userId:", dbUser.id, dbUser.email);
      return dbUser;
    }
  }

  dbUser = await prisma.user.findFirst();
  console.log("Fell back to findFirst user:", dbUser ? `${dbUser.id} (${dbUser.email})` : "none");

  if (!dbUser) {
    dbUser = await prisma.user.create({
      data: {
        email: "onboarding-user@maintainermind.ai",
        name: "Onboarding Maintainer",
        clerkId: "onboarding_user",
        plan: "FREE",
      },
    });
    console.log("Created onboarding user:", dbUser.id);
  }

  return dbUser;
}

export async function GET(req: NextRequest) {
  try {
    const dbUser = await getOrCreateUser(req);
    const url = new URL(req.url);
    const statusFilter = url.searchParams.get("status");
    
    const whereClause: any = {
      organization: {
        ownerId: dbUser.id,
      },
    };

    console.log("=== GET /api/repos starting ===");
    console.log("dbUser.id:", dbUser.id);
    console.log("dbUser.email:", dbUser.email);
    console.log("whereClause:", JSON.stringify(whereClause));

    if (statusFilter) {
      whereClause.syncStatus = statusFilter.toUpperCase();
    }

    const repositories = await prisma.repository.findMany({
      where: whereClause,
      include: {
        dataset: true,
        commits: true,
        pullRequests: true,
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    console.log("Number of repositories found in DB:", repositories.length);
    console.log("Repositories:", repositories.map(r => r.fullName));

    const formatted = repositories.map(r => ({
      id: r.id,
      name: r.fullName,
      fullName: r.fullName,
      owner: r.owner,
      lastSync: r.lastSyncAt ? r.lastSyncAt.toISOString() : "never",
      openPRs: r.pullRequests.filter(pr => pr.state === "open").length,
      commits: r.commits.length,
      nodes: r.dataset?.nodeCount ? `${(r.dataset.nodeCount / 1000).toFixed(1)}k` : "0.0k",
      freshness: r.syncStatus === "SYNCED" ? 100 : r.syncStatus === "SYNCING" ? 50 : 0,
      status: r.syncStatus,
      provider: "github",
    }));

    return NextResponse.json({ success: true, repositories: formatted });
  } catch (err: any) {
    console.error("Error in api/repos GET:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  // Deprecated: Repository creation is now handled exclusively via the GitHub App Installation Flow
  return NextResponse.json(
    { error: "Method not allowed. Use the GitHub App installation flow instead." },
    { status: 405 }
  );
}

export async function DELETE(req: NextRequest) {
  try {
    const { repoId } = await req.json();
    if (!repoId) {
      return NextResponse.json({ error: "Missing repoId" }, { status: 400 });
    }

    const dbUser = await getOrCreateUser(req);
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const repo = await prisma.repository.findFirst({
      where: {
        id: repoId,
        organization: {
          ownerId: dbUser.id,
        },
      },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found or access denied" }, { status: 404 });
    }

    const datasetName = repo.datasetName || `repo:${repo.fullName}`;
    try {
      await cogneeForget({
        dataset: datasetName,
        everything: true,
      });
    } catch (forgetErr: any) {
      console.warn("cogneeForget failed during manual repo delete:", forgetErr.message);
    }

    await prisma.repository.delete({
      where: { id: repoId },
    });

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("Error in api/repos DELETE:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

