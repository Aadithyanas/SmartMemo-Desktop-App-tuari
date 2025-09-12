"use client"
import type React from "react"
import { useEffect, useState, useCallback, useRef } from "react"
import { ArrowLeft, Loader2, Copy, Download, Languages, ListCollapse, Save, Play, Pause } from "lucide-react"
import { invoke } from "@tauri-apps/api/core"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "sonner"

// UPDATED: This interface now matches the backend API response
interface VoiceMemo {
  id: string;
  title: string;
  created_at: string;
  duration: string;
  audio_blob: number[];
  transcription: string | null;
  translate: string | null;
  summary: string | null;
  tags: string[] | null;
}

interface TranscribeComponentProps {
  audioBlob: Blob
  onBack: () => void
  onMouseDown: (e: React.MouseEvent) => void
  recordingTime: number // Expecting seconds
}

const languageOptions = [
  { value: "en", label: "English" },
  { value: "es", label: "Spanish" },
  { value: "fr", label: "French" },
  { value: "de", label: "German" },
  { value: "it", label: "Italian" },
  { value: "pt", label: "Portuguese" },
  { value: "ru", label: "Russian" },
  { value: "ja", label: "Japanese" },
  { value: "zh", label: "Chinese" },
  { value: "ar", label: "Arabic" },
]

