import type { Metadata, Viewport } from "next"
import { Fraunces, Nunito_Sans } from "next/font/google"
import { Toaster } from "sonner"
import "./globals.css"

const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  display: "swap",
})

const nunito = Nunito_Sans({
  subsets: ["latin"],
  variable: "--font-nunito",
  display: "swap",
})

export const metadata: Metadata = {
  title: "Ecological Intelligence — Regenerate Your Patch of Earth",
  description:
    "Photograph your yard, get an AI ecological analysis and Regenerative Score, and join a solarpunk community growing more birds, bees, soil, and food.",
  generator: "v0.app",
}

export const viewport: Viewport = {
  themeColor: "#3d8b5f",
  width: "device-width",
  initialScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`bg-background ${fraunces.variable} ${nunito.variable}`}>
      <body className="font-sans antialiased">
        {children}
        <Toaster position="top-center" richColors />
      </body>
    </html>
  )
}
