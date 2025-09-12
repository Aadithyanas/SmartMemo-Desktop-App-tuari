"use client"

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { SettingsInterface } from "@/components/SettingsInterface"

export default function SettingsPage() {
  return (
    <SidebarInset className="flex flex-col h-full">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center gap-2">
          <h1 className="text-lg font-semibold">Settings</h1>
        </div>
      </header>

      <div className="flex-1 p-6">
        <SettingsInterface />
      </div>
    </SidebarInset>
  )
}
