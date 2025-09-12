import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import RootApp from "@/components/RootApp"
import { ElevenLabsProvider } from "../context/ElevenLabsContext"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Smart Memo - Voice meets intelligence",
  description: "Modern voice memo app with AI transcription and analytics",
  generator: "kochu",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ElevenLabsProvider>
            <RootApp>{children}</RootApp>
        </ElevenLabsProvider>
      
      </body>
    </html>
  )
}
