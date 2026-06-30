import { type NextRequest } from "next/server";
import { ok, fail, parseJson, withErrorHandling } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const GET = withErrorHandling(async () => {
  const userId = await requireUserId();

  const notes = await prisma.note.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
  });

  return ok(
    notes.map((note: { id: string; userId: string; title: string; body: string; category: string; tags: string; pinned: boolean; createdAt: Date; updatedAt: Date }) => ({
      ...note,
      tags: JSON.parse(note.tags) as string[],
    })),
  );
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();

  const body = await parseJson<{
    id?: string;
    title: string;
    body: string;
    category: string;
    tags: string[];
    pinned: boolean;
  }>(request);

  if (!body || !body.title) {
    return fail("missing_fields", "Title is required.");
  }

  const note = await prisma.note.create({
    data: {
      id: body.id ?? crypto.randomUUID(),
      userId,
      title: body.title,
      body: body.body ?? "",
      category: body.category ?? "Inbox",
      tags: JSON.stringify(body.tags ?? []),
      pinned: body.pinned ?? false,
    },
  });

  return ok({ ...note, tags: JSON.parse(note.tags) as string[] });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();

  const body = await parseJson<{
    id: string;
    title?: string;
    body?: string;
    category?: string;
    tags?: string[];
    pinned?: boolean;
  }>(request);

  if (!body || !body.id) {
    return fail("missing_fields", "Note ID is required.");
  }

  const existing = await prisma.note.findUnique({ where: { id: body.id } });
  if (!existing || existing.userId !== userId) {
    return fail("not_found", "Note not found.", 404);
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.body !== undefined) data.body = body.body;
  if (body.category !== undefined) data.category = body.category;
  if (body.tags !== undefined) data.tags = JSON.stringify(body.tags);
  if (body.pinned !== undefined) data.pinned = body.pinned;

  const note = await prisma.note.update({
    where: { id: body.id },
    data,
  });

  return ok({ ...note, tags: JSON.parse(note.tags) as string[] });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return fail("missing_id", "Note ID is required.");
  }

  const existing = await prisma.note.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return fail("not_found", "Note not found.", 404);
  }

  await prisma.note.delete({ where: { id } });
  return ok({ deleted: true });
});
