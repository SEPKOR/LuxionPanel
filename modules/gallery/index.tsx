"use client";

import { ImageOff, Maximize2, Search, X } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { formatBytes } from "@/lib/utils";
import type { ApiResponse, StoredFile } from "@/types/api";
import type { ModuleProps } from "@/types/module-props";

export function GalleryModule({}: ModuleProps) {
  const [files, setFiles] = useState<StoredFile[]>([]);
  const [query, setQuery] = useState("");
  const [album, setAlbum] = useState("all");
  const [active, setActive] = useState<StoredFile | null>(null);

  const loadFiles = useCallback(async () => {
    const response = await fetch("/api/v1/files");
    const payload = (await response.json()) as ApiResponse<StoredFile[]>;
    if (payload.ok) {
      setFiles(payload.data.filter((file) => file.type.startsWith("image/")));
    }
  }, []);

  useEffect(() => {
    void loadFiles();
  }, [loadFiles]);

  const albums = useMemo(() => ["all", ...new Set(files.map((file) => file.folder || "inbox"))], [files]);
  const visible = useMemo(() => {
    const search = query.trim().toLowerCase();
    return files.filter((file) => {
      const matchesAlbum = album === "all" || file.folder === album;
      const matchesSearch = !search || [file.name, file.folder, file.type].some((item) => item.toLowerCase().includes(search));
      return matchesAlbum && matchesSearch;
    });
  }, [album, files, query]);

  return (
    <div className="grid gap-4">
      <Card>
        <CardContent className="grid gap-3 p-4 md:grid-cols-[1fr_auto] md:items-center">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <Input className="pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Search gallery" value={query} />
          </div>
          <div className="flex flex-wrap gap-2">
            {albums.map((item) => (
              <button
                className={`h-8 rounded-md border px-3 text-xs font-medium transition ${
                  item === album ? "border-fuchsia-300/40 bg-fuchsia-300/15 text-fuchsia-100" : "border-white/10 bg-white/[0.06] text-zinc-300 hover:bg-white/[0.1]"
                }`}
                key={item}
                onClick={() => setAlbum(item)}
                type="button"
              >
                {item}
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {visible.length ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
          {visible.map((file) => (
            <button
              className="group overflow-hidden rounded-lg border border-white/10 bg-white/[0.045] text-left transition hover:border-fuchsia-300/30"
              key={file.id}
              onClick={() => setActive(file)}
              type="button"
            >
              <div className="relative aspect-square bg-zinc-950/50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img alt={file.name} className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.03]" decoding="async" loading="lazy" src={file.thumbnailPath || file.path} />
                <span className="absolute right-2 top-2 grid h-7 w-7 place-items-center rounded-md bg-black/45 text-white opacity-0 transition group-hover:opacity-100">
                  <Maximize2 className="h-4 w-4" aria-hidden />
                </span>
              </div>
              <div className="p-3">
                <p className="truncate text-sm font-medium text-white">{file.name}</p>
                <p className="mt-1 text-xs text-zinc-500">{formatBytes(file.size)}</p>
              </div>
            </button>
          ))}
        </div>
      ) : (
        <EmptyState icon={ImageOff} title="Upload images in Files to populate the gallery." />
      )}

      <AnimatePresence>
        {active ? (
          <motion.div
            animate={{ opacity: 1 }}
            className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-4 backdrop-blur-md"
            exit={{ opacity: 0 }}
            initial={{ opacity: 0 }}
          >
            <button aria-label="Close" className="absolute right-4 top-4 grid h-10 w-10 place-items-center rounded-md bg-white/10 text-white" onClick={() => setActive(null)} type="button">
              <X className="h-5 w-5" aria-hidden />
            </button>
            <div className="grid max-h-[90vh] max-w-5xl gap-3">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt={active.name} className="max-h-[78vh] rounded-lg object-contain" decoding="async" src={active.path} />
              <Card>
                <CardHeader>
                  <CardTitle>{active.name}</CardTitle>
                  <Badge>{active.type}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-400">
                    {active.folder} / {formatBytes(active.size)} / {new Date(active.createdAt).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
