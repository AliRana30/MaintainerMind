import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth-options";

export async function auth() {
  const session = await getServerSession(authOptions);
  return { userId: session?.user?.id || null };
}

export async function currentUser() {
  const session = await getServerSession(authOptions);
  if (!session?.user) return null;
  return {
    firstName: session.user.name?.split(" ")[0] || "",
    lastName: session.user.name?.split(" ").slice(1).join(" ") || "",
    imageUrl: session.user.image,
    emailAddresses: session.user.email ? [{ emailAddress: session.user.email }] : [],
  };
}
