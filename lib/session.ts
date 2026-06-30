import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function requireUserId(): Promise<string> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function requireAdmin(): Promise<{ userId: string; role: string }> {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }

  const role = (session.user as Record<string, unknown>).role as string | undefined;
  if (role !== "admin") {
    throw new Error("Forbidden");
  }

  return { userId: session.user.id, role };
}
