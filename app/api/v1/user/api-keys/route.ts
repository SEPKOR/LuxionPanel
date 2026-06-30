import { type NextRequest } from "next/server";
import { ok, fail, parseJson, withErrorHandling } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";
import { encrypt, decrypt } from "@/lib/crypto";

function maskKey(encrypted: string): string {
  try {
    const decrypted = decrypt(encrypted);
    if (decrypted.length <= 4) return "****";
    return `****${decrypted.slice(-4)}`;
  } catch {
    return "****";
  }
}

export const GET = withErrorHandling(async () => {
  const userId = await requireUserId();

  const keys = await prisma.apiKey.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return ok(
    keys.map((key: { id: string; provider: string; label: string; baseUrl: string; model: string; isDefault: boolean; apiKey: string }) => ({
      id: key.id,
      provider: key.provider,
      label: key.label,
      baseUrl: key.baseUrl,
      model: key.model,
      isDefault: key.isDefault,
      maskedKey: maskKey(key.apiKey),
    })),
  );
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();

  const body = await parseJson<{
    label: string;
    provider: string;
    baseUrl: string;
    apiKey: string;
    model: string;
    isDefault?: boolean;
  }>(request);

  if (!body || !body.label || !body.apiKey) {
    return fail("missing_fields", "Label and API key are required.");
  }

  if (body.isDefault) {
    await prisma.apiKey.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const encrypted = encrypt(body.apiKey);

  const key = await prisma.apiKey.create({
    data: {
      userId,
      provider: body.provider ?? "openai",
      label: body.label,
      baseUrl: body.baseUrl ?? "",
      apiKey: encrypted,
      model: body.model ?? "gpt-4o-mini",
      isDefault: body.isDefault ?? false,
    },
  });

  return ok({
    id: key.id,
    provider: key.provider,
    label: key.label,
    baseUrl: key.baseUrl,
    model: key.model,
    isDefault: key.isDefault,
    maskedKey: maskKey(key.apiKey),
  });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();

  const body = await parseJson<{
    id: string;
    label?: string;
    baseUrl?: string;
    apiKey?: string;
    model?: string;
    isDefault?: boolean;
  }>(request);

  if (!body || !body.id) {
    return fail("missing_fields", "API key ID is required.");
  }

  const existing = await prisma.apiKey.findUnique({ where: { id: body.id } });
  if (!existing || existing.userId !== userId) {
    return fail("not_found", "API key not found.", 404);
  }

  if (body.isDefault) {
    await prisma.apiKey.updateMany({
      where: { userId },
      data: { isDefault: false },
    });
  }

  const data: Record<string, unknown> = {};
  if (body.label !== undefined) data.label = body.label;
  if (body.baseUrl !== undefined) data.baseUrl = body.baseUrl;
  if (body.apiKey !== undefined) data.apiKey = encrypt(body.apiKey);
  if (body.model !== undefined) data.model = body.model;
  if (body.isDefault !== undefined) data.isDefault = body.isDefault;

  const key = await prisma.apiKey.update({
    where: { id: body.id },
    data,
  });

  return ok({
    id: key.id,
    provider: key.provider,
    label: key.label,
    baseUrl: key.baseUrl,
    model: key.model,
    isDefault: key.isDefault,
    maskedKey: maskKey(key.apiKey),
  });
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return fail("missing_id", "API key ID is required.");
  }

  const existing = await prisma.apiKey.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return fail("not_found", "API key not found.", 404);
  }

  await prisma.apiKey.delete({ where: { id } });
  return ok({ deleted: true });
});
