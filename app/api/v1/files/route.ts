import { type NextRequest } from "next/server";
import { ok, fail, withErrorHandling } from "@/lib/api";
import {
  deleteStoredFile,
  listFileRecords,
  saveUploadedFiles,
} from "@/lib/file-storage";
import { env } from "@/lib/config";

export const GET = withErrorHandling(async () => {
  const files = await listFileRecords();
  return ok(files);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const formData = await request.formData();
  const files = formData.getAll("files") as File[];
  const folder = (formData.get("folder") as string) || "inbox";

  if (!files.length) {
    return fail("no_files", "No files provided.");
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);
  const maxBytes = env.LUXION_UPLOAD_MAX_MB * 1_024 * 1_024;
  if (totalBytes > maxBytes) {
    return fail("upload_too_large", `Upload exceeds limit of ${env.LUXION_UPLOAD_MAX_MB}MB.`);
  }

  const records = await saveUploadedFiles(files, folder);
  return ok(records);
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return fail("missing_id", "File ID is required.");
  }

  const records = await deleteStoredFile(id);
  return ok(records);
});
