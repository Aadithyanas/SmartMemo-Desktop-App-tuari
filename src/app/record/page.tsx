"use client"

import { SidebarInset, SidebarTrigger } from "@/components/ui/sidebar"
import { RecorderInterface } from "@/components/RecorderInterface"

export default function RecordPage() {
  return (
    <SidebarInset className="flex flex-col h-full ">
      <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex flex-1 items-center gap-2">
          <h1 className="text-lg font-semibold">Record Memo</h1>
        </div>
      </header>

      <div className="flex-1 p-6">
        <RecorderInterface />
      </div>
    </SidebarInset>
  )
}
