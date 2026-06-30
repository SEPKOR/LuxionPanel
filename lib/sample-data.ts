import type { GlobalSearchItem } from "@/types/module";

export const recentActivities = [
  "Homelab snapshot refreshed",
  "Pinned a deployment note",
  "Created backup manifest",
  "Updated task priorities",
];

export const favoriteShortcuts = [
  { title: "NAS", url: "https://nas.local", accent: "cyan" },
  { title: "Router", url: "https://router.local", accent: "emerald" },
  { title: "Docs", url: "https://docs.local", accent: "amber" },
  { title: "Git", url: "https://github.com", accent: "rose" },
];

export const seedNotes = [
  {
    id: "note_launch",
    title: "Luxion launch checklist",
    category: "Operations",
    tags: ["docker", "backup", "security"],
    pinned: true,
    body: "## Launch\n\n- Configure `NEXTAUTH_SECRET`\n- Run database migration\n- Verify `/api/v1/health`\n- Create first backup",
  },
  {
    id: "note_homelab",
    title: "Homelab audit",
    category: "Infrastructure",
    tags: ["cpu", "ram", "docker"],
    pinned: false,
    body: "Track CPU, RAM, storage pressure, and container uptime before adding heavier services.",
  },
];

export const seedTasks = [
  { id: "task_backup", title: "Enable nightly backup", priority: "High", progress: 70, due: "2026-06-30" },
  { id: "task_notes", title: "Import old markdown notes", priority: "Medium", progress: 35, due: "2026-07-02" },
  { id: "task_gallery", title: "Sort family albums", priority: "Low", progress: 12, due: "2026-07-10" },
];

export const seedBookmarks = [
  { id: "mark_next", title: "Next.js", url: "https://nextjs.org", category: "Development" },
  { id: "mark_prisma", title: "Prisma", url: "https://www.prisma.io", category: "Database" },
  { id: "mark_ollama", title: "Ollama", url: "https://ollama.com", category: "AI" },
];

export const playlist = [
  {
    id: "track_sunrise",
    title: "Local Sunrise",
    artist: "Luxion Library",
    album: "Dashboard Focus",
    duration: "04:18",
    format: "FLAC",
    accent: "from-cyan-300 to-emerald-300",
  },
  {
    id: "track_quiet",
    title: "Quiet Compile",
    artist: "Luxion Library",
    album: "Night Builds",
    duration: "03:42",
    format: "FLAC",
    accent: "from-amber-300 to-rose-300",
  },
  {
    id: "track_orbit",
    title: "Low Orbit",
    artist: "Luxion Library",
    album: "Terminal Mode",
    duration: "05:06",
    format: "MP3",
    accent: "from-sky-300 to-fuchsia-300",
  },
];

export function getGlobalSearchItems(): GlobalSearchItem[] {
  return [
    ...seedNotes.map((note) => ({
      id: note.id,
      moduleId: "notes" as const,
      title: note.title,
      subtitle: `${note.category} note`,
      keywords: [note.body, note.category, ...note.tags],
    })),
    ...seedTasks.map((task) => ({
      id: task.id,
      moduleId: "tasks" as const,
      title: task.title,
      subtitle: `${task.priority} priority`,
      keywords: [task.priority, task.due],
    })),
    ...seedBookmarks.map((bookmark) => ({
      id: bookmark.id,
      moduleId: "bookmarks" as const,
      title: bookmark.title,
      subtitle: bookmark.url,
      keywords: [bookmark.category, bookmark.url],
    })),
    ...playlist.map((track) => ({
      id: track.id,
      moduleId: "music" as const,
      title: track.title,
      subtitle: `${track.artist} - ${track.format}`,
      keywords: [track.artist, track.album, track.format],
    })),
  ];
}
