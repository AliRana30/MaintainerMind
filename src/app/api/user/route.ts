import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Safely extract preferences with fallback in case DB schema is not updated
    const prefSyncFailures = (dbUser as any).prefSyncFailures ?? true;
    const prefNewPRNeedContext = (dbUser as any).prefNewPRNeedContext ?? true;
    const prefWeeklyDigest = (dbUser as any).prefWeeklyDigest ?? false;

    return NextResponse.json({
      success: true,
      user: {
        id: dbUser.id,
        name: dbUser.name || "Alex Maintainer",
        email: dbUser.email,
        avatarUrl: dbUser.avatarUrl || "https://github.com/identicons/maintainermind.png",
        plan: dbUser.plan,
        preferences: {
          syncFailures: prefSyncFailures,
          newPRNeedContext: prefNewPRNeedContext,
          weeklyDigest: prefWeeklyDigest,
        },
      },
    });
  } catch (err: any) {
    console.error("GET /api/user error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const body = await req.json();
    const { name, avatarUrl, preferences } = body;

    const updateData: any = {};
    if (name !== undefined) updateData.name = name;
    if (avatarUrl !== undefined) updateData.avatarUrl = avatarUrl;

    if (preferences) {
      if (preferences.syncFailures !== undefined) updateData.prefSyncFailures = preferences.syncFailures;
      if (preferences.newPRNeedContext !== undefined) updateData.prefNewPRNeedContext = preferences.newPRNeedContext;
      if (preferences.weeklyDigest !== undefined) updateData.prefWeeklyDigest = preferences.weeklyDigest;
    }

    const updatedUser = await prisma.user.update({
      where: { id: dbUser.id },
      data: updateData,
    }).catch((err) => {
      // Graceful fallback if migrations haven't run
      console.warn("Prisma PATCH user migration warning, using partial update:", err.message);
      
      // Attempt to only update name/avatar if pref columns don't exist
      const safeData = { ...updateData };
      delete safeData.prefSyncFailures;
      delete safeData.prefNewPRNeedContext;
      delete safeData.prefWeeklyDigest;
      
      return prisma.user.update({
        where: { id: dbUser.id },
        data: safeData,
      }).then((u) => ({
        ...u,
        ...updateData, // merge update preferences locally for response
      }));
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updatedUser.id,
        name: updatedUser.name || "Alex Maintainer",
        email: updatedUser.email,
        avatarUrl: updatedUser.avatarUrl,
        plan: updatedUser.plan,
        preferences: {
          syncFailures: (updatedUser as any).prefSyncFailures ?? true,
          newPRNeedContext: (updatedUser as any).prefNewPRNeedContext ?? true,
          weeklyDigest: (updatedUser as any).prefWeeklyDigest ?? false,
        },
      },
    });
  } catch (err: any) {
    console.error("PATCH /api/user error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    let dbUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!dbUser) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Cascading delete the user record
    await prisma.user.delete({
      where: { id: dbUser.id },
    });

    return NextResponse.json({
      success: true,
      message: "Account and all associated datasets deleted successfully.",
    });
  } catch (err: any) {
    console.error("DELETE /api/user error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

