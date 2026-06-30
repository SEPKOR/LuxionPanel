import { type NextRequest } from "next/server";
import { ok, fail, parseJson, withErrorHandling } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

export const GET = withErrorHandling(async () => {
  const userId = await requireUserId();

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      timezone: true,
      language: true,
      theme: true,
      animations: true,
      compactMode: true,
      weatherLocation: true,
      modulePreferences: true,
      createdAt: true,
    },
  });

  if (!user) {
    return fail("not_found", "User not found.", 404);
  }

  return ok(user);
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();

  const body = await parseJson<{
    name?: string;
    timezone?: string;
    language?: string;
    theme?: string;
    animations?: boolean;
    compactMode?: boolean;
    weatherLocation?: string;
    modulePreferences?: string;
  }>(request);

  if (!body) {
    return fail("missing_body", "Request body is required.");
  }

  const data: Record<string, unknown> = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.timezone !== undefined) data.timezone = body.timezone;
  if (body.language !== undefined) data.language = body.language;
  if (body.theme !== undefined) data.theme = body.theme;
  if (body.animations !== undefined) data.animations = body.animations;
  if (body.compactMode !== undefined) data.compactMode = body.compactMode;
  if (body.weatherLocation !== undefined) data.weatherLocation = body.weatherLocation;
  if (body.modulePreferences !== undefined) data.modulePreferences = body.modulePreferences;

  const user = await prisma.user.update({
    where: { id: userId },
    data,
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
      timezone: true,
      language: true,
      theme: true,
      animations: true,
      compactMode: true,
      weatherLocation: true,
      modulePreferences: true,
      createdAt: true,
    },
  });

  return ok(user);
});
