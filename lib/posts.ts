import { readFileSync, readdirSync } from "node:fs"
import { join } from "node:path"
import matter from "gray-matter"

// "Field Notes" — Markdown blog posts in content/learn/*.md. No DB: anyone can
// add a post by dropping a file. Read at build time (static generation).

const DIR = join(process.cwd(), "content", "learn")

export interface PostMeta {
  slug: string
  title: string
  excerpt: string
  category: string
  date: string
  author: string
  readingTime: number // minutes
}

export interface Post extends PostMeta {
  content: string // markdown body
}

function readingTime(text: string): number {
  const words = text.trim().split(/\s+/).length
  return Math.max(1, Math.round(words / 200))
}

function parse(file: string): Post {
  const slug = file.replace(/\.md$/, "")
  const raw = readFileSync(join(DIR, file), "utf8")
  const { data, content } = matter(raw)
  return {
    slug,
    title: String(data.title ?? slug),
    excerpt: String(data.excerpt ?? ""),
    category: String(data.category ?? "Field Note"),
    date: String(data.date ?? ""),
    author: String(data.author ?? "The Anima Commune"),
    readingTime: readingTime(content),
    content,
  }
}

export function getAllPosts(): PostMeta[] {
  let files: string[] = []
  try {
    files = readdirSync(DIR).filter((f) => f.endsWith(".md"))
  } catch {
    return []
  }
  return files
    .map((f) => {
      const { content, ...meta } = parse(f)
      void content
      return meta
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1))
}

export function getPost(slug: string): Post | null {
  try {
    return parse(`${slug}.md`)
  } catch {
    return null
  }
}
