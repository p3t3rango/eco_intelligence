import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-bold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-primary/15 text-primary ring-1 ring-primary/20",
        accent: "bg-accent/25 text-accent-foreground ring-1 ring-accent/30",
        clay: "bg-coral/15 text-coral ring-1 ring-coral/25",
        grape: "bg-grape/15 text-grape ring-1 ring-grape/25",
        jade: "bg-jade/15 text-jade ring-1 ring-jade/25",
        secondary: "bg-secondary text-secondary-foreground",
        outline: "border-2 border-border text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
