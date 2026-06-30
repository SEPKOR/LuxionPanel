import { type NextRequest } from "next/server";
import { z } from "zod";
import { ok, fail, parseJson, withErrorHandling } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/session";
import { hashPassword } from "@/lib/password";

const resetSchema = z.object({
  userId: z.string().min(1),
  newPassword: z.string().min(8, "Password must be at least 8 characters"),
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  await requireAdmin();

  const body = await parseJson<{ userId: string; newPassword: string }>(request);
  const parsed = resetSchema.safeParse(body);

  if (!parsed.success) {
    return fail("validation", parsed.error.issues[0]?.message ?? "Invalid input.", 400);
  }

  const user = await prisma.user.findUnique({ where: { id: parsed.data.userId } });
  if (!user) {
    return fail("not_found", "User not found.", 404);
  }

  const hashed = hashPassword(parsed.data.newPassword);

  await prisma.user.update({
    where: { id: user.id },
    data: { password: hashed },
  });

  return ok({ reset: true, email: user.email });
});
