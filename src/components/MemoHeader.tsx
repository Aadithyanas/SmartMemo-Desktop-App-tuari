"use client"

import { Button } from "@/components/ui/button"
import { Play, Pause, Calendar, Clock, Trash2 } from "lucide-react"
import { formatDistanceToNow } from "date-fns"

// UPDATED: Interface matches the backend data structure
interface Memo {
  id: string
  title: string
  created_at: string
  duration: string
  audio_blob: number[]
  transcript: string | null
  translate: string | null
  summary: string | null
  tags: string[] | null
}

interface MemoHeaderProps {
  memo: Memo
  playingId: string | null
  onPlay: (memo: Memo) => void
  onDelete: (id: string) => void
}

export function MemoHeader({ memo, playingId, onPlay, onDelete }: MemoHeaderProps) {
  return (
    <div className="flex items-start justify-between">
      <div className="flex items-center space-x-4 flex-1">
        <Button
          variant="outline"
          size="lg"
          onClick={() => onPlay(memo)}
          className="bg-gradient-to-r from-purple-500 to-pink-500 border-0 hover:from-purple-600 hover:to-pink-600 text-white"
        >
          {playingId === memo.id ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5" />}
        </Button>
        <div className="flex-1">
          {/* UPDATED: Use memo.title */}
          <h3 className="text-xl font-bold text-gray-600 dark:text-gray-200 mb-2">{memo.title}</h3>
          <div className="flex items-center gap-6 text-sm text-purple-200">
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-200">
              <Calendar className="h-4 w-4" />
              {/* UPDATED: Use memo.created_at */}
              {formatDistanceToNow(new Date(memo.created_at), { addSuffix: true })}
            </span>
            <span className="flex items-center gap-2 text-gray-600 dark:text-gray-200">
              <Clock className="h-4 w-4" />
              {/* UPDATED: Duration is now a string */}
              {memo.duration}
            </span>
          </div>
        </div>
      </div>
      <Button
        variant="ghost"
        size="icon"
        onClick={() => onDelete(memo.id)}
        className="text-red-400 hover:text-red-300 hover:bg-red-500/20"
      >
        <Trash2 className="h-5 w-5" />
      </Button>
    </div>
  )
}
