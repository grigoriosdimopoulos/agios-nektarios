import { readMedia } from "@/lib/content";

/** Serves an uploaded file out of the blob store. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string }> },
) {
  const { key } = await params;
  const file = await readMedia(key);
  if (!file) return new Response("Not found", { status: 404 });

  return new Response(new Uint8Array(file.body), {
    headers: {
      "Content-Type": file.contentType,
      "Cache-Control": "public, max-age=31536000, immutable",
      "Content-Length": String(file.body.byteLength),
    },
  });
}
