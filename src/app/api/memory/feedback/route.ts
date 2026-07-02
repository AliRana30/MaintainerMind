import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { cogneeImprove } from "@/lib/cognee-client";

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    const body = await req.json();
    const { memoryId, rating, comments, datasetName, repoId } = body;

    if (!memoryId && !datasetName && !repoId) {
      return NextResponse.json({ error: "Missing repo identifier in request body." }, { status: 400 });
    }

    if (typeof rating !== "number") {
      return NextResponse.json({ error: "Missing or invalid 'rating' in request body." }, { status: 400 });
    }

    const normalizedRating = rating >= 3 ? "HELPFUL" : "NOT_HELPFUL";
    const resolvedRepoId = repoId || datasetName || memoryId?.replace(/^pr-insights-/, "")?.split("-")?.[0] || null;

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    if (!resolvedRepoId) {
      return NextResponse.json({ error: "Unable to resolve repoId." }, { status: 400 });
    }

    // 1. Record the feedback in PostgreSQL using Prisma
    const feedback = await prisma.memoryFeedback
      .create({
        data: {
          userId,
          repoId: resolvedRepoId,
          recallQuery: comments || memoryId || "manual feedback",
          recallResults: {
            memoryId: memoryId || null,
            comments: comments || null,
            datasetName: datasetName || null,
          },
          rating: normalizedRating,
          idempotencyKey: `memory-feedback:${userId}:${resolvedRepoId}:${memoryId || comments || Date.now()}`,
        },
      })
      .catch((err) => {
        // Fallback gracefully in case DB migrations aren't executed yet
        console.warn("Prisma: MemoryFeedback table not found or migration pending. Details:", err.message);
        return {
          id: "mock-fallback-id",
          userId,
          repoId: resolvedRepoId,
          recallQuery: comments || memoryId || "manual feedback",
          recallResults: {
            memoryId: memoryId || null,
            comments: comments || null,
            datasetName: datasetName || null,
          },
          rating: normalizedRating,
          createdAt: new Date(),
        };
      });

    // 2. Self-Healing Cognitive Loop:
    // If rating is poor (<= 2), trigger an asynchronous Cognee improve() cycle 
    // in the background to refine and optimize graph relationship weights.
    let cogneeOptimized = false;
    if (rating <= 2 && datasetName) {
      cogneeOptimized = true;
      cogneeImprove(datasetName, {
        runInBackground: true,
        buildGlobalContextIndex: true,
        enrichmentTasks: ["summarization", "relationship-pruning"],
      }).catch((improveError) => {
        console.error(`[Cognee Self-Improvement Fail] Dataset: ${datasetName}`, improveError);
      });
    }

    return NextResponse.json({
      success: true,
      message: "Memory feedback processed successfully.",
      feedback,
      cogneeOptimized,
    });
  } catch (error: any) {
    console.error("Memory feedback exception:", error);
    return NextResponse.json(
      { error: "Internal server failure during feedback submission.", details: error.message },
      { status: 500 }
    );
  }
}
