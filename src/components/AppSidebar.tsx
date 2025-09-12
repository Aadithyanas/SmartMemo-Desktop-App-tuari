"use client"

import { AudioWaveform, BarChart3, Home, Mic, Settings, LogOut } from "lucide-react"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Button } from "@/components/ui/button"
import { ThemeToggle } from "@/components/ThemeToggle"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { jwtDecode } from "jwt-decode"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { toast } from "sonner"

interface DecodedToken {
  email: string;
  sub: string;
  exp: number;
  username?: string; // Username is optional
}

const menuItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Record", url: "/record", icon: Mic },
  { title: "Memos", url: "/memos", icon: AudioWaveform },
  { title: "Analytics", url: "/analytics", icon: BarChart3 },
  { title: "Settings", url: "/settings", icon: Settings },
]

export function AppSidebar() {
  const pathname = usePathname()
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [userInitial, setUserInitial] = useState<string>("")

  useEffect(() => {
    const token = localStorage.getItem("jwt");
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.exp * 1000 > Date.now()) {
          const nameSource = decoded.username || decoded.email.split('@')[0];
          const initial = nameSource.charAt(0).toUpperCase();
          setUserInitial(initial);
          setIsLoggedIn(true);
        } else {
          localStorage.removeItem("jwt");
          setIsLoggedIn(false);
        }
      } catch (error) {
        console.error("Failed to decode JWT:", error);
        setIsLoggedIn(false);
      }
    } else {
      setIsLoggedIn(false);
    }
  }, [pathname]); // Re-check auth status on route change

  const handleLogout = () => {
    localStorage.removeItem("jwt");
    setIsLoggedIn(false);
    toast.success("You have been logged out.");
    router.push("/auth");
  };

  return (
    <Sidebar variant="inset" className="">
      <SidebarHeader>
        <div className="flex items-center gap-3 px-4 py-2 mt-4">
          <div className="relative flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-600 via-blue-600 to-emerald-500 shadow-lg">
            <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-purple-600 via-blue-600 to-emerald-500 animate-spin opacity-75" style={{animationDuration: '6s'}}></div>
            <svg width="32" height="32" viewBox="0 0 100 100" fill="none" className="opacity-90 relative z-10">
              <circle cx="50" cy="50" r="12" fill="url(#coreGradient)" stroke="#9333ea" strokeWidth="2"/>
              <defs>
                <radialGradient id="coreGradient" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopColor="#9333ea" stopOpacity="0.8"/>
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.4"/>
                </radialGradient>
              </defs>
            </svg>
          </div>
          <div className="grid flex-1 text-left text-sm leading-tight">
            <span className="truncate font-semibold bg-gradient-to-r from-purple-600 via-blue-600 to-emerald-500 bg-clip-text text-transparent">
              SmartVoice
            </span>
            <span className="truncate text-xs text-muted-foreground">AI-Powered Transcription</span>
          </div>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Navigation</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild isActive={pathname === item.url}>
                    <Link href={item.url}>
                      <item.icon />
                      <span>{item.title}</span>
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <div className="flex items-center justify-between p-4">
          <div className="text-xs text-muted-foreground">SmartVoice V0.1</div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {isLoggedIn ? (
              <Popover>
                <PopoverTrigger asChild>
                  <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                    {/* UPDATED: Removed AvatarImage to only show the fallback initial */}
                    <AvatarFallback className="bg-gradient-to-br from-orange-500 to-orange-600 text-white font-bold">
                      {userInitial}
                    </AvatarFallback>
                  </Avatar>
                </PopoverTrigger>
                <PopoverContent className="w-40 p-2" side="top" align="end">
                  <Button variant="ghost" className="w-full justify-start" onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    Logout
                  </Button>
                </PopoverContent>
              </Popover>
            ) : (
              <Link href="/auth">
                <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 transition-opacity">
                  <AvatarFallback className="bg-muted">?</AvatarFallback>
                </Avatar>
              </Link>
            )}
          </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  )
}
