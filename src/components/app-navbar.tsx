"use client"

import { AudioWaveform, BarChart3, Home, Mic, Settings } from "lucide-react"
import { ThemeToggle } from "@/components/ThemeToggle"
import Link from "next/link"
import { usePathname } from "next/navigation"

import clsx from "clsx"

const menuItems = [
  {
    title: "Dashboard",
    url: "/",
    icon: Home,
  },
  {
    title: "Record",
    url: "/record",
    icon: Mic,
  },
  {
    title: "Memos",
    url: "/memos",
    icon: AudioWaveform,
  },
  {
    title: "Analytics",
    url: "/analytics",
    icon: BarChart3,
  },
  {
    title: "Settings",
    url: "/settings",
    icon: Settings,
  },
]

export function AppNavbar() {
  const pathname = usePathname()

  return (
    <header className="fixed top-0 z-5000 w-full border-b bg-background/80 backdrop-blur">
      <div className="container flex h-16 items-center justify-between px-4">
        {/* Brand */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Mic className="h-4 w-4" />
          </div>
          <div className="flex flex-col text-sm leading-tight">
            <span className="font-semibold">Smart Memo</span>
            <span className="text-xs text-muted-foreground">Voice meets intelligence</span>
          </div>
        </div>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-4">
          {menuItems.map((item) => (
            <Link
              key={item.title}
              href={item.url}
              className={clsx(
                "flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground transition",
                pathname === item.url && "text-primary"
              )}
            >
              <item.icon className="h-4 w-4" />
              {item.title}
            </Link>
          ))}
        </nav>

        {/* Theme Toggle + Mobile */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
        </div>
      </div>
    </header>
  )
}
