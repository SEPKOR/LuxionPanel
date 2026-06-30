import { execFile } from "node:child_process";
import { mkdir, statfs } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { env, pingTargets } from "@/lib/config";
import type { HomelabSnapshot } from "@/types/api";

const execFileAsync = promisify(execFile);

export async function getHomelabSnapshot(): Promise<HomelabSnapshot> {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const cores = Math.max(1, os.cpus().length);
  const load = os.loadavg()[0] || 0;
  const networkInterfaces = Object.values(os.networkInterfaces()).flat().filter(Boolean);

  const [disk, docker, pings] = await Promise.all([getDiskUsage(), getDockerContainers(), getPingResults()]);

  return {
    cpu: Math.min(100, Math.round((load / cores) * 100)),
    ram: Math.min(100, Math.round(((totalMemory - freeMemory) / totalMemory) * 100)),
    disk,
    network: {
      interfaces: Object.keys(os.networkInterfaces()).length,
      addresses: networkInterfaces.length,
    },
    uptimeSeconds: Math.round(os.uptime()),
    docker,
    pings,
    updatedAt: new Date().toISOString(),
  };
}

async function getDiskUsage() {
  const root = path.resolve(env.LUXION_STORAGE_PATH);
  await mkdir(root, { recursive: true });

  try {
    const stats = await statfs(root);
    const total = Number(stats.blocks) * Number(stats.bsize);
    const available = Number(stats.bavail) * Number(stats.bsize);
    if (!total) {
      return 0;
    }
    return Math.min(100, Math.round(((total - available) / total) * 100));
  } catch {
    return 0;
  }
}

async function getDockerContainers() {
  if (!env.LUXION_DOCKER_ENABLED) {
    return [];
  }

  try {
    const { stdout } = await execFileAsync("docker", ["ps", "--format", "{{json .}}"], { timeout: 1500 });
    return stdout
      .split(/\r?\n/)
      .filter(Boolean)
      .slice(0, 20)
      .map((line) => {
        const container = JSON.parse(line) as {
          ID: string;
          Names: string;
          Image: string;
          Status: string;
        };
        return {
          id: container.ID,
          name: container.Names,
          image: container.Image,
          status: container.Status,
        };
      });
  } catch {
    return [];
  }
}

async function getPingResults() {
  return Promise.all(
    pingTargets.map(async (target) => {
      const started = performance.now();
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 1800);

      try {
        await fetch(target, {
          method: "HEAD",
          signal: controller.signal,
        });
        return {
          target,
          latencyMs: Math.round(performance.now() - started),
          online: true,
        };
      } catch {
        return {
          target,
          latencyMs: null,
          online: false,
        };
      } finally {
        clearTimeout(timeout);
      }
    }),
  );
}
