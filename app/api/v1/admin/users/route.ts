import { type NextRequest } from "next/server";
import { ok, fail, withErrorHandling } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";

export const GET = withErrorHandling(async () => {
  await requireAdmin();

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      timezone: true,
      language: true,
      theme: true,
      createdAt: true,
      updatedAt: true,
      _count: {
        select: {
          notes: true,
          tasks: true,
          bookmarks: true,
          apiKeys: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return ok(users);
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const admin = await requireAdmin();
  const targetId = request.nextUrl.searchParams.get("id");

  if (!targetId) {
    return fail("missing_id", "User ID is required.");
  }

  if (targetId === admin.userId) {
    return fail("cannot_delete_self", "You cannot delete your own account.");
  }

  const exists = await prisma.user.findUnique({ where: { id: targetId } });
  if (!exists) {
    return fail("not_found", "User not found.", 404);
  }

  await prisma.user.delete({ where: { id: targetId } });

  return ok({ deleted: true });
});
