"use client"

import { useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { createPost } from "@/app/actions/posts"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Camera, ImagePlus, Loader2, Lock, MapPin, Sparkles, X } from "lucide-react"

export function GrowUploader({ defaultLocation }: { defaultLocation: string }) {
  const router = useRouter()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const cameraInputRef = useRef<HTMLInputElement>(null)
  const [preview, setPreview] = useState<string | null>(null)
  const [file, setFile] = useState<File | null>(null)
  const [title, setTitle] = useState("")
  const [caption, setCaption] = useState("")
  const [location, setLocation] = useState(defaultLocation)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleFile(selected: File | null) {
    if (!selected) return
    setError(null)
    setFile(selected)
    setPreview(URL.createObjectURL(selected))
  }

  function reset() {
    setFile(null)
    setPreview(null)
    if (fileInputRef.current) fileInputRef.current.value = ""
    if (cameraInputRef.current) cameraInputRef.current.value = ""
  }

  function submit() {
    if (!file) {
      setError("Please add a photo first.")
      return
    }
    setError(null)
    const formData = new FormData()
    formData.append("image", file)
    formData.append("title", title)
    formData.append("caption", caption)
    formData.append("locationLabel", location)

    startTransition(async () => {
      const result = await createPost(formData)
      if (result.ok) {
        router.push(`/post/${result.postId}`)
        router.refresh()
      } else {
        setError(result.error)
      }
    })
  }

  return (
    <div className="space-y-5">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
      />

      {preview ? (
        <div className="relative overflow-hidden rounded-2xl border border-border">
          <Image
            src={preview || "/placeholder.svg"}
            alt="Selected yard"
            width={800}
            height={600}
            className="aspect-[4/3] w-full object-cover"
            unoptimized
          />
          {!isPending && (
            <button
              onClick={reset}
              className="absolute right-3 top-3 rounded-full bg-background/85 p-2 text-foreground backdrop-blur-sm"
              aria-label="Remove photo"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          {isPending && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-background/75 backdrop-blur-sm">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="flex items-center gap-2 text-sm font-medium text-foreground">
                <Sparkles className="h-4 w-4 text-primary" />
                Reading the ecology of your land...
              </p>
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <Camera className="h-7 w-7" />
            <span className="text-sm font-medium">Take photo</span>
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-2xl border border-dashed border-border bg-card p-8 text-muted-foreground transition-colors hover:border-primary hover:text-primary"
          >
            <ImagePlus className="h-7 w-7" />
            <span className="text-sm font-medium">Upload</span>
          </button>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="title">Name this spot</Label>
        <Input
          id="title"
          placeholder="Back garden, front yard, balcony…"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isPending}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="caption">Notes (optional)</Label>
        <Textarea
          id="caption"
          placeholder="What did you plant, change, or notice?"
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          disabled={isPending}
          rows={3}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="flex items-center gap-1.5">
          <MapPin className="h-3.5 w-3.5" />
          Location
        </Label>
        <Input
          id="location"
          placeholder="City, state or ZIP (tailors native plant tips)"
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          disabled={isPending}
        />
      </div>

      {error ? (
        <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <Button onClick={submit} disabled={isPending || !file} variant="gradient" size="lg" className="w-full">
        {isPending ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Analyzing
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Analyze my yard
          </>
        )}
      </Button>

      <p className="flex items-center justify-center gap-1.5 text-center text-xs text-muted-foreground">
        <Lock className="h-3.5 w-3.5" />
        Saved privately to your yard. You can share it for feedback anytime.
      </p>
    </div>
  )
}
