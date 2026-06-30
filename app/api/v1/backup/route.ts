import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { type NextRequest } from "next/server";
import { ok, fail, parseJson, withErrorHandling } from "@/lib/api";
import { env } from "@/lib/config";

function backupPath() {
  return path.resolve(env.LUXION_BACKUP_PATH);
}

export const POST = withErrorHandling(async () => {
  const root = backupPath();
  await mkdir(root, { recursive: true });

  const exportedAt = new Date().toISOString();
  const fileName = `luxion-backup-${exportedAt.replace(/[:.]/g, "-")}.json`;

  const data: Record<string, unknown> = {
    exportedAt,
    version: "0.1.0",
    data: {},
  };

  try {
    const metaPath = path.join(path.resolve(env.LUXION_STORAGE_PATH), ".luxion-files.json");
    const meta = await readFile(metaPath, "utf8");
    (data.data as Record<string, unknown>).files = JSON.parse(meta);
  } catch {
    (data.data as Record<string, unknown>).files = [];
  }

  const filePath = path.join(root, fileName);
  await writeFile(filePath, JSON.stringify(data, null, 2), "utf8");

  return ok({ path: filePath, exportedAt });
});

export const PUT = withErrorHandling(async (request: NextRequest) => {
  const body = await parseJson<Record<string, unknown>>(request);
  if (!body) {
    return fail("invalid_body", "Invalid backup payload.");
  }

  const root = backupPath();
  await mkdir(root, { recursive: true });

  const importedAt = new Date().toISOString();
  const fileName = `luxion-import-${importedAt.replace(/[:.]/g, "-")}.json`;
  const filePath = path.join(root, fileName);
  await writeFile(filePath, JSON.stringify(body, null, 2), "utf8");

  return ok({ imported: true, path: filePath });
});
