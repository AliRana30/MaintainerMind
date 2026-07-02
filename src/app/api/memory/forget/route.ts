import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { redis, deleteCachedValue } from "@/lib/redis";
import { cogneeForget } from "@/lib/cognee-client";

export async function POST(req: Request) {
  try {
    const { dataId, repoId } = await req.json();

    if (!dataId || !repoId) {
      return NextResponse.json({ error: "Missing dataId or repoId" }, { status: 400 });
    }

    const repository = await prisma.repository.findUnique({
      where: { id: repoId },
    });

    if (!repository) {
      return NextResponse.json({ error: "Repository not found" }, { status: 404 });
    }

    await cogneeForget({
      dataset: repository.datasetName,
      dataId,
    });

    const cacheKey = `graph:${repoId}`;
    await deleteCachedValue(cacheKey);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error(error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
