"use client"

import { Button } from "@/components/ui/button"
import { Zap } from "lucide-react"

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

interface TranscribeButtonProps {
  memo: Memo
  isTranscribing: boolean
  onTranscribe: (memo: Memo) => void
}

export function TranscribeButton({ memo, isTranscribing, onTranscribe }: TranscribeButtonProps) {
  // This button should not render if a transcript already exists.
  if (memo.transcript) return null

  return (
    <Button
      onClick={() => onTranscribe(memo)}
      disabled={isTranscribing}
      className="bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 disabled:opacity-50"
    >
      {isTranscribing ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Transcribing...
        </>
      ) : (
        <>
          <Zap className="h-4 w-4 mr-2" />
          Transcribe
        </>
      )}
    </Button>
  )
}
