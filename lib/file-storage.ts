import path from "node:path";
import { mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import sharp from "sharp";
import { env } from "@/lib/config";
import type { StoredFile } from "@/types/api";

interface StoredFileRecord extends StoredFile {
  diskName: string;
  thumbnailName?: string;
}

const metadataName = ".luxion-files.json";

function rootDir() {
  return path.resolve(env.LUXION_STORAGE_PATH);
}

function metadataPath() {
  return path.join(rootDir(), metadataName);
}

function publicPathFor(id: string, thumb = false) {
  const suffix = thumb ? "&thumb=1" : "";
  return `/api/v1/files/raw?id=${encodeURIComponent(id)}${suffix}`;
}

function sanitize(value: string) {
  return value
    .replace(/[^a-zA-Z0-9._-]+/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 96);
}

export async function ensureStorage() {
  await mkdir(rootDir(), { recursive: true });
}

export async function listFileRecords(): Promise<StoredFileRecord[]> {
  await ensureStorage();
  try {
    const data = await readFile(metadataPath(), "utf8");
    const records = JSON.parse(data) as StoredFileRecord[];
    return records.map((record) => ({
      ...record,
      path: publicPathFor(record.id),
      thumbnailPath: record.thumbnailName ? publicPathFor(record.id, true) : undefined,
    }));
  } catch {
    return [];
  }
}

async function saveFileRecords(records: StoredFileRecord[]) {
  await ensureStorage();
  await writeFile(metadataPath(), JSON.stringify(records, null, 2));
}

export async function saveUploadedFiles(files: File[], folder: string) {
  await ensureStorage();
  const records = await listFileRecords();
  const cleanFolder = sanitize(folder || "inbox") || "inbox";
  const folderPath = path.join(rootDir(), cleanFolder);
  await mkdir(folderPath, { recursive: true });

  for (const file of files) {
    const bytes = Buffer.from(await file.arrayBuffer());
    const createdAt = new Date().toISOString();
    const id = `${Date.now().toString(36)}-${crypto.randomUUID()}`;
    const parsedName = path.parse(file.name);
    const baseName = sanitize(parsedName.name || "upload");

    if (file.type === "image/jpeg" || file.type === "image/png") {
      const diskName = `${id}-${baseName}.webp`;
      const thumbnailName = `${id}-${baseName}-thumb.webp`;
      const targetPath = path.join(folderPath, diskName);
      const thumbPath = path.join(folderPath, thumbnailName);
      await sharp(bytes).rotate().webp({ quality: 82 }).toFile(targetPath);
      await sharp(bytes).rotate().resize({ width: 420, height: 420, fit: "cover" }).webp({ quality: 72 }).toFile(thumbPath);
      const stats = await stat(targetPath);
      records.unshift({
        id,
        name: `${baseName}.webp`,
        path: publicPathFor(id),
        thumbnailPath: publicPathFor(id, true),
        type: "image/webp",
        size: stats.size,
        folder: cleanFolder,
        createdAt,
        diskName: path.join(cleanFolder, diskName),
        thumbnailName: path.join(cleanFolder, thumbnailName),
      });
      continue;
    }

    const extension = sanitize(parsedName.ext.replace(".", "")) || "bin";
    const diskName = `${id}-${baseName}.${extension}`;
    const targetPath = path.join(folderPath, diskName);
    await writeFile(targetPath, bytes);
    records.unshift({
      id,
      name: file.name,
      path: publicPathFor(id),
      type: file.type || "application/octet-stream",
      size: file.size,
      folder: cleanFolder,
      createdAt,
      diskName: path.join(cleanFolder, diskName),
    });
  }

  await saveFileRecords(records);
  return listFileRecords();
}

export async function deleteStoredFile(id: string) {
  const records = await listFileRecords();
  const target = records.find((record) => record.id === id);
  if (!target) {
    return records;
  }

  await rm(path.join(rootDir(), target.diskName), { force: true });
  if (target.thumbnailName) {
    await rm(path.join(rootDir(), target.thumbnailName), { force: true });
  }

  const remaining = records.filter((record) => record.id !== id);
  await saveFileRecords(remaining);
  return listFileRecords();
}

export async function getStoredFileContent(id: string, thumb = false) {
  const records = await listFileRecords();
  const target = records.find((record) => record.id === id);
  if (!target) {
    return null;
  }

  const diskName = thumb && target.thumbnailName ? target.thumbnailName : target.diskName;
  const filePath = path.join(rootDir(), diskName);
  const bytes = await readFile(filePath);
  return {
    bytes,
    type: thumb && target.thumbnailName ? "image/webp" : target.type,
    name: target.name,
  };
}
