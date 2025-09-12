"use client"

import { Badge } from "@/components/ui/badge"
import { Tag } from "lucide-react"

interface MemoTagsProps {
  // UPDATED: Tags can be null
  tags: string[] | null
}

export function MemoTags({ tags }: MemoTagsProps) {
  // UPDATED: Handle null or empty tags array
  if (!tags || tags.length === 0) return null

  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <Badge
          key={tag}
          className="bg-gradient-to-r from-purple-500/20 to-pink-500/20 text-purple-200 border-purple-500/30"
        >
          <Tag className="w-3 h-3 mr-1" />
          {tag}
        </Badge>
      ))}
    </div>
  )
}
