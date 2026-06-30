"use client";

import { Loader2, Pin, Plus, RefreshCw, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input, Textarea } from "@/components/ui/input";
import { uid } from "@/lib/utils";
import type { ApiResponse } from "@/types/api";
import type { ModuleProps } from "@/types/module-props";

interface NoteData {
  id: string;
  title: string;
  body: string;
  category: string;
  tags: string[];
  pinned: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export function NotesModule({}: ModuleProps) {
  const [notes, setNotes] = useState<NoteData[]>([]);
  const [activeId, setActiveId] = useState<string>("");
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saveTimer, setSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const activeNote = notes.find((note) => note.id === activeId) ?? notes[0];

  const loadNotes = useCallback(async () => {
    try {
      const response = await fetch("/api/v1/notes");
      const payload = (await response.json()) as ApiResponse<NoteData[]>;
      if (payload.ok) {
        setNotes(payload.data);
        if (!activeId && payload.data.length) {
          setActiveId(payload.data[0].id);
        }
      }
      setError(null);
    } catch {
      setError("Failed to load notes.");
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    void loadNotes();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredNotes = useMemo(() => {
    const value = query.trim().toLowerCase();
    const sorted = [...notes].sort((a, b) => Number(b.pinned) - Number(a.pinned));
    if (!value) return sorted;
    return sorted.filter((note) =>
      [note.title, note.body, note.category, ...note.tags].some((item) => item.toLowerCase().includes(value)),
    );
  }, [notes, query]);

  function scheduleSave(patch: Partial<NoteData>) {
    if (!activeNote) return;

    setNotes((current) =>
      current.map((note) => (note.id === activeNote.id ? { ...note, ...patch } : note)),
    );

    if (saveTimer) clearTimeout(saveTimer);

    const timer = setTimeout(() => {
      void saveToServer(activeNote.id, patch);
    }, 800);

    setSaveTimer(timer);
  }

  async function saveToServer(id: string, patch: Partial<NoteData>) {
    setSaving(true);
    try {
      const response = await fetch("/api/v1/notes", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, ...patch }),
      });
      const payload = (await response.json()) as ApiResponse<NoteData>;
      if (payload.ok) {
        setNotes((current) =>
          current.map((note) => (note.id === id ? { ...note, ...payload.data } : note)),
        );
      }
    } catch {
      setError("Failed to save. Retry?");
    } finally {
      setSaving(false);
    }
  }

  async function addNote() {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: uid("note"),
          title: "Untitled note",
          category: "Inbox",
          tags: ["draft"],
          pinned: false,
          body: "Start writing...",
        }),
      });
      const payload = (await response.json()) as ApiResponse<NoteData>;
      if (payload.ok) {
        setNotes((current) => [payload.data, ...current]);
        setActiveId(payload.data.id);
      }
    } catch {
      setError("Failed to create note.");
    } finally {
      setLoading(false);
    }
  }

  async function deleteNote(id: string) {
    try {
      const response = await fetch(`/api/v1/notes?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse<{ deleted: boolean }>;
      if (payload.ok) {
        setNotes((current) => current.filter((note) => note.id !== id));
        if (activeId === id) {
          setActiveId(notes.find((n) => n.id !== id)?.id ?? "");
        }
      }
    } catch {
      setError("Failed to delete note.");
    }
  }

  if (loading && !notes.length) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-200" aria-hidden />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.72fr_1.28fr]">
      <section className="grid gap-4">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" aria-hidden />
            <Input className="pl-9" onChange={(event) => setQuery(event.target.value)} placeholder="Search notes" value={query} />
          </div>
          <Button onClick={() => void addNote()} size="icon" title="New note" disabled={loading}>
            <Plus className="h-4 w-4" aria-hidden />
          </Button>
        </div>

        {error ? (
          <div className="flex items-center gap-2 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">
            <span>{error}</span>
            <Button onClick={() => void loadNotes()} size="sm" variant="ghost">
              <RefreshCw className="h-3.5 w-3.5" aria-hidden />
              Retry
            </Button>
          </div>
        ) : null}

        <div className="grid max-h-[64vh] gap-3 overflow-auto pr-1 thin-scrollbar">
          {filteredNotes.map((note) => (
            <button
              className={`rounded-lg border p-4 text-left transition ${
                note.id === activeNote?.id
                  ? "border-cyan-300/30 bg-cyan-300/10"
                  : "border-white/10 bg-white/[0.045] hover:border-white/20 hover:bg-white/[0.07]"
              }`}
              key={note.id}
              onClick={() => setActiveId(note.id)}
              type="button"
            >
              <div className="flex items-start justify-between gap-3">
                <h3 className="line-clamp-1 text-sm font-semibold text-white">{note.title}</h3>
                <div className="flex items-center gap-1 shrink-0">
                  {note.pinned ? <Pin className="h-4 w-4 text-amber-200" aria-hidden /> : null}
                  <button
                    className="grid h-5 w-5 place-items-center rounded text-zinc-600 hover:bg-red-500/10 hover:text-red-300"
                    onClick={(event) => { event.stopPropagation(); void deleteNote(note.id); }}
                    type="button"
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </button>
                </div>
              </div>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-zinc-500">{note.body.replace(/[#_*`>-]/g, "")}</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge>{note.category}</Badge>
                {note.tags.slice(0, 2).map((tag) => (
                  <Badge key={tag}>#{tag}</Badge>
                ))}
              </div>
            </button>
          ))}
        </div>
      </section>

      {activeNote ? (
        <section className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Editor</CardTitle>
              <div className="flex items-center gap-1">
                {saving ? <span className="text-xs text-cyan-200">Saving...</span> : <span className="text-xs text-zinc-500">Saved</span>}
                <Button onClick={() => scheduleSave({ pinned: !activeNote.pinned })} size="sm">
                  <Pin className="h-4 w-4" aria-hidden />
                  {activeNote.pinned ? "Pinned" : "Pin"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="grid gap-3">
              <Input
                onChange={(event) => scheduleSave({ title: event.target.value })}
                value={activeNote.title}
              />
              <div className="grid gap-3 sm:grid-cols-2">
                <Input
                  onChange={(event) => scheduleSave({ category: event.target.value })}
                  value={activeNote.category}
                />
                <Input
                  onChange={(event) =>
                    scheduleSave({
                      tags: event.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter(Boolean),
                    })
                  }
                  value={activeNote.tags.join(", ")}
                />
              </div>
              <Textarea
                className="min-h-[360px] font-mono text-sm"
                onChange={(event) => scheduleSave({ body: event.target.value })}
                value={activeNote.body}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Preview</CardTitle>
            </CardHeader>
            <CardContent>
              <article className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-zinc-300 prose-li:text-zinc-300 prose-strong:text-white">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{activeNote.body}</ReactMarkdown>
              </article>
            </CardContent>
          </Card>
        </section>
      ) : null}
    </div>
  );
}
