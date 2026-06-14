"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import type { CommentRow } from "@/lib/queries"
import { addComment } from "@/app/actions/social"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Send } from "lucide-react"

export function CommentsSection({ postId, comments }: { postId: number; comments: CommentRow[] }) {
  const router = useRouter()
  const [body, setBody] = useState("")
  const [isPending, startTransition] = useTransition()

  function submit() {
    const trimmed = body.trim()
    if (!trimmed) return
    startTransition(async () => {
      await addComment(postId, trimmed)
      setBody("")
      router.refresh()
    })
  }

  return (
    <section className="space-y-4">
      <h2 className="font-serif text-xl font-extrabold text-foreground">
        Cheers &amp; tips {comments.length > 0 ? `(${comments.length})` : ""}
      </h2>

      <div className="flex gap-3">
        <Textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Share encouragement or a growing tip..."
          rows={2}
          disabled={isPending}
        />
        <Button onClick={submit} disabled={isPending || !body.trim()} size="icon" className="h-auto self-stretch px-4 glow-primary">
          <Send className="h-4 w-4" />
          <span className="sr-only">Post comment</span>
        </Button>
      </div>

      {comments.length === 0 ? (
        <p className="text-sm text-muted-foreground">No comments yet. Be the first to cheer this garden on.</p>
      ) : (
        <ul className="flex flex-col gap-4">
          {comments.map((c) => (
            <li key={c.id} className="flex gap-3">
              <Avatar className="h-9 w-9 border border-border">
                <AvatarImage src={c.author.avatarUrl ?? undefined} alt={c.author.displayName} />
                <AvatarFallback>{c.author.displayName.charAt(0).toUpperCase()}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-2xl bg-secondary px-4 py-3 shadow-soft">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-foreground">{c.author.displayName}</span>
                  <span className="text-xs text-muted-foreground">@{c.author.handle}</span>
                </div>
                <p className="text-pretty text-sm leading-relaxed text-foreground/90">{c.body}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
