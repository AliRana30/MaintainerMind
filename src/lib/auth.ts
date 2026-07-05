import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function auth() {
  try {
    const session = await getServerSession(authOptions);
    return { userId: session?.user?.id || null };
  } catch (error) {
    console.warn("NextAuth session fetch failed (likely missing secret):", error);
    return { userId: null };
  }
}

export async function currentUser() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) return null;
    return {
      firstName: session.user.name?.split(" ")[0] || "",
      lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
      imageUrl: session.user.image,
      emailAddresses: session.user.email ? [{ emailAddress: session.user.email }] : [],
    };
  } catch (error) {
    console.warn("NextAuth currentUser fetch failed (likely missing secret):", error);
    return null;
  }
}
