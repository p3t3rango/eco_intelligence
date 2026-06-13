import * as React from "react"
import { cn } from "@/lib/utils"

function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative flex h-10 w-10 shrink-0 overflow-hidden rounded-full bg-secondary",
        className,
      )}
      {...props}
    />
  )
}

function AvatarImage({ className, alt = "", ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  // eslint-disable-next-line @next/next/no-img-element
  return <img className={cn("aspect-square h-full w-full object-cover", className)} alt={alt} {...props} />
}

function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "flex h-full w-full items-center justify-center text-sm font-semibold text-secondary-foreground",
        className,
      )}
      {...props}
    />
  )
}

export { Avatar, AvatarImage, AvatarFallback }
