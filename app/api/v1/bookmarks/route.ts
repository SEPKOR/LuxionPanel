import { type NextRequest } from "next/server";
import { ok, fail, parseJson, withErrorHandling } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const GET = withErrorHandling(async () => {
  const userId = await requireUserId();

  const bookmarks = await prisma.bookmark.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return ok(bookmarks);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();

  const body = await parseJson<{
    id?: string;
    title: string;
    url: string;
    category: string;
  }>(request);

  if (!body || !body.title || !body.url) {
    return fail("missing_fields", "Title and URL are required.");
  }

  const bookmark = await prisma.bookmark.create({
    data: {
      id: body.id ?? crypto.randomUUID(),
      userId,
      title: body.title,
      url: body.url,
      category: body.category ?? "General",
    },
  });

  return ok(bookmark);
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();

  const body = await parseJson<{
    id: string;
    title?: string;
    url?: string;
    category?: string;
  }>(request);

  if (!body || !body.id) {
    return fail("missing_fields", "Bookmark ID is required.");
  }

  const existing = await prisma.bookmark.findUnique({ where: { id: body.id } });
  if (!existing || existing.userId !== userId) {
    return fail("not_found", "Bookmark not found.", 404);
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.url !== undefined) data.url = body.url;
  if (body.category !== undefined) data.category = body.category;

  const bookmark = await prisma.bookmark.update({
    where: { id: body.id },
    data,
  });

  return ok(bookmark);
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return fail("missing_id", "Bookmark ID is required.");
  }

  const existing = await prisma.bookmark.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return fail("not_found", "Bookmark not found.", 404);
  }

  await prisma.bookmark.delete({ where: { id } });
  return ok({ deleted: true });
});
