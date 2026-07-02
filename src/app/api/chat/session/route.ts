import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { repoId } = body;

    if (!repoId) {
      return NextResponse.json({ error: "Missing repoId" }, { status: 400 });
    }

    // 1. Resolve user in DB
    let dbUser = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!dbUser) {
      dbUser = await prisma.user.findFirst();
    }
    if (!dbUser) {
      return NextResponse.json({ error: "User record not found" }, { status: 404 });
    }

    // 2. Resolve Repository in DB
    const repo = await prisma.repository.findFirst({
      where: {
        OR: [
          { id: repoId },
          { fullName: repoId },
          { name: repoId }
        ]
      }
    });

    if (!repo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    // 3. Find or Create ChatSession for this user and repository
    let session = await prisma.chatSession.findFirst({
      where: {
        userId: dbUser.id,
        repoId: repo.id,
      },
      include: {
        messages: {
          orderBy: { createdAt: "asc" },
        },
      },
    });

    if (!session) {
      const cogneeSessionId = `cognee-session-${repo.id}-${Date.now()}-${Math.random().toString(36).substring(5)}`;
      session = await prisma.chatSession.create({
        data: {
          userId: dbUser.id,
          repoId: repo.id,
          cogneeSessionId,
        },
        include: {
          messages: {
            orderBy: { createdAt: "asc" },
          },
        },
      });
    }

    return NextResponse.json({
      success: true,
      session: {
        id: session.id,
        repoId: session.repoId,
        cogneeSessionId: session.cogneeSessionId,
        createdAt: session.createdAt,
      },
      messages: session.messages,
    });
  } catch (err: any) {
    console.error("Error in chat/session POST:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
