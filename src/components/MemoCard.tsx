"use client"

import { Card, CardContent } from "@/components/ui/card"
import { MemoHeader } from "./MemoHeader"
import { MemoContent } from "./MemoContent"
import { MemoTags } from "./MemoTags"
import { MemoActions } from "./MemoActions"
import { EditMemoForm } from "./EditMemoForm"

// UPDATED: This interface now matches the one in MemoList.tsx
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

// UPDATED: This interface for the form state is also consistent now
interface EditForm {
  title: string
  transcript: string
  translate: string
  summary: string
  tags: string[]
}

interface MemoCardProps {
  memo: Memo
  playingId: string | null
  editingId: string | null
  editForm: EditForm
  setEditForm: (form: EditForm) => void
  isTranscribing: boolean
  isTranslating: boolean
  isSummarizing: boolean
  targetLanguage: string
  setTargetLanguage: (lang: string) => void
  onPlay: (memo: Memo) => void
  onDelete: (id: string) => void
  onStartEdit: (memo: Memo) => void
  onCancelEdit: () => void
  onSaveEdit: (id: string) => void
  onTranscribe: (memo: Memo) => void
  onTranslate: (memo: Memo) => void
  onSummarize: (memo: Memo) => void
  onDownloadAudio: (memo: Memo) => void
  onDownloadText: (text: string | null, filename: string) => void
}

export function MemoCard({
  memo,
  playingId,
  editingId,
  editForm,
  setEditForm,
  isTranscribing,
  isTranslating,
  isSummarizing,
  targetLanguage,
  setTargetLanguage,
  onPlay,
  onDelete,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  onTranscribe,
  onTranslate,
  onSummarize,
  onDownloadAudio,
  onDownloadText,
}: MemoCardProps) {
  return (
    <Card className="bg-white/10 backdrop-blur-lg border-white/20 hover:bg-white/15 transition-all duration-300 shadow-2xl">
      <CardContent className="p-8">
        {editingId === memo.id ? (
          <EditMemoForm
            editForm={editForm}
            setEditForm={setEditForm}
            onSave={() => onSaveEdit(memo.id)}
            onCancel={onCancelEdit}
          />
        ) : (
          <div className="space-y-6">
            {/* Pass memo object with correct shape to sub-components */}
            <MemoHeader memo={memo} playingId={playingId} onPlay={() => onPlay(memo)} onDelete={() => onDelete(memo.id)} />
            <MemoContent memo={memo} />
            <MemoTags tags={memo.tags} />
            <MemoActions
              memo={memo}
              isTranscribing={isTranscribing}
              isTranslating={isTranslating}
              isSummarizing={isSummarizing}
              targetLanguage={targetLanguage}
              setTargetLanguage={setTargetLanguage}
              onStartEdit={() => onStartEdit(memo)}
              onDownloadAudio={() => onDownloadAudio(memo)}
              onDownloadText={onDownloadText}
              onTranscribe={() => onTranscribe(memo)}
              onTranslate={() => onTranslate(memo)}
              onSummarize={() => onSummarize(memo)}
            />
          </div>
        )}
      </CardContent>
    </Card>
  )
}
