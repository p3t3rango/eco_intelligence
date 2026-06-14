import type { SVGProps } from "react"

/**
 * Botanical line-art — fine single-stroke leaf / vine / sprout illustrations
 * for a solarpunk, naturalist feel. All use `currentColor` so they inherit
 * text color (pair with `text-primary/30` etc. for whisper-faint accents).
 */

type Props = SVGProps<SVGSVGElement>

const base = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.5,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
}

/** A small growing seedling — pairs with growth/score moments. */
export function Sprout({ ...props }: Props) {
  return (
    <svg viewBox="0 0 48 48" aria-hidden {...base} {...props}>
      <path d="M24 44V20" />
      <path d="M24 28C24 21 18 16 9 16c0 7 6 12 15 12Z" />
      <path d="M24 24c0-6 5-10 13-10 0 6-5 10-13 10Z" />
      <path d="M20 44h8" />
    </svg>
  )
}

/** A trailing vine with leaves — good for headers / dividers. */
export function Vine({ ...props }: Props) {
  return (
    <svg viewBox="0 0 160 48" aria-hidden {...base} {...props}>
      <path d="M2 24C26 24 30 8 54 8s28 32 52 32 28-16 50-16" />
      <path d="M30 16c-5-3-12-2-15 3 6 3 12 1 15-3Z" />
      <path d="M78 36c5 3 12 2 15-3-6-3-12-1-15 3Z" />
      <path d="M120 30c-5-3-12-2-15 3 6 3 12 1 15-3Z" />
    </svg>
  )
}

/** A spray of three leaves — corner / empty-state accent. */
export function LeafSpray({ ...props }: Props) {
  return (
    <svg viewBox="0 0 64 64" aria-hidden {...base} {...props}>
      <path d="M32 60V26" />
      <path d="M32 40c0-9-7-15-19-15 0 9 8 15 19 15Z" />
      <path d="M32 32c0-8 7-13 17-13 0 8-7 13-17 13Z" />
      <path d="M32 48c0-6 5-10 13-10 0 6-6 10-13 10Z" />
    </svg>
  )
}

/** A single elegant leaf. */
export function Leaf({ ...props }: Props) {
  return (
    <svg viewBox="0 0 32 32" aria-hidden {...base} {...props}>
      <path d="M6 26C6 14 14 6 26 6c0 12-8 20-20 20Z" />
      <path d="M6 26 20 12" />
    </svg>
  )
}

/** A horizontal botanical divider — vine flanked by leaves. */
export function BranchDivider({ className, ...props }: Props) {
  return (
    <svg viewBox="0 0 240 16" aria-hidden className={className} {...base} {...props}>
      <path d="M2 8h96" />
      <path d="M142 8h96" />
      <path d="M120 2c-6 0-10 3-10 6 0 3 4 6 10 6 6 0 10-3 10-6 0-3-4-6-10-6Z" />
      <path d="M104 8c4-3 9-3 14 0-5 3-10 3-14 0Z" />
      <path d="M136 8c-4-3-9-3-14 0 5 3 10 3 14 0Z" />
    </svg>
  )
}
