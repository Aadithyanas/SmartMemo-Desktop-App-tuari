"use client"

import { Button } from "@/components/ui/button"
import { Languages } from "lucide-react"

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

interface TranslateButtonProps {
  memo: Memo
  isTranslating: boolean
  onTranslate: (memo: Memo) => void
}

export function TranslateButton({ memo, isTranslating, onTranslate }: TranslateButtonProps) {
  return (
    <Button
      onClick={() => onTranslate(memo)}
      disabled={isTranslating || !memo.transcript}
      className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 disabled:opacity-50"
    >
      {isTranslating ? (
        <>
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
          Translating...
        </>
      ) : (
        <>
          <Languages className="h-4 w-4 mr-2" />
          Translate
        </>
      )}
    </Button>
  )
}
