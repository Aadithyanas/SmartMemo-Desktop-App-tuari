"use client"

import { useState, useEffect } from "react"
import { ThemeProvider } from "@/components/ThemeProvider"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "@/components/AppSidebar"
import { Toaster } from "sonner"
import LoadingScreen from "@/components/LoadingScreen"

export default function RootApp({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const timer = setTimeout(() => {
      setLoading(false)
    }, 6000)
    return () => clearTimeout(timer)
  }, [])

  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange={false}>
      {loading ? (
        <LoadingScreen />
      ) : (
        <SidebarProvider defaultOpen={true}>
          <AppSidebar />
          <main className="flex-1 overflow-hidden">{children}</main>
          <Toaster richColors position="top-center" />
        </SidebarProvider>
      )}
    </ThemeProvider>
  )
}
