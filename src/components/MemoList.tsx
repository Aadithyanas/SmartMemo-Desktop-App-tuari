"use client"

import { useRef, useState, useEffect } from "react"
import { Brain } from "lucide-react"
import { invoke } from "@tauri-apps/api/core"
import { toast } from "sonner"
import { MemoCard } from "./MemoCard"
import { LoadingSpinner } from "./LoadingSpinner"
import { EmptyState } from "./EmptyState"
import { MemoFilters } from "./MemoFilters"
import { listen } from "@tauri-apps/api/event"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

// UPDATED: This interface now matches the backend API's MemoOutput/VoiceMemo struct
interface Memo {
  id: string
  title: string
  created_at: string
  duration: string // The backend sends duration as a formatted string
  audio_blob: number[]
  transcript: string | null
  translate: string | null
  summary: string | null
  tags: string[] | null // Tags can be null from the backend
}

// This interface is for the form state
interface MemoFormData {
  title: string
  transcript: string
  translate: string
  summary: string
  tags: string[]
}

export function MemoList() {
  const [memos, setMemos] = useState<Memo[]>([])
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedTag, setSelectedTag] = useState<string>("all")
  const [sortBy, setSortBy] = useState<string>("newest")
  const [playingId, setPlayingId] = useState<string | null>(null)
  const [audioElements, setAudioElements] = useState<Record<string, HTMLAudioElement>>({})
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState<MemoFormData>({
    title: "",
    transcript: "",
    translate: "",
    summary: "",
    tags: [],
  })
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [targetLanguage, setTargetLanguage] = useState("Spanish")
  const [isLoading, setIsLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [token, setToken] = useState<string | null>(null); // NEW: State for JWT

  // NEW: Effect to load token from localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("jwt");
    if (storedToken) {
      setToken(storedToken);
    } else {
      setIsLoading(false); // If no token, stop loading
      toast.error("You must be logged in to view your memos.");
    }
  }, []);

  // This effect handles data fetching and event listening, now dependent on the token
  useEffect(() => {
    if (!token) return; // Don't proceed without a token

    fetchMemos()

    const setupListener = async () => {
      const unlisten = await listen("memo:updated", () => {
        console.log("🔄 Refreshing memos due to update event...")
        fetchMemos(true)
      })
      return unlisten
    }
    const unlistenPromise = setupListener()

    return () => {
      unlistenPromise.then((unlisten) => {
        if (unlisten) {
            console.log("🧹 Cleaning up event listener...")
            unlisten()
        }
      })
    }
  }, [token]) // Re-run if the token changes (e.g., on login)

  // This effect handles the cleanup of ALL audio elements when the component unmounts
  useEffect(() => {
    return () => {
      Object.values(audioElements).forEach(audio => {
        audio.pause();
        URL.revokeObjectURL(audio.src);
      });
    };
  }, [audioElements]);

  
  const fetchMemos = async (showRefreshIndicator = false) => {
    if (!token) return; // Guard against fetching without a token
    if (showRefreshIndicator) {
      setIsRefreshing(true)
    } else {
      setIsLoading(true)
    }

    try {
      const newMemos = await invoke<Memo[]>("get_memos_command", { token })
      setMemos(newMemos)
    } catch (error) {
      console.error("Failed to fetch memos:", error)
      toast.error("Failed to load memos. Please check your connection and login.")
      setMemos([])
    } finally {
      setIsLoading(false)
      setIsRefreshing(false)
    }
  }
  
  const allTags = Array.from(new Set(memos.flatMap((memo) => memo.tags || [])))
  
  const filteredMemos = memos
    .filter((memo) => {
      const matchesSearch =
        memo.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (memo.transcript && memo.transcript.toLowerCase().includes(searchTerm.toLowerCase()))
      const matchesTag = selectedTag === "all" || (memo.tags && memo.tags.includes(selectedTag))
      return matchesSearch && matchesTag
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "newest":
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        case "oldest":
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        case "duration":
          const aSeconds = a.duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
          const bSeconds = b.duration.split(':').reduce((acc, time) => (60 * acc) + +time, 0);
          return bSeconds - aSeconds
        case "title":
          return a.title.localeCompare(b.title)
        default:
          return 0
      }
    })

  const playAudio = async (memo: Memo) => {
    Object.values(audioElements).forEach((audio) => {
        audio.pause();
    });

    if (playingId === memo.id) {
        setPlayingId(null);
        return;
    }

    if (playingId && audioElements[playingId]) {
        URL.revokeObjectURL(audioElements[playingId].src);
    }

    try {
        const audioBlob = new Blob([new Uint8Array(memo.audio_blob)], { type: "audio/wav" });
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);

        audio.play();
        setPlayingId(memo.id);

        audio.onended = () => {
            setPlayingId(null);
            URL.revokeObjectURL(audioUrl);
        };
        
        setAudioElements(prev => ({ ...prev, [memo.id]: audio }));

    } catch (error) {
        console.error("Failed to play audio:", error);
        toast.error("Failed to play audio");
        setPlayingId(null);
    }
  }

  const deleteMemo = async (id: string) => {
    if (!token) return toast.error("Authentication required.");
    try {
      await invoke("delete_memo_command", { id, token })
      toast.success("Memo deleted successfully")
    } catch (error) {
      console.error("Failed to delete memo:", error)
      toast.error("Failed to delete memo")
    }
  }

  const startEditing = (memo: Memo) => {
    setEditingId(memo.id)
    setEditForm({
      title: memo.title,
      transcript: memo.transcript || "",
      translate: memo.translate || "",
      summary: memo.summary || "",
      tags: memo.tags || [],
    })
  }

  const cancelEditing = () => {
    setEditingId(null)
    setEditForm({ title: "", transcript: "", translate: "", summary: "", tags: [] })
  }

  const saveEdit = async (id: string) => {
    if (!token) return toast.error("Authentication required.");
    try {
      await invoke("save_memo_command", {
        id,
        token,
        name: editForm.title,
        transcript: editForm.transcript || null,
        translate: editForm.translate || null,
        summary: editForm.summary || null,
        tags: editForm.tags,
      })
      setEditingId(null)
      toast.success("Memo updated successfully")
    } catch (error) {
      console.error("Failed to update memo:", error)
      toast.error("Failed to update memo")
    }
  }

  const transcribeMemo = async (memo: Memo) => {
    if (!token) return toast.error("Authentication required.");
    setIsTranscribing(true)
    try {
      const transcript = await invoke<string>("transcribe_audio_command", {
        audioBlob: memo.audio_blob,
        token,
      })
      await invoke("save_memo_command", {
        id: memo.id,
        token,
        name: memo.title,
        transcript,
        translate: memo.translate,
        summary: memo.summary,
        tags: memo.tags,
      })
      toast.success("transcript completed")
    } catch (error) {
      console.error("Failed to transcribe:", error)
      toast.error("Failed to transcribe audio")
    } finally {
      setIsTranscribing(false)
    }
  }

  const translateMemo = async (memo: Memo) => {
    if (!memo.transcript) {
      toast.error("No transcript available to translate")
      return
    }
    if (!token) return toast.error("Authentication required.");
    setIsTranslating(true)
    try {
      const translation = await invoke<string>("translate_text_command", {
        text: memo.transcript,
        targetLanguage,
        token,
      })
      await invoke("save_memo_command", {
        id: memo.id,
        token,
        name: memo.title,
        transcript: memo.transcript,
        translate: translation,
        summary: memo.summary,
        tags: memo.tags,
      })
      toast.success("Translation completed")
    } catch (error) {
      console.error("Failed to translate:", error)
      toast.error("Failed to translate text")
    } finally {
      setIsTranslating(false)
    }
  }

  const summarizeMemo = async (memo: Memo) => {
    if (!memo.transcript) {
      toast.error("No transcript available to summarize")
      return
    }
    if (!token) return toast.error("Authentication required.");
    setIsSummarizing(true)
    try {
      const summary = await invoke<string>("summarize_text_command", {
        text: memo.transcript,
        token,
      })
      await invoke("save_memo_command", {
        id: memo.id,
        token,
        name: memo.title,
        transcript: memo.transcript,
        translate: memo.translate,
        summary,
        tags: memo.tags,
      })
      toast.success("Summary generated")
    } catch (error) {
      console.error("Failed to summarize:", error)
      toast.error("Failed to generate summary")
    } finally {
      setIsSummarizing(false)
    }
  }

  const downloadAudio = async (memo: Memo) => {
    try {
      const audioBlob = new Blob([new Uint8Array(memo.audio_blob)], { type: "audio/wav" })
      const url = URL.createObjectURL(audioBlob)
      const a = document.createElement("a")
      a.href = url
      a.download = `${memo.title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.wav`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      toast.success("Audio downloaded successfully")
    } catch (error) {
      console.error("Failed to download audio:", error)
      toast.error("Failed to download audio")
    }
  }

  const downloadText = (text: string | null, filename: string) => {
    if (!text) {
      toast.error("No text available to download")
      return
    }
    const blob = new Blob([text], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success("Text downloaded successfully")
  }

  if (isLoading) {
    return <LoadingSpinner />
  }

  if (!token) {
    return (
        <div className="flex items-center justify-center h-full p-6 text-center">
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Authentication Required</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">Please log in to view your memos.</p>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8 p-4 md:p-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center space-x-3">
            <div className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-2xl shadow-lg">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 dark:from-purple-400 dark:to-pink-400 bg-clip-text text-transparent">
              AI Memo Hub
            </h1>
          </div>
          <p className="text-gray-600 dark:text-purple-200 text-lg max-w-2xl mx-auto">
            Intelligent voice memo management with AI-powered transcript, translation, and summarization
          </p>
        </div>
        {/* Search and Filters */}
        <div className="relative">
          <MemoFilters
            searchTerm={searchTerm}
            setSearchTerm={setSearchTerm}
            selectedTag={selectedTag}
            setSelectedTag={setSelectedTag}
            sortBy={sortBy}
            setSortBy={setSortBy}
            allTags={allTags}
          />
          {isRefreshing && (
            <div className="absolute top-0 right-0 mt-2 mr-2">
              <div className="flex items-center space-x-2 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 px-3 py-1 rounded-full text-sm animate-pulse">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
                <span>Updating...</span>
              </div>
            </div>
          )}
        </div>
        {/* Memos List */}
        <div className="space-y-6">
          {filteredMemos.length === 0 ? (
            <EmptyState searchTerm={searchTerm} selectedTag={selectedTag} />
          ) : (
            <div className="space-y-6">
              {filteredMemos.map((memo, index) => (
                <div
                  key={memo.id}
                  className="transform transition-all duration-500 ease-out"
                  style={{
                    animation: `slideInUp 0.6s ease-out ${index * 100}ms both`,
                  }}
                >
                  <MemoCard
                    memo={memo}
                    playingId={playingId}
                    editingId={editingId}
                    editForm={editForm}
                    setEditForm={setEditForm}
                    isTranscribing={isTranscribing}
                    isTranslating={isTranslating}
                    isSummarizing={isSummarizing}
                    targetLanguage={targetLanguage}
                    setTargetLanguage={setTargetLanguage}
                    onPlay={() => playAudio(memo)}
                    onDelete={() => deleteMemo(memo.id)}
                    onStartEdit={() => startEditing(memo)}
                    onCancelEdit={cancelEditing}
                    onSaveEdit={() => saveEdit(memo.id)}
                    onTranscribe={() => transcribeMemo(memo)}
                    onTranslate={() => translateMemo(memo)}
                    onSummarize={() => summarizeMemo(memo)}
                    onDownloadAudio={() => downloadAudio(memo)}
                    onDownloadText={downloadText}
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
      {/* Custom CSS for animations */}
      <style jsx>{`
        @keyframes slideInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  )
}
