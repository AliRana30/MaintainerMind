import { NextResponse, NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const sessionCookie = req.cookies.get("session")?.value;

    if (!sessionCookie) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    // Try finding by ID
    const user = await prisma.user.findUnique({
      where: { id: sessionCookie },
    });

    if (!user) {
      return NextResponse.json({ authenticated: false }, { status: 401 });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name || "Maintainer",
        avatarUrl: user.avatarUrl,
      },
    });
  } catch (err: any) {
    console.error("Error fetching auth user info:", err);
    return NextResponse.json({ authenticated: false }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const response = NextResponse.json({ success: true });
  response.cookies.delete("session");
  return response;
}
