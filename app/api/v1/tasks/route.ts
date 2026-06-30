import { type NextRequest } from "next/server";
import { ok, fail, parseJson, withErrorHandling } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const GET = withErrorHandling(async () => {
  const userId = await requireUserId();

  const tasks = await prisma.task.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return ok(tasks);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();

  const body = await parseJson<{
    id?: string;
    title: string;
    priority: string;
    progress: number;
    due: string;
    done: boolean;
  }>(request);

  if (!body || !body.title) {
    return fail("missing_fields", "Title is required.");
  }

  const task = await prisma.task.create({
    data: {
      id: body.id ?? crypto.randomUUID(),
      userId,
      title: body.title,
      priority: body.priority ?? "Medium",
      progress: body.progress ?? 0,
      due: body.due ?? null,
      done: body.done ?? false,
    },
  });

  return ok(task);
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();

  const body = await parseJson<{
    id: string;
    title?: string;
    priority?: string;
    progress?: number;
    due?: string;
    done?: boolean;
  }>(request);

  if (!body || !body.id) {
    return fail("missing_fields", "Task ID is required.");
  }

  const existing = await prisma.task.findUnique({ where: { id: body.id } });
  if (!existing || existing.userId !== userId) {
    return fail("not_found", "Task not found.", 404);
  }

  const data: Record<string, unknown> = {};
  if (body.title !== undefined) data.title = body.title;
  if (body.priority !== undefined) data.priority = body.priority;
  if (body.progress !== undefined) data.progress = body.progress;
  if (body.due !== undefined) data.due = body.due;
  if (body.done !== undefined) data.done = body.done;

  const task = await prisma.task.update({
    where: { id: body.id },
    data,
  });

  return ok(task);
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return fail("missing_id", "Task ID is required.");
  }

  const existing = await prisma.task.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return fail("not_found", "Task not found.", 404);
  }

  await prisma.task.delete({ where: { id } });
  return ok({ deleted: true });
});
