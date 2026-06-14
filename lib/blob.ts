import { put } from "@vercel/blob"

export interface StoredImage {
  url: string
}

/**
 * Store a yard photo and return its public URL.
 *
 * In production (and any environment with BLOB_READ_WRITE_TOKEN set) this uses
 * Vercel Blob. For local development without a token, it falls back to writing
 * the file into `public/uploads/` and returning a same-origin `/uploads/...`
 * URL so the full analyze flow works with zero external setup.
 */
export async function storeYardImage(
  key: string,
  bytes: Buffer,
  contentType: string,
): Promise<StoredImage> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const blob = await put(`yards/${key}`, bytes, {
      access: "public",
      contentType,
    })
    return { url: blob.url }
  }

  // Local filesystem fallback (development only).
  // Sanitize the caller-supplied key so a crafted value (e.g. a malicious
  // file extension) can't traverse outside the uploads directory. We keep the
  // intended `userId/timestamp.ext` shape but reject anything else, then verify
  // the resolved path stays inside the base dir as defense-in-depth.
  const safeKey = key
    .split("/")
    .map((seg) => seg.replace(/[^A-Za-z0-9._-]/g, "").replace(/\.\.+/g, "."))
    .filter(Boolean)
    .join("/")
  if (!safeKey) throw new Error("Invalid storage key")

  const { writeFile, mkdir } = await import("node:fs/promises")
  const path = await import("node:path")
  const baseDir = path.join(process.cwd(), "public", "uploads", "yards")
  const absPath = path.join(baseDir, safeKey)
  if (absPath !== baseDir && !absPath.startsWith(baseDir + path.sep)) {
    throw new Error("Invalid storage path")
  }
  await mkdir(path.dirname(absPath), { recursive: true })
  await writeFile(absPath, bytes)
  const relPath = path.relative(path.join(process.cwd(), "public"), absPath)
  return { url: `/${relPath.split(path.sep).join("/")}` }
}
