import { type NextRequest, NextResponse } from "next/server";
import { getStoredFileContent } from "@/lib/file-storage";

export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  const thumb = request.nextUrl.searchParams.get("thumb") === "1";

  if (!id) {
    return NextResponse.json({ error: "Missing file ID" }, { status: 400 });
  }

  const file = await getStoredFileContent(id, thumb);
  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  return new NextResponse(file.bytes, {
    headers: {
      "Content-Type": file.type,
      "Content-Disposition": `inline; filename="${encodeURIComponent(file.name)}"`,
      "Cache-Control": "public, max-age=31536000, immutable",
    },
  });
}
