import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// In-memory cache to store Clerk ID to database User ID mappings to avoid redundant queries
const clerkToDbUserCache = new Map<string, string>();

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    let dbUserId = clerkToDbUserCache.get(clerkId);

    if (!dbUserId) {
      const dbUser = await prisma.user.findUnique({
        where: { clerkId },
        select: { id: true },
      });

      if (!dbUser) {
        return NextResponse.json({ unreadCount: 0 });
      }

      dbUserId = dbUser.id;
      clerkToDbUserCache.set(clerkId, dbUserId);
    }

    const unreadCount = await prisma.notification.count({
      where: {
        userId: dbUserId,
        read: false,
      },
    });

    return NextResponse.json({ unreadCount });
  } catch (error: any) {
    console.error("Error fetching unread count:", error);
    return NextResponse.json({ unreadCount: 0 });
  }
}

