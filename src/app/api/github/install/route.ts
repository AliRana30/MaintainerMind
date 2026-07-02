import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import type { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const userId = token?.id as string | undefined;

  if (!userId) {
    return new NextResponse("Unauthorized", { status: 401 });
  }

  // The GitHub App slug will be an env variable or fallback
  const appSlug = process.env.GITHUB_APP_SLUG || "maintainermind";
  
  // Encode userId into the state so we can tie the installation back to the user
  const state = encodeURIComponent(userId);
  
  const installUrl = `https://github.com/apps/${appSlug}/installations/new?state=${state}`;

  return NextResponse.redirect(installUrl);
}
