import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cogneeImprove } from "@/lib/cognee-client";
import { z } from "zod";
import { recordPullRequestFeedback } from "@/server/jobs/enrichment-job";

const feedbackSchema = z.object({
  contextText: z.string().min(1),
  rating: z.enum(["helpful", "not_helpful"]),
  prNumber: z.number().optional(),
});

export async function POST(
  req: Request,
  { params }: { params: Promise<{ repoId: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const parsed = feedbackSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid request body", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { contextText, rating, prNumber } = parsed.data;
    const { repoId } = await params;

    // Resolve repository from DB with slug resolution support
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
      });
    } else {
      foundRepo = await prisma.repository.findFirst({
        where: {
          OR: [
            { id: repoId },
            { name: repoId }
          ]
        },
      });
    }

    if (!foundRepo) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }
    const repo = foundRepo;

    const datasetName = repo.datasetName || `repo:${repo.fullName}`;

    // Store feedback in DB using existing MemoryFeedback schema
    const idempotencyKey = `pr-feedback:${userId}:${repoId}:${Date.now()}`;
    await prisma.memoryFeedback.create({
      data: {
        repoId,
        userId,
        recallQuery: contextText.slice(0, 500),
        recallResults: { rating, prNumber: prNumber || null, text: contextText.slice(0, 1000) },
        rating: rating === "helpful" ? "HELPFUL" : "NOT_HELPFUL",
        idempotencyKey,
      },
    }).catch((err) => {
      console.warn("Feedback DB write failed (non-fatal):", err);
    });

    // Trigger cognee.improve() for this dataset
    // The improve() call refines the knowledge graph using the accumulated feedback signals
    try {
      await cogneeImprove(datasetName, {
        runInBackground: true,
        buildGlobalContextIndex: rating === "helpful",
      });

      if (typeof prNumber === "number") {
        await recordPullRequestFeedback(repoId, prNumber, rating === "helpful");
      }
    } catch (err) {
      console.warn("cognee.improve() failed (non-fatal):", err);
    }

    return NextResponse.json({
      success: true,
      message: `Feedback recorded. Knowledge graph will be improved in background.`,
    });
  } catch (err: any) {
    console.error("PR insights feedback error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
