import { generateText, Output } from "ai"
import { createGoogleGenerativeAI } from "@ai-sdk/google"
import { z } from "zod"
import type { YardPlan, PlantingMarker } from "@/lib/types"
import { storeYardImage } from "@/lib/blob"

function google() {
  const key = process.env.GEMINI_API_KEY || process.env.GOOGLE_GENERATIVE_AI_API_KEY
  return createGoogleGenerativeAI({ apiKey: key })
}

/** Load the original yard photo bytes from its stored URL (blob https or local). */
async function getImageBytes(imageUrl: string): Promise<{ bytes: Buffer; mimeType: string }> {
  if (/^https?:\/\//.test(imageUrl)) {
    const res = await fetch(imageUrl, { cache: "no-store" })
    if (!res.ok) throw new Error(`fetch image ${res.status}`)
    const buf = Buffer.from(await res.arrayBuffer())
    return { bytes: buf, mimeType: res.headers.get("content-type") || "image/jpeg" }
  }
  // local dev fallback path like "/uploads/yards/.."
  const { readFile } = await import("node:fs/promises")
  const path = await import("node:path")
  const abs = path.join(process.cwd(), "public", imageUrl.replace(/^\//, ""))
  const bytes = await readFile(abs)
  const ext = path.extname(abs).toLowerCase()
  const mimeType = ext === ".png" ? "image/png" : "image/jpeg"
  return { bytes, mimeType }
}

/**
 * "Transformed" view — re-render the yard photo with the recommended plants
 * grown in, keeping the same camera angle and structures. Returns a stored URL.
 */
export async function renderTransformed(opts: {
  imageUrl: string
  plan: YardPlan
  userId: string
}): Promise<string> {
  const { bytes, mimeType } = await getImageBytes(opts.imageUrl)
  const plantList = opts.plan.plants
    .map((p) => p.name.replace(/\s*\([^)]*\)/g, ""))
    .slice(0, 8)
    .join(", ")

  const prompt = `Edit this photo of a real yard to show how it could look once thoughtfully planted. Add these plants in the open/plantable areas, arranged naturally and at realistic sizes: ${plantList}. Keep the SAME camera angle, lighting, buildings, fences, paths, and hardscape — only transform the plantable ground. Make it lush but believable, photorealistic, natural daylight. Do not add people, text, or watermarks.`

  const r = await generateText({
    model: google()("gemini-2.5-flash-image"),
    providerOptions: { google: { responseModalities: ["TEXT", "IMAGE"] } },
    messages: [
      {
        role: "user",
        content: [
          { type: "text", text: prompt },
          { type: "image", image: `data:${mimeType};base64,${bytes.toString("base64")}` },
        ],
      },
    ],
  })

  const img = (r.files ?? []).find((f) => f.mediaType?.startsWith("image/"))
  if (!img) throw new Error("No image returned from the model")

  const out = Buffer.from(img.uint8Array)
  const stored = await storeYardImage(`${opts.userId}/render-${Date.now()}.png`, out, "image/png")
  return stored.url
}

const layoutSchema = z.object({
  markers: z
    .array(
      z.object({
        x: z.number().describe("horizontal position as a percentage of the image width, 0 (left) to 100 (right)"),
        y: z.number().describe("vertical position as a percentage of the image height, 0 (top) to 100 (bottom)"),
        plant: z.string().describe("the plant to put here"),
        why: z.string().describe("one short reason this spot suits this plant (sun, soil, edge, screening, etc.)"),
      }),
    )
    .describe("3-7 placements over the actual plantable areas of THIS photo"),
})

/**
 * "Planting map" view — ask the model WHERE on the real photo each plant should
 * go (normalized coordinates) so the UI can draw interactive markers.
 */
export async function planLayout(opts: { imageUrl: string; plan: YardPlan }): Promise<PlantingMarker[]> {
  const { bytes, mimeType } = await getImageBytes(opts.imageUrl)
  const plantList = opts.plan.plants
    .map((p) => p.name.replace(/\s*\([^)]*\)/g, ""))
    .slice(0, 8)
    .join(", ")

  const { experimental_output: parsed } = await generateText({
    model: google()("gemini-2.5-flash"),
    output: Output.object({ schema: layoutSchema }),
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Look at this yard photo. Decide WHERE to plant each of these: ${plantList}. For each placement, give x/y as percentages over THIS image, pointing at actual plantable ground (beds, lawn edges, bare soil, along fences) — not on buildings, sky, or paving. Spread them sensibly across the usable space.`,
          },
          { type: "image", image: `data:${mimeType};base64,${bytes.toString("base64")}` },
        ],
      },
    ],
  })

  return (parsed.markers ?? [])
    .slice(0, 8)
    .map((m) => ({
      x: Math.max(2, Math.min(98, Number(m.x) || 50)),
      y: Math.max(2, Math.min(98, Number(m.y) || 50)),
      plant: String(m.plant ?? "Plant"),
      why: String(m.why ?? ""),
    }))
}
