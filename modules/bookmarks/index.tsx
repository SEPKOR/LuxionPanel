"use client";

import { ExternalLink, GripVertical, Loader2, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { uid } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { ModuleProps } from "@/types/module-props";

interface BookmarkData {
  id: string;
  title: string;
  url: string;
  category: string;
  createdAt?: string;
}

function favicon(url: string) {
  try {
    const parsed = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${parsed.hostname}&sz=64`;
  } catch {
    return "";
  }
}

export function BookmarksModule({}: ModuleProps) {
  const [bookmarks, setBookmarks] = useState<BookmarkData[]>([]);
  const [query, setQuery] = useState("");
  const [title, setTitle] = useState("");
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState("General");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [draggedId, setDraggedId] = useState<string | null>(null);

  const loadBookmarks = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/bookmarks");
      const payload = (await response.json()) as ApiResponse<BookmarkData[]>;
      if (payload.ok) {
        setBookmarks(payload.data);
      }
      setError(null);
    } catch {
      setError("Failed to load bookmarks.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadBookmarks();
  }, [loadBookmarks]);

  const categories = useMemo(() => [...new Set(bookmarks.map((bookmark) => bookmark.category))], [bookmarks]);
  const filtered = useMemo(() => {
    const value = query.trim().toLowerCase();
    if (!value) return bookmarks;
    return bookmarks.filter((bookmark) =>
      [bookmark.title, bookmark.url, bookmark.category].some((item) => item.toLowerCase().includes(value)),
    );
  }, [bookmarks, query]);

  async function addBookmark() {
    if (!title.trim() || !url.trim()) return;

    try {
      const response = await fetch("/api/v1/bookmarks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: uid("mark"),
          title: title.trim(),
          url: url.trim(),
          category: category.trim() || "General",
        }),
      });
      const payload = (await response.json()) as ApiResponse<BookmarkData>;
      if (payload.ok) {
        setBookmarks((current) => [payload.data, ...current]);
        setTitle("");
        setUrl("");
      }
    } catch {
      setError("Failed to add bookmark.");
    }
  }

  async function deleteBookmark(id: string) {
    try {
      const response = await fetch(`/api/v1/bookmarks?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse<{ deleted: boolean }>;
      if (payload.ok) {
        setBookmarks((current) => current.filter((item) => item.id !== id));
      }
    } catch {
      setError("Failed to delete bookmark.");
    }
  }

  function reorder(targetId: string) {
    if (!draggedId || draggedId === targetId) return;

    setBookmarks((current) => {
      const moving = current.find((item) => item.id === draggedId);
      if (!moving) return current;
      const without = current.filter((item) => item.id !== draggedId);
      const targetIndex = without.findIndex((item) => item.id === targetId);
      without.splice(targetIndex, 0, moving);
      return without;
    });
  }

  if (loading && !bookmarks.length) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-200" aria-hidden />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.75fr_1.25fr]">
      <section className="grid gap-4 content-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Plus className="h-4 w-4 text-orange-200" aria-hidden />
              Add Bookmark
            </CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <Input onChange={(event) => setTitle(event.target.value)} placeholder="Title" value={title} />
            <Input onChange={(event) => setUrl(event.target.value)} placeholder="https://example.com" value={url} />
            <Input onChange={(event) => setCategory(event.target.value)} placeholder="Category" value={category} />
            <Button onClick={() => void addBookmark()}>
              <Plus className="h-4 w-4" aria-hidden />
              Add
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Categories</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-wrap gap-2">
            {categories.map((item) => (
              <Badge key={item}>{item}</Badge>
            ))}
          </CardContent>
        </Card>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Bookmarks</CardTitle>
          <div className="relative w-full max-w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <Input className="pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Search links" value={query} />
          </div>
        </CardHeader>
        <CardContent className="grid gap-3">
          {error ? (
            <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
              <span>{error}</span>
              <Button onClick={() => void loadBookmarks()} size="sm" variant="ghost">
                <RefreshCw className="h-3.5 w-3.5" aria-hidden />
                Retry
              </Button>
            </div>
          ) : null}
          {filtered.map((bookmark) => (
            <div
              className="grid gap-3 rounded-lg border border-white/10 bg-white/[0.045] p-3 transition hover:border-orange-300/30 sm:grid-cols-[auto_auto_1fr_auto] sm:items-center"
              draggable
              key={bookmark.id}
              onDragEnd={() => setDraggedId(null)}
              onDragOver={(event) => event.preventDefault()}
              onDragStart={() => setDraggedId(bookmark.id)}
              onDrop={() => reorder(bookmark.id)}
            >
              <GripVertical className="h-4 w-4 cursor-grab text-zinc-600" aria-hidden />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img alt="" className="h-8 w-8 rounded-md bg-white" loading="lazy" src={favicon(bookmark.url)} />
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-white">{bookmark.title}</p>
                <p className="mt-1 truncate text-xs text-zinc-500">{bookmark.url}</p>
              </div>
              <div className="flex gap-2">
                <Badge>{bookmark.category}</Badge>
                <Button onClick={() => window.open(bookmark.url, "_blank", "noopener,noreferrer")} size="icon" title="Open">
                  <ExternalLink className="h-4 w-4" aria-hidden />
                </Button>
                <Button onClick={() => void deleteBookmark(bookmark.id)} size="icon" title="Delete" variant="danger">
                  <Trash2 className="h-4 w-4" aria-hidden />
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
