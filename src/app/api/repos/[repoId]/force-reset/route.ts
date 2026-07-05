import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { userId } = await auth();
    const { repoId } = await params;

    // Use fallback user logic if auth is not configured properly (Hackathon mock)
    let dbUser = null;
    if (userId) {
      dbUser = await prisma.user.findUnique({ where: { id: userId } });
    }
    if (!dbUser) {
      dbUser = await prisma.user.findFirst();
    }
    if (!dbUser) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const repo = await prisma.repository.findFirst({
      where: {
        OR: [
          { id: repoId },
          { fullName: repoId }
        ]
      },
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // Force reset the status to FAILED so the user can retry or delete it
    await prisma.repository.update({
      where: { id: repo.id },
      data: { syncStatus: "FAILED" },
    });

    // Also update dataset if it exists
    await prisma.dataset.updateMany({
      where: { repoId: repo.id },
      data: { processingStatus: "FAILED" },
    });

    return NextResponse.json({ success: true, message: "Repository sync forcibly reset." });
  } catch (error: any) {
    console.error("[Force Reset Error]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
