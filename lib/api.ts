import { NextResponse, type NextRequest } from "next/server";
import { env } from "@/lib/config";
import { log } from "@/lib/logger";
import type { ApiResponse } from "@/types/api";

const buckets = new Map<string, { count: number; resetAt: number }>();

export function ok<T>(data: T, init?: ResponseInit) {
  return NextResponse.json<ApiResponse<T>>({ ok: true, data }, init);
}

export function fail(code: string, message: string, status = 400) {
  return NextResponse.json<ApiResponse<null>>(
    {
      ok: false,
      data: null,
      error: { code, message },
    },
    { status },
  );
}

export function getClientKey(request: NextRequest) {
  return (
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "local"
  );
}

const MAX_BUCKETS = 10_000;

function purgeExpiredBuckets(now: number) {
  if (buckets.size > MAX_BUCKETS) {
    for (const [key, bucket] of buckets) {
      if (bucket.resetAt < now) {
        buckets.delete(key);
      }
    }
  }
}

export function rateLimit(request: NextRequest, scope: string) {
  const key = `${scope}:${getClientKey(request)}`;
  const now = Date.now();
  purgeExpiredBuckets(now);

  const current = buckets.get(key);

  if (!current || current.resetAt < now) {
    buckets.set(key, { count: 1, resetAt: now + env.LUXION_RATE_LIMIT_WINDOW_MS });
    return null;
  }

  current.count += 1;
  if (current.count > env.LUXION_RATE_LIMIT_MAX) {
    log("warn", "rate_limit_exceeded", { scope, key });
    return fail("rate_limit_exceeded", "Too many requests.", 429);
  }

  return null;
}

export async function parseJson<T>(request: NextRequest): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>,
): (...args: T) => Promise<Response> {
  return async (...args: T) => {
    try {
      return await handler(...args);
    } catch (error) {
      log("error", "api_error", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
      return fail("internal_error", "Internal server error.", 500);
    }
  };
}
