"use client";

import { Disc3, ListMusic, Loader2, Pause, Play, Plus, Repeat, Shuffle, SkipBack, SkipForward, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { ApiResponse } from "@/types/api";
import type { ModuleProps } from "@/types/module-props";

interface TrackData {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: string;
  format: string;
  accent: string;
  fileUrl: string | null;
  createdAt?: string;
}

export function MusicModule({}: ModuleProps) {
  const [tracks, setTracks] = useState<TrackData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string>("");
  const [playing, setPlaying] = useState(false);
  const [shuffle, setShuffle] = useState(false);
  const [repeat, setRepeat] = useState(false);
  const [showAdd, setShowAdd] = useState(false);
  const [addTitle, setAddTitle] = useState("");
  const [addArtist, setAddArtist] = useState("");
  const [addAlbum, setAddAlbum] = useState("");
  const [addDuration, setAddDuration] = useState("04:00");
  const [addFormat, setAddFormat] = useState("MP3");
  const [addAccent, setAddAccent] = useState("from-cyan-300 to-emerald-300");
  const [addLoading, setAddLoading] = useState(false);

  const loadTracks = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/v1/music");
      const payload = (await response.json()) as ApiResponse<TrackData[]>;
      if (payload.ok) {
        setTracks(payload.data);
        if (!activeId && payload.data.length) {
          setActiveId(payload.data[0].id);
        }
      }
      setError(null);
    } catch {
      setError("Failed to load tracks.");
    } finally {
      setLoading(false);
    }
  }, [activeId]);

  useEffect(() => {
    void loadTracks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const active = useMemo(() => tracks.find((track) => track.id === activeId) ?? tracks[0], [tracks, activeId]);
  const activeIndex = tracks.findIndex((track) => track.id === active?.id);

  function move(offset: number) {
    if (!tracks.length) return;
    const nextIndex = (activeIndex + offset + tracks.length) % tracks.length;
    setActiveId(tracks[nextIndex].id);
  }

  async function addTrack() {
    if (!addTitle.trim() || !addArtist.trim()) return;

    setAddLoading(true);
    try {
      const response = await fetch("/api/v1/music", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: addTitle.trim(),
          artist: addArtist.trim(),
          album: addAlbum.trim() || "Unknown",
          duration: addDuration,
          format: addFormat,
          accent: addAccent,
        }),
      });
      const payload = (await response.json()) as ApiResponse<TrackData>;
      if (payload.ok) {
        setTracks((current) => [...current, payload.data]);
        setShowAdd(false);
        setAddTitle("");
        setAddArtist("");
        setAddAlbum("");
      }
    } catch {
      setError("Failed to add track.");
    } finally {
      setAddLoading(false);
    }
  }

  async function deleteTrack(id: string) {
    try {
      const response = await fetch(`/api/v1/music?id=${encodeURIComponent(id)}`, { method: "DELETE" });
      const payload = (await response.json()) as ApiResponse<{ deleted: boolean }>;
      if (payload.ok) {
        setTracks((current) => current.filter((track) => track.id !== id));
        if (activeId === id) {
          setActiveId(tracks.find((t) => t.id !== id)?.id ?? "");
        }
      }
    } catch {
      setError("Failed to delete track.");
    }
  }

  if (loading) {
    return (
      <div className="grid min-h-[50vh] place-items-center">
        <Loader2 className="h-8 w-8 animate-spin text-lime-200" aria-hidden />
      </div>
    );
  }

  return (
    <div className="grid gap-4 xl:grid-cols-[0.85fr_1.15fr]">
      {active ? (
        <Card className="overflow-hidden">
          <div className={`h-44 bg-gradient-to-br ${active.accent}`} />
          <CardContent className="grid gap-5 p-5">
            <div>
              <Badge>{active.format}</Badge>
              <h2 className="mt-4 text-3xl font-semibold text-white">{active.title}</h2>
              <p className="mt-2 text-sm text-zinc-400">
                {active.artist} / {active.album}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2">
              <Button onClick={() => setShuffle((value) => !value)} size="icon" title="Shuffle" variant={shuffle ? "primary" : "secondary"}>
                <Shuffle className="h-4 w-4" aria-hidden />
              </Button>
              <Button onClick={() => move(-1)} size="icon" title="Previous">
                <SkipBack className="h-4 w-4" aria-hidden />
              </Button>
              <Button onClick={() => setPlaying((value) => !value)} size="icon" title={playing ? "Pause" : "Play"} variant="primary">
                {playing ? <Pause className="h-4 w-4" aria-hidden /> : <Play className="h-4 w-4" aria-hidden />}
              </Button>
              <Button onClick={() => move(1)} size="icon" title="Next">
                <SkipForward className="h-4 w-4" aria-hidden />
              </Button>
              <Button onClick={() => setRepeat((value) => !value)} size="icon" title="Repeat" variant={repeat ? "primary" : "secondary"}>
                <Repeat className="h-4 w-4" aria-hidden />
              </Button>
            </div>
            <audio className="w-full" controls preload="none">
              <track kind="captions" />
            </audio>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardContent className="grid min-h-44 place-items-center p-6">
            <p className="text-sm text-zinc-500">No tracks yet. Add your first track!</p>
          </CardContent>
        </Card>
      )}

      <section className="grid gap-4 content-start">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ListMusic className="h-4 w-4 text-lime-200" aria-hidden />
              Playlist
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge>{tracks.length} tracks</Badge>
              <Button onClick={() => setShowAdd((v) => !v)} size="sm" variant={showAdd ? "primary" : "secondary"}>
                <Plus className="h-4 w-4" aria-hidden />
                {showAdd ? "Cancel" : "Add"}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="grid gap-3">
            {error ? (
              <p className="rounded-md border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{error}</p>
            ) : null}

            {showAdd ? (
              <div className="grid gap-2 rounded-lg border border-lime-300/20 bg-lime-300/5 p-3">
                <Input onChange={(event) => setAddTitle(event.target.value)} placeholder="Title" value={addTitle} />
                <Input onChange={(event) => setAddArtist(event.target.value)} placeholder="Artist" value={addArtist} />
                <Input onChange={(event) => setAddAlbum(event.target.value)} placeholder="Album" value={addAlbum} />
                <div className="grid grid-cols-2 gap-2">
                  <Input onChange={(event) => setAddDuration(event.target.value)} placeholder="Duration (04:18)" value={addDuration} />
                  <select
                    className="h-10 rounded-md border border-white/10 bg-zinc-950/50 px-3 text-sm text-white outline-none"
                    onChange={(event) => setAddFormat(event.target.value)}
                    value={addFormat}
                  >
                    <option value="MP3">MP3</option>
                    <option value="FLAC">FLAC</option>
                    <option value="WAV">WAV</option>
                    <option value="AAC">AAC</option>
                  </select>
                </div>
                <select
                  className="h-10 rounded-md border border-white/10 bg-zinc-950/50 px-3 text-sm text-white outline-none"
                  onChange={(event) => setAddAccent(event.target.value)}
                  value={addAccent}
                >
                  <option value="from-cyan-300 to-emerald-300">Cyan → Emerald</option>
                  <option value="from-amber-300 to-rose-300">Amber → Rose</option>
                  <option value="from-sky-300 to-fuchsia-300">Sky → Fuchsia</option>
                  <option value="from-violet-300 to-pink-200">Violet → Pink</option>
                  <option value="from-lime-300 to-teal-200">Lime → Teal</option>
                </select>
                <Button disabled={addLoading} onClick={() => void addTrack()} size="sm" variant="primary">
                  {addLoading ? "Saving..." : "Save Track"}
                </Button>
              </div>
            ) : null}

            {tracks.map((track) => (
              <div
                className={`grid gap-3 rounded-lg border p-3 text-left transition sm:grid-cols-[auto_1fr_auto] sm:items-center ${
                  track.id === active?.id
                    ? "border-lime-300/30 bg-lime-300/10"
                    : "border-white/10 bg-white/[0.045] hover:border-white/20 hover:bg-white/[0.07]"
                }`}
                key={track.id}
              >
                <button
                  className={`grid h-12 w-12 place-items-center rounded-lg bg-gradient-to-br ${track.accent}`}
                  onClick={() => setActiveId(track.id)}
                  type="button"
                >
                  <Disc3 className="h-5 w-5 text-zinc-950" aria-hidden />
                </button>
                <button
                  className="min-w-0 text-left"
                  onClick={() => setActiveId(track.id)}
                  type="button"
                >
                  <span className="block truncate text-sm font-medium text-white">{track.title}</span>
                  <span className="mt-1 block truncate text-xs text-zinc-500">{track.artist}</span>
                </button>
                <span className="flex items-center gap-2">
                  <Badge>{track.format}</Badge>
                  <span className="font-mono text-xs text-zinc-500">{track.duration}</span>
                  <Button onClick={() => void deleteTrack(track.id)} size="icon" title="Delete" variant="ghost">
                    <Trash2 className="h-3.5 w-3.5" aria-hidden />
                  </Button>
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
