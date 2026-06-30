import { readdir, stat } from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { ok, withErrorHandling } from "@/lib/api";
import { listFileRecords } from "@/lib/file-storage";
import { env } from "@/lib/config";
import { enabledModules } from "@/lib/modules";

async function getStorageBytes(): Promise<number> {
  const root = path.resolve(env.LUXION_STORAGE_PATH);
  try {
    const entries = await readdir(root, { recursive: true, withFileTypes: true });
    let total = 0;
    for (const entry of entries) {
      if (entry.isFile()) {
        try {
          const stats = await stat(path.join(entry.parentPath ?? root, entry.name));
          total += stats.size;
        } catch {
          // Skip files that can't be read
        }
      }
    }
    return total;
  } catch {
    return 0;
  }
}

export const GET = withErrorHandling(async () => {
  const [storageBytes, files] = await Promise.all([
    getStorageBytes(),
    listFileRecords(),
  ]);

  return ok({
    storageBytes,
    totalNotes: 0,
    totalFiles: files.length,
    totalTasks: 0,
    activeModules: enabledModules.length,
    uptimeSeconds: Math.round(os.uptime()),
  });
});
