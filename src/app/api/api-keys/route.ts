import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

// Prevent Next.js static analysis at build time — requires DB at runtime only
export const dynamic = "force-dynamic";


// Helper to hash key
function hashKey(key: string): string {
  return crypto.createHash("sha256").update(key).digest("hex");
}

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { organizations: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const orgId = dbUser.organizations[0]?.id;
    if (!orgId) {
      return NextResponse.json({ apiKeys: [] });
    }

    const apiKeys = await prisma.apiKey.findMany({
      where: { orgId },
      select: {
        id: true,
        name: true,
        lastUsedAt: true,
        createdAt: true,
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ success: true, apiKeys });
  } catch (err: any) {
    console.error("GET /api/api-keys error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
      include: { organizations: true },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Ensure user has at least one organization
    let org = dbUser.organizations[0];
    if (!org) {
      // Auto-create fallback organization for local development/testing
      org = await prisma.organization.create({
        data: {
          name: `${dbUser.name || "Default"}'s Workspace`,
          githubOrgId: `org-${dbUser.id}`,
          ownerId: dbUser.id,
        },
      });
    }

    const body = await req.json();
    const { name } = body;
    if (!name) {
      return NextResponse.json({ error: "API Key name is required" }, { status: 400 });
    }

    // Generate real secure token
    const tokenBytes = crypto.randomBytes(24);
    const rawKey = `mm_${tokenBytes.toString("hex")}`;
    const keyHash = hashKey(rawKey);

    const keyRecord = await prisma.apiKey.create({
      data: {
        orgId: org.id,
        name,
        keyHash,
      },
    });

    return NextResponse.json({
      success: true,
      rawKey,
      key: {
        id: keyRecord.id,
        name: keyRecord.name,
        createdAt: keyRecord.createdAt,
      },
    });
  } catch (err: any) {
    console.error("POST /api/api-keys error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing 'id' query parameter" }, { status: 400 });
    }

    await prisma.apiKey.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: "API Key revoked successfully.",
    });
  } catch (err: any) {
    console.error("DELETE /api/api-keys error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
