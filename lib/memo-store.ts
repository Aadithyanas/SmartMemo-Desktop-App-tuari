"use client"

import { create } from "zustand"
import { persist } from "zustand/middleware"

export interface Memo {
  id: string
  title: string
  transcript: string
  duration: number
  tags: string[]
  createdAt: string
  audioBlob?: Blob
}

interface MemoStore {
  memos: Memo[]
  addMemo: (memo: Memo) => void
  deleteMemo: (id: string) => void
  updateMemo: (id: string, updates: Partial<Memo>) => void
  clearAllMemos: () => void
}

export const useMemoStore = create<MemoStore>()(
  persist(
    (set) => ({
      memos: [],
      addMemo: (memo) =>
        set((state) => ({
          memos: [memo, ...state.memos],
        })),
      deleteMemo: (id) =>
        set((state) => ({
          memos: state.memos.filter((memo) => memo.id !== id),
        })),
      updateMemo: (id, updates) =>
        set((state) => ({
          memos: state.memos.map((memo) => (memo.id === id ? { ...memo, ...updates } : memo)),
        })),
      clearAllMemos: () => set({ memos: [] }),
    }),
    {
      name: "smart-memo-storage",
      partialize: (state) => ({
        // Don't persist audio blobs to localStorage
        memos: state.memos.map((memo) => ({
          ...memo,
          audioBlob: undefined,
        })),
      }),
    },
  ),
)
