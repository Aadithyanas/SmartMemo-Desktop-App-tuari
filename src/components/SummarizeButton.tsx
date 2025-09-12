"use client"

import { Button } from "@/components/ui/button"
import { Sparkles } from "lucide-react"

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

interface SummarizeButtonProps {
  memo: Memo
  isSummarizing: boolean
  onSummarize: (memo: Memo) => void
}

export function SummarizeButton({ memo, isSummarizing, onSummarize }: SummarizeButtonProps) {
  return (
    <Button
      onClick={() => onSummarize(memo)}
      disabled={isSummarizing || !memo.transcript}
      className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
    >
      {isSummarizing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Summarizing...
        </>
      ) : (
        <>
          <Sparkles className="h-4 w-4 mr-2" />
          Summarize
        </>
      )}
    </Button>
  )
}
