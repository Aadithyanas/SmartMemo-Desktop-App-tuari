"use client"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Save, X, Plus } from "lucide-react"
import { useState } from "react"

// UPDATED: Interface for the form state is consistent now
interface MemoFormData {
  title: string
  transcript: string
  translate: string
  summary: string
  tags: string[]
}

interface EditMemoFormProps {
  editForm: MemoFormData
  setEditForm: (form: MemoFormData) => void
  onSave: () => void
  onCancel: () => void
}

export function EditMemoForm({ editForm, setEditForm, onSave, onCancel }: EditMemoFormProps) {
  const [newTagInput, setNewTagInput] = useState("")

  const handleAddTag = () => {
    const tagToAdd = newTagInput.trim()
    if (tagToAdd && !editForm.tags.includes(tagToAdd)) {
      setEditForm({ ...editForm, tags: [...editForm.tags, tagToAdd] })
      setNewTagInput("")
    }
  }

  const handleRemoveTag = (tagToRemove: string) => {
    setEditForm({ ...editForm, tags: editForm.tags.filter((tag) => tag !== tagToRemove) })
  }

  return (
    <div className="space-y-6">
      {/* UPDATED: Bind to editForm.title */}
      <Input
        value={editForm.title}
        onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
        placeholder="Memo title"
        className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
      />
      <Textarea
        value={editForm.transcript}
        onChange={(e) => setEditForm({ ...editForm, transcript: e.target.value })}
        placeholder="transcript"
        rows={4}
        className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
      />
      <Textarea
        value={editForm.translate}
        onChange={(e) => setEditForm({ ...editForm, translate: e.target.value })}
        placeholder="Translation"
        rows={3}
        className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
      />
      <Textarea
        value={editForm.summary}
        onChange={(e) => setEditForm({ ...editForm, summary: e.target.value })}
        placeholder="Summary"
        rows={3}
        className="bg-white/10 border-white/20 text-white placeholder:text-purple-300"
      />
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <Input
            value={newTagInput}
            onChange={(e) => setNewTagInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddTag() } }}
            placeholder="Add a tag"
            className="flex-grow bg-white/10 border-white/20 text-white placeholder:text-purple-300"
          />
          <Button onClick={handleAddTag} variant="outline" className="border-white/20 text-white hover:bg-white/10 bg-transparent">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
        <div className="flex flex-wrap gap-2">
          {editForm.tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="px-3 py-1 rounded-full text-sm gap-1">
              {tag}
              <X className="h-3 w-3 cursor-pointer text-muted-foreground hover:text-foreground" onClick={() => handleRemoveTag(tag)} />
            </Badge>
          ))}
        </div>
      </div>
      <div className="flex gap-3">
        <Button onClick={onSave} className="bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600">
          <Save className="h-4 w-4 mr-2" />
          Save Changes
        </Button>
        <Button variant="outline" onClick={onCancel} className="border-white/20 text-white hover:bg-white/10 bg-transparent">
          <X className="h-4 w-4 mr-2" />
          Cancel
        </Button>
      </div>
    </div>
  )
}
