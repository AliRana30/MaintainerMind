import { NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: Request,
  props: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await props.params;
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const dbUser = await prisma.user.findUnique({
      where: { clerkId },
    });

    if (!dbUser) {
      return new NextResponse("User not found", { status: 404 });
    }

    // Verify ownership of this notification
    const notification = await prisma.notification.findUnique({
      where: { id },
    });

    if (!notification) {
      return new NextResponse("Notification not found", { status: 404 });
    }

    if (notification.userId !== dbUser.id) {
      return new NextResponse("Forbidden", { status: 403 });
    }

    await prisma.notification.update({
      where: { id },
      data: { read: true },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error("Error marking notification read:", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
