import { ok } from "@/lib/api";

export async function GET() {
  return ok({
    status: "healthy",
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
}
