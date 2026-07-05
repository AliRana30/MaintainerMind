import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    let dbUser = null;
    const { userId: clerkId } = await auth();

    if (clerkId) {
      dbUser = await prisma.user.findUnique({
        where: { clerkId },
      });
      if (!dbUser) {
        dbUser = await prisma.user.findUnique({ where: { id: clerkId } });
      }
    }

    if (!dbUser) {
      dbUser = await prisma.user.findFirst();
    }

    if (!dbUser) {
      return NextResponse.json({ notifications: [] });
    }

    const notifications = await prisma.notification.findMany({
      where: {
        userId: dbUser.id,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20,
    });

    const unreadCount = await prisma.notification.count({
      where: {
        userId: dbUser.id,
        read: false,
      },
    });

    return NextResponse.json({ notifications, unreadCount });
  } catch (error: any) {
    console.error("Error fetching notifications list:", error);
    return NextResponse.json({ notifications: [], unreadCount: 0 });
  }
}

export async function PATCH() {
  try {
    let dbUser = null;
    const { userId: clerkId } = await auth();

    if (clerkId) {
      dbUser = await prisma.user.findUnique({
        where: { clerkId },
      });
      if (!dbUser) {
        dbUser = await prisma.user.findUnique({ where: { id: clerkId } });
      }
    }

    if (!dbUser) {
      dbUser = await prisma.user.findFirst();
    }

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Bulk update all notifications for this user to read = true
    await prisma.notification.updateMany({
      where: {
        userId: dbUser.id,
        read: false,
      },
      data: {
        read: true,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking all notifications as read:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
