"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { updateProfile } from "@/app/actions/profile"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Pencil, Loader2 } from "lucide-react"

type Profile = {
  displayName: string
  bio: string | null
  locationLabel: string | null
}

export function EditProfile({ profile }: { profile: Profile }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [isPending, startTransition] = useTransition()

  function action(formData: FormData) {
    startTransition(async () => {
      await updateProfile(formData)
      setOpen(false)
      router.refresh()
    })
  }

  if (!open) {
    return (
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <Pencil className="h-3.5 w-3.5" />
        Edit
      </Button>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-foreground/40 p-0 backdrop-blur-sm sm:items-center sm:p-4">
      <form
        action={action}
        className="w-full max-w-md space-y-4 rounded-t-2xl border border-border bg-card p-6 sm:rounded-2xl"
      >
        <h2 className="font-serif text-xl font-semibold text-foreground">Edit profile</h2>
        <div className="space-y-2">
          <Label htmlFor="displayName">Display name</Label>
          <Input id="displayName" name="displayName" defaultValue={profile.displayName} required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea id="bio" name="bio" defaultValue={profile.bio ?? ""} rows={3} placeholder="Tell the community about your land..." />
        </div>
        <div className="space-y-2">
          <Label htmlFor="locationLabel">Location</Label>
          <Input
            id="locationLabel"
            name="locationLabel"
            defaultValue={profile.locationLabel ?? ""}
            placeholder="City, state or ZIP"
          />
        </div>
        <div className="flex gap-3 pt-1">
          <Button type="button" variant="ghost" className="flex-1" onClick={() => setOpen(false)} disabled={isPending}>
            Cancel
          </Button>
          <Button type="submit" className="flex-1" disabled={isPending}>
            {isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}
          </Button>
        </div>
      </form>
    </div>
  )
}
