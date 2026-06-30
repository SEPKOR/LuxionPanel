import { type NextRequest } from "next/server";
import { ok, fail, parseJson, withErrorHandling } from "@/lib/api";
import { prisma } from "@/lib/prisma";
import { requireUserId } from "@/lib/session";

const seedTracks = [
  {
    title: "Local Sunrise",
    artist: "Luxion Library",
    album: "Dashboard Focus",
    duration: "04:18",
    format: "FLAC",
    accent: "from-cyan-300 to-emerald-300",
  },
  {
    title: "Quiet Compile",
    artist: "Luxion Library",
    album: "Night Builds",
    duration: "03:42",
    format: "FLAC",
    accent: "from-amber-300 to-rose-300",
  },
  {
    title: "Low Orbit",
    artist: "Luxion Library",
    album: "Terminal Mode",
    duration: "05:06",
    format: "MP3",
    accent: "from-sky-300 to-fuchsia-300",
  },
];

async function ensureSeeded(userId: string) {
  const count = await prisma.musicTrack.count({ where: { userId } });
  if (count > 0) return;

  const tracks = seedTracks.map((track) => ({
    id: crypto.randomUUID(),
    userId,
    ...track,
  }));

  for (const track of tracks) {
    await prisma.musicTrack.create({ data: track });
  }
}

export const GET = withErrorHandling(async () => {
  const userId = await requireUserId();

  await ensureSeeded(userId);

  const tracks = await prisma.musicTrack.findMany({
    where: { userId },
    orderBy: { createdAt: "asc" },
  });

  return ok(tracks);
});

export const POST = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();

  const body = await parseJson<{
    title: string;
    artist: string;
    album: string;
    duration: string;
    format: string;
    accent: string;
    fileUrl?: string;
  }>(request);

  if (!body || !body.title || !body.artist) {
    return fail("missing_fields", "Title and artist are required.");
  }

  const track = await prisma.musicTrack.create({
    data: {
      id: crypto.randomUUID(),
      userId,
      title: body.title,
      artist: body.artist,
      album: body.album ?? "",
      duration: body.duration ?? "00:00",
      format: body.format ?? "MP3",
      accent: body.accent ?? "from-cyan-300 to-emerald-300",
      fileUrl: body.fileUrl ?? null,
    },
  });

  return ok(track);
});

export const DELETE = withErrorHandling(async (request: NextRequest) => {
  const userId = await requireUserId();
  const id = request.nextUrl.searchParams.get("id");

  if (!id) {
    return fail("missing_id", "Track ID is required.");
  }

  const existing = await prisma.musicTrack.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    return fail("not_found", "Track not found.", 404);
  }

  await prisma.musicTrack.delete({ where: { id } });
  return ok({ deleted: true });
});