export default function TranscribeComponent({
  audioBlob,
  onBack,
  onMouseDown,
  recordingTime,
}: TranscribeComponentProps) {
  const [isTranscribing, setIsTranscribing] = useState(true)
  const [transcriptionText, setTranscriptionText] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isCopied, setIsCopied] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [translatedText, setTranslatedText] = useState("")
  const [summaryText, setSummaryText] = useState("")
  const [selectedLanguage, setSelectedLanguage] = useState("es")
  const [activeTab, setActiveTab] = useState<"original" | "translated" | "summary">("original")
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [isSaving, setIsSaving] = useState(false)
  const [showLanguageSelect, setShowLanguageSelect] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [title, setTitle] = useState<string>("")
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [token, setToken] = useState<string | null>(null); // NEW: State for JWT

  // NEW: Effect to load token from localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("jwt");
    if (storedToken) {
      setToken(storedToken);
    } else {
      setError("Authentication required. Please log in.");
      toast.error("Authentication token not found.");
      setIsTranscribing(false); // Stop loading if not authenticated
    }
  }, []);

  // Initialize audio player
  useEffect(() => {
    const audio = new Audio(URL.createObjectURL(audioBlob))
    audioRef.current = audio
    const updateTime = () => setCurrentTime(audio.currentTime)
    const updateDuration = () => setDuration(audio.duration)

    audio.addEventListener("timeupdate", updateTime)
    audio.addEventListener("loadedmetadata", updateDuration)
    audio.addEventListener("ended", () => setIsPlaying(false))

    return () => {
      audio.removeEventListener("timeupdate", updateTime)
      audio.removeEventListener("loadedmetadata", updateDuration)
      audio.removeEventListener("ended", () => setIsPlaying(false))
      audio.pause()
      URL.revokeObjectURL(audio.src)
    }
  }, [audioBlob])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = Math.floor(seconds % 60)
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`
  }

  const transcribeAudio = useCallback(async (blob: Blob) => {
    if (!token) throw new Error("Authentication token is missing.");
    try {
      const arrayBuffer = await blob.arrayBuffer()
      const audioData = Array.from(new Uint8Array(arrayBuffer))
      const transcription = await invoke<string>("transcribe_audio_command", {
        audioBlob: audioData,
        token,
      })

      if (transcription) {
        const generatedTitle = await invoke<string>("generate_memo_name_command", {
          transcription: transcription,
          token,
        })
        setTitle(generatedTitle)
      }
      return transcription
    } catch (err) {
      console.error("Transcription error:", err)
      throw new Error(typeof err === "string" ? err : "Failed to transcribe audio")
    }
  }, [token])

  useEffect(() => {
    const startTranscription = async () => {
      if (!token) return; // Wait for token to be loaded

      setIsTranscribing(true)
      setError(null)
      try {
        const result = await transcribeAudio(audioBlob)
        setTranscriptionText(result)
      } catch (err) {
        setError(err instanceof Error ? err.message : String(err))
      } finally {
        setIsTranscribing(false)
      }
    }
    startTranscription()
  }, [audioBlob, transcribeAudio, token])

  const saveMemo = useCallback(async () => {
    if (!transcriptionText || !token) {
        toast.error("Cannot save without transcription or authentication.");
        return;
    };
    setIsSaving(true);
    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioData = Array.from(new Uint8Array(arrayBuffer));

      const initialMemo = await invoke<VoiceMemo>("save_audio_command", {
        token,
        audioBlob: audioData,
        duration: formatTime(recordingTime),
        tags: [],
      });

      if (!initialMemo || !initialMemo.id) {
        throw new Error("Failed to save audio and get an ID.");
      }

      await invoke<VoiceMemo>("save_memo_command", {
        id: initialMemo.id,
        token,
        name: title,
        transcription: transcriptionText,
        translate: translatedText || null,
        summary: summaryText || null,
        tags: [],
      });
      
      setSaveSuccess(true);
      toast.success("Memo saved successfully!");
      setTimeout(() => setSaveSuccess(false), 3000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to save memo.";
      setError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  }, [audioBlob, transcriptionText, translatedText, summaryText, title, recordingTime, token]);

  const handleTranslate = useCallback(async () => {
    if (!transcriptionText || !token) return;
    setIsTranslating(true);
    try {
      const result = await invoke<string>("translate_text_command", {
        text: transcriptionText,
        targetLanguage: selectedLanguage,
        token,
      });
      setTranslatedText(result);
      setActiveTab("translated");
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsTranslating(false);
    }
  }, [transcriptionText, selectedLanguage, token]);
  
  const handleSummarize = useCallback(async () => {
    if (!transcriptionText || !token) return;

    try {
      setIsSummarizing(true)
      const result = await invoke<string>("summarize_text_command", {
        text: transcriptionText,
        token,
      })
      setSummaryText(result)
      setActiveTab("summary")
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsSummarizing(false)
    }
  }, [transcriptionText, token])

  const handleCopyText = useCallback(async () => {
    const textToCopy =
      activeTab === "translated" ? translatedText : activeTab === "summary" ? summaryText : transcriptionText
    if (!textToCopy) return

    try {
      await navigator.clipboard.writeText(textToCopy)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) {
      console.error("Failed to copy text:", err)
    }
  }, [activeTab, transcriptionText, translatedText, summaryText])

  const handleDownloadAudio = useCallback(() => {
    const url = URL.createObjectURL(audioBlob)
    const a = document.createElement("a")
    a.href = url
    a.download = `recording-${new Date().toISOString().slice(0, 19)}.webm`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }, [audioBlob])

  const togglePlayback = useCallback(() => {
    if (!audioRef.current) return

    if (isPlaying) {
      audioRef.current.pause()
    } else {
      audioRef.current.play()
    }
    setIsPlaying(!isPlaying)
  }, [isPlaying])

  return (
    <div className="w-full h-full flex items-center justify-center bg-transparent select-none p-2">
      <div
        className="w-full h-full rounded-[32px] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] transform-gpu cursor-grab"
        onMouseDown={onMouseDown}
        style={{
          background: `linear-gradient(135deg, rgba(0,0,0,0.96) 0%, rgba(20,20,20,0.96) 30%, rgba(0,0,0,0.96) 100%)`,
          backdropFilter: "blur(40px) saturate(1.8)",
          border: "0.5px solid rgba(255,255,255,0.15)",
          boxShadow: `0 12px 40px rgba(0,0,0,0.7), 0 4px 16px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.1), inset 0 -1px 0 rgba(0,0,0,0.3)`,
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-white/10">
          <button onClick={onBack} className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/10 hover:scale-110">
            <ArrowLeft size={14} className="text-white" />
          </button>
          <span className="text-white text-sm font-medium">Transcription</span>
          <div className="flex items-center gap-2">
            {transcriptionText && (
              <>
                <button onClick={handleCopyText} className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/10 hover:scale-110" title="Copy text">
                  <Copy size={12} className={`${isCopied ? "text-green-400" : "text-white"}`} />
                </button>
                <button onClick={handleDownloadAudio} className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/10 hover:scale-110" title="Download audio">
                  <Download size={12} className="text-white" />
                </button>
                <button
                  onClick={saveMemo}
                  disabled={isSaving}
                  className="w-8 h-8 rounded-full flex items-center justify-center transition-all duration-200 hover:bg-white/10 hover:scale-110"
                  title="Save memo"
                >
                  {isSaving ? <Loader2 size={12} className="animate-spin text-white" /> : saveSuccess ? <Save size={12} className="text-green-400" /> : <Save size={12} className="text-white" />}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Audio Player and Action Buttons */}
        <div className="flex items-center justify-center gap-4 px-4 py-2 border-b border-white/10">
          <div className="flex items-center gap-2">
            <button onClick={togglePlayback} className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 hover:bg-white/20 transition-colors">
              {isPlaying ? <Pause size={14} className="text-white" /> : <Play size={14} className="text-white" />}
            </button>
            <span className="text-sm text-white/70 font-mono">{formatTime(currentTime)} / {formatTime(duration)}</span>
          </div>

          {transcriptionText && !isTranscribing && (
            <>
              <div className="flex items-center gap-1">
                <button onClick={() => setShowLanguageSelect(!showLanguageSelect)} disabled={isTranslating} className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/20 text-blue-300 hover:bg-blue-500/30 transition-colors disabled:opacity-50" title="Translate">
                  <Languages size={14} />
                </button>
                {showLanguageSelect && (
                  <div className="flex items-center gap-1">
                    <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
                      <SelectTrigger className="w-20 h-7 text-xs bg-gray-800/90 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800/95 border-gray-600 backdrop-blur-sm">
                        {languageOptions.map((lang) => (
                          <SelectItem key={lang.value} value={lang.value} className="text-white hover:bg-gray-700/50 focus:bg-gray-700/50 text-xs">
                            {lang.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <button onClick={handleTranslate} disabled={isTranslating} className="px-2 py-1 text-xs rounded bg-blue-500 text-white hover:bg-blue-600 transition-colors disabled:opacity-50 h-7">
                      {isTranslating ? <Loader2 size={10} className="animate-spin" /> : "Go"}
                    </button>
                  </div>
                )}
              </div>
              <button onClick={handleSummarize} disabled={isSummarizing} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors disabled:opacity-50 text-xs" title="Summarize">
                {isSummarizing ? <Loader2 size={14} className="animate-spin" /> : <ListCollapse size={14} />}
                Summary
              </button>
            </>
          )}
        </div>

        {/* Content Tabs */}
        {transcriptionText && (
          <div className="flex border-b border-white/10 text-xs">
            <button onClick={() => setActiveTab("original")} className={`flex-1 py-2 ${activeTab === "original" ? "text-blue-400 border-b-2 border-blue-400" : "text-white/60"}`}>
              Original
            </button>
            {translatedText && (
              <button onClick={() => setActiveTab("translated")} className={`flex-1 py-2 ${activeTab === "translated" ? "text-blue-400 border-b-2 border-blue-400" : "text-white/60"}`}>
                Translated
              </button>
            )}
            {summaryText && (
              <button onClick={() => setActiveTab("summary")} className={`flex-1 py-2 ${activeTab === "summary" ? "text-blue-400 border-b-2 border-blue-400" : "text-white/60"}`}>
                Summary
              </button>
            )}
          </div>
        )}

        {/* Content */}
        <div className="flex-1 flex items-center justify-center px-4 py-3">
          {isTranscribing ? (
            <div className="flex flex-col items-center gap-3">
              <Loader2 size={24} className="text-blue-400 animate-spin" />
              <span className="text-white/80 text-sm">Transcribing audio...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 text-center">
              <span className="text-red-400 text-sm">{error}</span>
              <button onClick={onBack} className="text-blue-400 text-xs hover:text-blue-300 transition-colors">
                Go back
              </button>
            </div>
          ) : activeTab === "translated" ? (
            <div className="w-full h-full">
              <div className="text-white text-sm leading-relaxed text-center max-h-30 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {isTranslating ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={18} className="animate-spin text-blue-400" />
                    <span className="text-white/70">
                      Translating to {languageOptions.find((l) => l.value === selectedLanguage)?.label}...
                    </span>
                  </div>
                ) : (
                  translatedText
                )}
              </div>
            </div>
          ) : activeTab === "summary" ? (
            <div className="w-full h-full">
              <div className="text-white text-sm leading-relaxed text-center max-h-30 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {isSummarizing ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={18} className="animate-spin text-purple-400" />
                    <span className="text-white/70">Creating summary...</span>
                  </div>
                ) : (
                  summaryText
                )}
              </div>
            </div>
          ) : transcriptionText ? (
            <div className="w-full h-full">
              <div className="text-white text-sm leading-relaxed text-center max-h-30 overflow-y-auto scrollbar-thin scrollbar-thumb-white/20 scrollbar-track-transparent">
                {transcriptionText}
              </div>
              {isCopied && (
                <div className="text-green-400 text-xs text-center mt-2 opacity-80">Copied to clipboard!</div>
              )}
              {saveSuccess && (
                <div className="text-green-400 text-xs text-center mt-1 opacity-80 animate-pulse">
                  Memo saved successfully!
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  )
}
