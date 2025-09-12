"use client"

import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Edit, Download, FileText } from "lucide-react"
import { TranscribeButton } from "./TranscribeButton"
import { TranslateButton } from "./TranslateButton"
import { SummarizeButton } from "./SummarizeButton"

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

interface MemoActionsProps {
  memo: Memo
  isTranscribing: boolean
  isTranslating: boolean
  isSummarizing: boolean
  targetLanguage: string
  setTargetLanguage: (lang: string) => void
  onStartEdit: (memo: Memo) => void
  onDownloadAudio: (memo: Memo) => void
  onDownloadText: (text: string | null, filename: string) => void
  onTranscribe: (memo: Memo) => void
  onTranslate: (memo: Memo) => void
  onSummarize: (memo: Memo) => void
}

export function MemoActions({
  memo,
  isTranscribing,
  isTranslating,
  isSummarizing,
  targetLanguage,
  setTargetLanguage,
  onStartEdit,
  onDownloadAudio,
  onDownloadText,
  onTranscribe,
  onTranslate,
  onSummarize,
}: MemoActionsProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Button variant="outline" onClick={() => onStartEdit(memo)} className="border-white/20 text-foreground hover:bg-white/10">
        <Edit className="h-4 w-4 mr-2" />
        Edit
      </Button>
      <Button variant="outline" onClick={() => onDownloadAudio(memo)} className="border-white/20 text-foreground hover:bg-white/10">
        <Download className="h-4 w-4 mr-2" />
        Audio
      </Button>
      {memo.transcript && (
        <Button variant="outline" onClick={() => onDownloadText(memo.transcript, `${memo.title}_transcript.txt`)} className="border-white/20 text-foreground hover:bg-white/10">
          <FileText className="h-4 w-4 mr-2" />
          Text
        </Button>
      )}
      <TranscribeButton memo={memo} isTranscribing={isTranscribing} onTranscribe={onTranscribe} />
      <TranslateButton memo={memo} isTranslating={isTranslating} onTranslate={onTranslate} />
      <SummarizeButton memo={memo} isSummarizing={isSummarizing} onSummarize={onSummarize} />
      <Select value={targetLanguage} onValueChange={setTargetLanguage}>
        <SelectTrigger className="w-40 bg-white/10 border-white/20">
          <SelectValue />
        </SelectTrigger>
        <SelectContent className="bg-slate-800 border-slate-700">
          <SelectItem value="English" className="text-white">English</SelectItem>
          <SelectItem value="Spanish" className="text-white">Spanish</SelectItem>
          <SelectItem value="French" className="text-white">French</SelectItem>
          <SelectItem value="German" className="text-white">German</SelectItem>
          <SelectItem value="Japanese" className="text-white">Japanese</SelectItem>
          <SelectItem value="Chinese" className="text-white">Chinese</SelectItem>
          <SelectItem value="Hindi" className="text-white">Hindi</SelectItem>
          <SelectItem value="Malayalam" className="text-white">Malayalam</SelectItem>
          <SelectItem value="Tamil" className="text-white">Tamil</SelectItem>
          <SelectItem value="Telugu" className="text-white">Telugu</SelectItem>
          <SelectItem value="Kannada" className="text-white">Kannada</SelectItem>
          <SelectItem value="Bengali" className="text-white">Bengali</SelectItem>
          <SelectItem value="Marathi" className="text-white">Marathi</SelectItem>
          <SelectItem value="Russian" className="text-white">Russian</SelectItem>
          <SelectItem value="Korean" className="text-white">Korean</SelectItem>
          <SelectItem value="Portuguese" className="text-white">Portuguese</SelectItem>
          <SelectItem value="Arabic" className="text-white">Arabic</SelectItem>
          <SelectItem value="Italian" className="text-white">Italian</SelectItem>
          <SelectItem value="Dutch" className="text-white">Dutch</SelectItem>
          <SelectItem value="Turkish" className="text-white">Turkish</SelectItem>
          <SelectItem value="Thai" className="text-white">Thai</SelectItem>
          <SelectItem value="Vietnamese" className="text-white">Vietnamese</SelectItem>
          <SelectItem value="Urdu" className="text-white">Urdu</SelectItem>
        </SelectContent>
      </Select>
    </div>
  )
}
