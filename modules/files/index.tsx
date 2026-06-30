"use client";

import { Download, FileArchive, FileImage, FolderPlus, RefreshCw, Trash2, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { EmptyState } from "@/components/ui/empty-state";
import { formatBytes } from "@/lib/utils";
import type { ApiResponse, StoredFile } from "@/types/api";
import type { ModuleProps } from "@/types/module-props";

export function FilesModule({}: ModuleProps) {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [folder, setFolder] = useState("inbox");
  const [busy, setBusy] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const loadFiles = useCallback(async () => {
    const response = await fetch("/api/v1/files", { cache: "no-store" });
    const payload = (await response.json()) as ApiResponse<StoredFile[]>;
    if (payload.ok) {
      setFiles(payload.data);
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  async function uploadFiles(fileList: FileList | File[]) {
    if (!fileList.length) {
      return;
    }

    setBusy(true);
    try {
      const formData = new FormData();
      Array.from(fileList).forEach((file) => formData.append("files", file));
      formData.append("folder", folder || "inbox");

      const response = await fetch("/api/v1/files", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as ApiResponse<StoredFile[]>;
      if (payload.ok) {
        setFiles(payload.data);
      }
    } finally {
      setBusy(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  }

  async function deleteFile(file: StoredFile) {
    const response = await fetch(`/api/v1/files?id=${encodeURIComponent(file.id)}`, {
      method: "DELETE",
    });
    const payload = (await response.json()) as ApiResponse<StoredFile[]>;
    if (payload.ok) {
      setFiles(payload.data);
    }
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
      <section className="grid gap-4 content-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-4 w-4 text-sky-200" aria-hidden />
              Upload
            </CardTitle>
            {busy ? <Badge>Working</Badge> : null}
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input onChange={(event) => setFolder(event.target.value)} value={folder} />
            <button
              className="grid min-h-48 place-items-center rounded-lg border border-dashed border-sky-300/30 bg-sky-300/5 p-6 text-center transition hover:bg-sky-300/10"
              onClick={() => inputRef.current?.click()}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault();
                void uploadFiles(event.dataTransfer.files);
              }}
              type="button"
            >
              <span className="grid gap-3 justify-items-center">
                <FileArchive className="h-8 w-8 text-sky-200" aria-hidden />
                <span className="text-sm font-medium text-white">Drop files here</span>
                <span className="text-xs text-zinc-500">JPG and PNG uploads are converted to WebP with thumbnails.</span>
              </span>
            </button>
            <input
              className="hidden"
              multiple
              onChange={(event) => event.target.files && void uploadFiles(event.target.files)}
              ref={inputRef}
              type="file"
            />
            <div className="flex gap-2">
              <Button onClick={() => inputRef.current?.click()}>
                <Upload className="h-4 w-4" aria-hidden />
                Choose
              </Button>
              <Button onClick={() => void loadFiles()} variant="ghost">
                <RefreshCw className="h-4 w-4" aria-hidden />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderPlus className="h-4 w-4 text-emerald-200" aria-hidden />
              Folders
            </CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {[...new Set(files.map((file) => file.folder || "inbox"))].map((item) => (
              <Badge key={item}>{item}</Badge>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Files</CardTitle>
          <Badge>{files.length} items</Badge>
        </CardHeader>
        <CardContent>
          {files.length ? (
            <div className="grid gap-3">
              {files.map((file) => (
                <div className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-3 sm:grid-cols-[auto_1fr_auto] sm:items-center" key={file.id}>
                  <div className="grid h-14 w-14 place-items-center overflow-hidden rounded-lg border border-white/10 bg-zinc-950/40">
                    {file.thumbnailPath ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt="" className="h-full w-full object-cover" loading="lazy" src={file.thumbnailPath} />
                    ) : (
                      <FileImage className="h-6 w-6 text-zinc-500" aria-hidden />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-white">{file.name}</p>
                    <p className="mt-1 text-xs text-zinc-500">
                      {file.folder} / {formatBytes(file.size)} / {file.type || "application/octet-stream"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={() => window.open(file.path, "_blank", "noopener,noreferrer")} size="icon" title="Download">
                      <Download className="h-4 w-4" aria-hidden />
                    </Button>
                    <Button onClick={() => void deleteFile(file)} size="icon" title="Delete" variant="danger">
                      <Trash2 className="h-4 w-4" aria-hidden />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState icon={Upload} title="No files uploaded yet." />
          )}
        </CardContent>
      </Card>
    </div>
  );
}
