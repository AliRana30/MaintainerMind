import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const publicRoutes = [
  "/",
  "/login",
  "/signup",
  "/api/auth",
  "/api/health",
];

const isPublicRoute = (path: string) => {
  return publicRoutes.some(route => path.startsWith(route));
};

export default async function middleware(req: NextRequest) {
  const isPublic = isPublicRoute(req.nextUrl.pathname);
  const isApiRoute = req.nextUrl.pathname.startsWith("/api");

  // Allow custom session or NextAuth session tokens
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.id || null;
  const legacySession = req.cookies.get("session")?.value;

  if (!isPublic) {
    if (!userId && !legacySession) {
      if (isApiRoute) {
        return new NextResponse("Unauthorized", { status: 401 });
      }
      const loginUrl = new URL("/login", req.url);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html|css|js|jpe?g|webp|png|gif|svg|css|js|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
