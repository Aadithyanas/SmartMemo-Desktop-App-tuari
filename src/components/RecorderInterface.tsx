"use client"
import { Badge } from "@/components/ui/badge"
import type React from "react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Waveform } from "@/components/waveform"
import { invoke } from "@tauri-apps/api/core"
// The 'open' command is now dynamically imported from the correct plugin
import {
  Languages,
  Mic,
  Pause,
  Play,
  Save,
  Sparkles,
  Square,
  Upload,
  X,
  MicOff,
  Settings,
  AlertTriangle,
  LogIn,
  Loader2,
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { toast } from "sonner"
import { useAudioRecorder } from "../../hooks/useAudioRecorder"
import { cn } from "../../lib/utils"
import { useRouter } from "next/navigation"
// NEW: Import the shadcn/ui Select components
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"


interface VoiceMemo {
  id: string
  title: string
  created_at: string
  duration: string
  audio_blob: number[]
  transcription: string | null
  translate: string | null
  summary: string | null
  tags: string[] | null
}

export function RecorderInterface() {
  const router = useRouter()
  const {
    isRecording,
    recordingTime,
    formattedTime,
    startRecording,
    stopRecording,
    reset: resetTimer,
  } = useAudioRecorder()

  const [isPlaying, setIsPlaying] = useState(false)
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null)
  const [title, setTitle] = useState("")
  const [transcript, setTranscript] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [newTag, setNewTag] = useState("")
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isTranslating, setIsTranslating] = useState(false)
  const [isSummarizing, setIsSummarizing] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [savedMemoId, setSavedMemoId] = useState<string | null>(null)
  const [targetLanguage, setTargetLanguage] = useState("Spanish")
  const [translate, setTranslate] = useState("")
  const [summary, setSummary] = useState("")
  const [apiError, setApiError] = useState<string | null>(null)
  const [showApiKeySettings, setShowApiKeySettings] = useState(false)
  const [showPermissionModal, setShowPermissionModal] = useState(false)
  const [showMicOffModal, setShowMicOffModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)

  // NEW: Loading state for recording initialization
  const [isInitializingRecording, setIsInitializingRecording] = useState(false)

  const audioRef = useRef<HTMLAudioElement | null>(null)

  const fullReset = () => {
    resetTimer()
    setRecordedBlob(null)
    setTranscript("")
    setTitle("")
    setSummary("")
    setTranslate("")
    setTags([])
    setNewTag("")
    setApiError(null)
    setSavedMemoId(null)
    setIsPlaying(false)
    setIsInitializingRecording(false)
  }

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current = null
      }
    }
  }, [])

  const checkMicrophoneStatus = async (): Promise<boolean> => {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      const audioInputs = devices.filter((device) => device.kind === "audioinput")
      if (audioInputs.length === 0) return false

      const testStream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const isEnabled = testStream.getAudioTracks().some((track) => track.enabled && track.readyState === "live")
      testStream.getTracks().forEach((track) => track.stop())
      return isEnabled
    } catch (error) {
      console.error("Error checking microphone status:", error)
      return false
    }
  }

  const handleStartRecording = async () => {
    const token = localStorage.getItem("jwt")
    if (!token) {
      setShowLoginModal(true)
      return
    }

    try {
      const API = await invoke<string | null>("get_api_key_command", { token })
      if (!API) {
        toast.error("API Key not set. Please set your Gemini API key.")
        setShowApiKeySettings(true)
        return
      }

      const isMicEnabled = await checkMicrophoneStatus()
      if (!isMicEnabled) {
        setShowMicOffModal(true)
        return
      }

      fullReset()

      // Show loading state
      setIsInitializingRecording(true)
      toast.info("Initializing recording...")

      // Wait for 2 seconds to show loading
      await new Promise((resolve) => setTimeout(resolve, 1000))

      // Start actual recording
      await startRecording()
      setIsInitializingRecording(false)
      toast.success("Recording started!")
    } catch (e: any) {
      setIsInitializingRecording(false)
      if (e.name === "NotAllowedError" || e.message.includes("Permission denied")) {
        setShowPermissionModal(true)
      } else if (e.name === "NotFoundError" || e.message.includes("No audio input")) {
        setShowMicOffModal(true)
      } else {
        toast.error("Could not start recording. Please check your microphone.")
        console.error(e)
      }
    }
  }

  const handleStopRecording = async () => {
    const blob = await stopRecording()
    if (blob) {
      setRecordedBlob(blob)
    }
  }

  const saveAudioOnly = async () => {
    if (!recordedBlob) return

    const token = localStorage.getItem("jwt")
    if (!token) {
      setShowLoginModal(true)
      return
    }

    setIsSaving(true)
    try {
      const arrayBuffer = await recordedBlob.arrayBuffer()
      const audioData = Array.from(new Uint8Array(arrayBuffer))

      const memo = await invoke<VoiceMemo>("save_audio_command", {
        token,
        audioBlob: audioData,
        duration: formattedTime,
        tags: tags,
      })

      setSavedMemoId(memo.id)
      toast.success("Audio saved successfully.")
    } catch (error) {
      console.error("Failed to save audio:", error)
      toast.error(String(error))
    } finally {
      setIsSaving(false)
    }
  }

  const transcribeAudio = async () => {
    if (!recordedBlob) return

    const token = localStorage.getItem("jwt")
    if (!token) {
      setShowLoginModal(true)
      return
    }

    setIsTranscribing(true)
    setApiError(null)

    try {
      const arrayBuffer = await recordedBlob.arrayBuffer()
      const audioData = Array.from(new Uint8Array(arrayBuffer))

      if (!savedMemoId) {
        toast.info("Saving audio before transcription...")
        const memo = await invoke<VoiceMemo>("save_audio_command", {
          token,
          audioBlob: audioData,
          duration: formattedTime,
          tags: tags,
        })
        setSavedMemoId(memo.id)
        toast.success("Audio saved. Now transcribing...")
      }

      const transcription = await invoke<string>("transcribe_audio_command", {
        token,
        audioBlob: audioData,
      })

      setTranscript(transcription)

      if (transcription) {
        const generatedTitle = await invoke<string>("generate_memo_name_command", {
          token,
          transcription: transcription,
        })
        setTitle(generatedTitle)
      }
    } catch (error) {
      console.error("Failed to transcribe:", error)
      const errorMessage = String(error)
      setApiError(errorMessage)
      toast.error(errorMessage)
    } finally {
      setIsTranscribing(false)
    }
  }

  const translateTranscript = async () => {
    if (!transcript) return

    const token = localStorage.getItem("jwt")
    if (!token) {
      setShowLoginModal(true)
      return
    }

    setIsTranslating(true)
    try {
      const translatedText = await invoke<string>("translate_text_command", {
        token,
        text: transcript,
        targetLanguage: targetLanguage,
      })
      setTranslate(translatedText)
      toast.success("Translation successful")
    } catch (error) {
      console.error("Failed to translate:", error)
      toast.error("Translation failed")
    } finally {
      setIsTranslating(false)
    }
  }

  const summarizeTranscript = async () => {
    if (!transcript) return

    const token = localStorage.getItem("jwt")
    if (!token) {
      setShowLoginModal(true)
      return
    }

    setIsSummarizing(true)
    try {
      const summaryText = await invoke<string>("summarize_text_command", {
        token,
        text: transcript,
      })
      setSummary(summaryText)
      toast.success("Summary generated")
    } catch (error) {
      console.error("Failed to summarize:", error)
      toast.error("Summarization failed")
    } finally {
      setIsSummarizing(false)
    }
  }

  const saveMemo = async () => {
    if (!savedMemoId || !title) {
      toast.error("Please ensure the audio is saved and has a title before saving.")
      return
    }

    const token = localStorage.getItem("jwt")
    if (!token) {
      setShowLoginModal(true)
      return
    }

    setIsSaving(true)
    try {
      await invoke<VoiceMemo>("save_memo_command", {
        id: savedMemoId,
        token,
        name: title,
        transcription: transcript || null,
        translate: translate || null,
        summary: summary || null,
        tags: tags.length > 0 ? tags : null,
      })

      fullReset()
      toast.success("Memo saved successfully")
    } catch (error) {
      console.error("Failed to save memo:", error)
      toast.error("Failed to save memo")
    } finally {
      setIsSaving(false)
    }
  }

  const handleSaveApiKey = async () => {
    const input = document.getElementById("api-key") as HTMLInputElement
    const token = localStorage.getItem("jwt")
    if (!token) {
      setShowLoginModal(true)
      return
    }

    if (input?.value) {
      const geminiKey = input.value
      try {
        await invoke("save_api_key_command", { token, geminiKey })
        setShowApiKeySettings(false)
        toast.success("API key saved")
      } catch (error) {
        toast.error("Failed to save API key.")
      }
    }
  }

  const playAudio = () => {
    if (!recordedBlob) return

    if (!isPlaying) {
      const audioUrl = URL.createObjectURL(recordedBlob)
      audioRef.current = new Audio(audioUrl)
      audioRef.current.play()
      setIsPlaying(true)

      audioRef.current.onended = () => {
        setIsPlaying(false)
        URL.revokeObjectURL(audioUrl)
      }
    } else if (audioRef.current) {
      audioRef.current.pause()
      setIsPlaying(false)
    }
  }

  const addTag = () => {
    if (newTag.trim() && !tags.includes(newTag.trim())) {
      setTags([...tags, newTag.trim()])
      setNewTag("")
    }
  }

  const removeTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove))
  }

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file && file.type.startsWith("audio/")) {
      fullReset()
      setRecordedBlob(file)
    }
  }

  const openMicrophoneSettings = async () => {
    try {
      const { open } = await import("@tauri-apps/plugin-shell")
      const userAgent = navigator.userAgent
      let settingsUrl = ""

      if (userAgent.includes("Windows")) {
        settingsUrl = "ms-settings:privacy-microphone"
      } else if (userAgent.includes("Mac")) {
        settingsUrl = "x-apple.systempreferences:com.apple.preference.security?Privacy_Microphone"
      } else {
        toast.info("Please manually navigate to your system's privacy/microphone settings.")
        setShowMicOffModal(false)
        return
      }

      await open(settingsUrl)
      setShowMicOffModal(false)
    } catch (error) {
      console.error("Failed to open settings via Tauri shell:", error)
      toast.error("Could not open settings automatically. Please open your system's privacy settings manually.")
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <style jsx>{`
        .mic-button-click {
          transform: scale(0.95);
          transition: transform 0.1s ease-in-out;
        }
        
        .recording-pulse {
          animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
        }
        
        .loading-pulse {
          animation: loadingPulse 1.5s ease-in-out infinite;
        }
        
        @keyframes pulse {
          0%, 100% {
            opacity: 1;
          }
          50% {
            opacity: .8;
          }
        }
        
        @keyframes loadingPulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }
        
        /* Blue click ripple effect */
        .blue-click-effect {
          position: relative;
          overflow: hidden;
        }
        
        .blue-click-effect::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 0;
          height: 0;
          background: radial-gradient(circle, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.1) 70%, transparent 100%);
          border-radius: 50%;
          transform: translate(-50%, -50%);
          transition: width 0.3s ease-out, height 0.3s ease-out;
          pointer-events: none;
          z-index: 0;
        }
        
        .blue-click-effect:active::before {
          width: 200px;
          height: 200px;
        }
      `}</style>

      <Card>
        <CardHeader>
          <CardTitle>Voice Recorder</CardTitle>
          <CardDescription>Record a new voice memo or upload an audio file</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center space-y-4">
            <Button
              size="lg"
              onClick={isRecording ? handleStopRecording : handleStartRecording}
              disabled={isInitializingRecording}
              className={cn(
                "h-24 w-24 rounded-full transition-all duration-300 transform-gpu relative overflow-hidden",
                "active:scale-95 active:shadow-lg",
                "hover:shadow-xl hover:scale-105",
                "focus:outline-none focus:ring-4 focus:ring-primary/20",
                "before:absolute before:inset-0 before:bg-blue-400/30 before:rounded-full before:scale-0 before:transition-transform before:duration-200",
                "active:before:scale-110 active:before:opacity-100",
                "disabled:opacity-70 disabled:cursor-not-allowed disabled:hover:scale-100",
                isInitializingRecording
                  ? "bg-blue-500 hover:bg-blue-600 loading-pulse before:bg-blue-300/40"
                  : isRecording
                    ? "bg-red-500 hover:bg-red-600 recording-pulse active:bg-red-700 before:bg-blue-300/40"
                    : "bg-primary hover:bg-primary/90 active:bg-primary/80 before:bg-blue-400/30",
              )}
            >
              {isInitializingRecording ? (
                <Loader2 className="h-10 w-10 animate-spin relative z-10" />
              ) : isRecording ? (
                <Square className="h-8 w-8 relative z-10" />
              ) : (
                <Mic className="h-10 w-10 relative z-10" />
              )}
            </Button>
            <div className="text-2xl font-mono font-bold">{formattedTime}</div>
            {isInitializingRecording && (
              <div className="text-sm text-blue-600 font-medium animate-pulse">Preparing to record...</div>
            )}
            {isRecording && <Waveform />}
            <div className="flex items-center gap-4">
              {/* UPDATED: Conditionally render Upload or Cancel button */}
              {isRecording ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    stopRecording() // Stop the recording
                    fullReset() // Reset the entire UI state
                    toast.info("Recording cancelled")
                  }}
                  className="border-red-500 text-red-500 hover:bg-red-50 hover:text-red-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel Recording
                </Button>
              ) : isInitializingRecording ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setIsInitializingRecording(false)
                    toast.info("Recording initialization cancelled")
                  }}
                  className="border-blue-500 text-blue-500 hover:bg-blue-50 hover:text-blue-600"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              ) : (
                <>
                  <span className="text-sm text-muted-foreground">or</span>
                  <Label htmlFor="audio-upload" className="cursor-pointer">
                    <Button variant="outline" asChild>
                      <span>
                        <Upload className="mr-2 h-4 w-4" /> Upload Audio
                      </span>
                    </Button>
                  </Label>
                  <Input
                    id="audio-upload"
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {recordedBlob && (
        <Card>
          <CardHeader>
            <CardTitle>Your Memo</CardTitle>
            <CardDescription>Play back, transcribe, and enhance your recording.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={playAudio}>
                {isPlaying ? <Pause className="h-4 w-4 mr-2" /> : <Play className="h-4 w-4 mr-2" />}
                {isPlaying ? "Pause" : "Play"}
              </Button>
              <span className="text-sm text-muted-foreground">Duration: {formattedTime}</span>
            </div>

            <div className="flex flex-wrap gap-2">
              <Button onClick={saveAudioOnly} variant="outline" disabled={!!savedMemoId || isSaving}>
                <Save className="mr-2 h-4 w-4" />
                {isSaving ? "Saving..." : "Save Audio Only"}
              </Button>
              <Button onClick={transcribeAudio} disabled={isTranscribing || !recordedBlob}>
                {isTranscribing ? (
                  "Transcribing..."
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" /> Transcribe
                  </>
                )}
              </Button>
            </div>

            {(transcript || isTranscribing) && (
              <div className="space-y-4 pt-4 border-t">
                <div>
                  <Label htmlFor="title">Title</Label>
                  <Input
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Title will be auto-generated..."
                  />
                </div>

                <div>
                  <Label htmlFor="transcript">Transcription</Label>
                  <Textarea
                    id="transcript"
                    value={transcript}
                    onChange={(e) => setTranscript(e.target.value)}
                    rows={6}
                    placeholder="Transcription will appear here..."
                    disabled={isTranscribing}
                  />
                </div>

                {translate && (
                  <div>
                    <Label>Translation ({targetLanguage})</Label>
                    <div className="p-4 mt-2 bg-muted rounded-md text-sm">{translate}</div>
                  </div>
                )}

                {summary && (
                  <div>
                    <Label>Summary</Label>
                    <div className="p-4 mt-2 bg-muted rounded-md text-sm">{summary}</div>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  <Button onClick={translateTranscript} disabled={isTranslating || !transcript} variant="outline">
                    {isTranslating ? (
                      "Translating..."
                    ) : (
                      <>
                        <Languages className="mr-2 h-4 w-4" /> Translate
                      </>
                    )}
                  </Button>
                  <Button onClick={summarizeTranscript} disabled={isSummarizing || !transcript} variant="outline">
                    {isSummarizing ? (
                      "Summarizing..."
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-4 w-4" /> Summarize
                      </>
                    )}
                  </Button>
                  <Select value={targetLanguage} onValueChange={setTargetLanguage} disabled={isTranslating}>
                    <SelectTrigger className="w-[180px] ">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent className="h-[20rem]">
                      <SelectItem value="English">English</SelectItem>
                      <SelectItem value="Spanish">Spanish</SelectItem>
                      <SelectItem value="French">French</SelectItem>
                      <SelectItem value="German">German</SelectItem>
                      <SelectItem value="Japanese">Japanese</SelectItem>
                      <SelectItem value="Chinese">Chinese</SelectItem>
                      <SelectItem value="Hindi">Hindi</SelectItem>
                      <SelectItem value="Malayalam">Malayalam</SelectItem>
                      <SelectItem value="Tamil">Tamil</SelectItem>
                      <SelectItem value="Telugu">Telugu</SelectItem>
                      <SelectItem value="Kannada">Kannada</SelectItem>
                      <SelectItem value="Bengali">Bengali</SelectItem>
                      <SelectItem value="Marathi">Marathi</SelectItem>
                      <SelectItem value="Russian">Russian</SelectItem>
                      <SelectItem value="Korean">Korean</SelectItem>
                      <SelectItem value="Portuguese">Portuguese</SelectItem>
                      <SelectItem value="Arabic">Arabic</SelectItem>
                      <SelectItem value="Italian">Italian</SelectItem>
                      <SelectItem value="Dutch">Dutch</SelectItem>
                      <SelectItem value="Turkish">Turkish</SelectItem>
                      <SelectItem value="Thai">Thai</SelectItem>
                      <SelectItem value="Vietnamese">Vietnamese</SelectItem>
                      <SelectItem value="Urdu">Urdu</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Tags</Label>
                  <div className="flex gap-2 my-2">
                    <Input
                      value={newTag}
                      onChange={(e) => setNewTag(e.target.value)}
                      placeholder="Add a tag..."
                      onKeyPress={(e) => e.key === "Enter" && addTag()}
                    />
                    <Button onClick={addTag} variant="outline">
                      Add
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {tags.map((tag) => (
                      <Badge key={tag} variant="secondary" className="gap-1">
                        {tag}
                        <X className="h-3 w-3 cursor-pointer" onClick={() => removeTag(tag)} />
                      </Badge>
                    ))}
                  </div>
                </div>

                <Button onClick={saveMemo} className="mt-4 w-full" disabled={isSaving || !transcript || !title}>
                  <Save className="mr-2 h-4 w-4" />
                  {isSaving ? "Saving Memo..." : "Save Full Memo"}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {apiError && (
        <div className="text-red-500 p-4 bg-red-50 dark:bg-red-900/20 rounded-md border border-red-200 dark:border-red-500/30">
          <h4 className="font-bold mb-1">An Error Occurred</h4>
          <p className="text-sm">{apiError}</p>
        </div>
      )}

      {/* Login Required Dialog */}
      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LogIn className="h-6 w-6 text-blue-500" />
              Authentication Required
            </DialogTitle>
            <DialogDescription className="pt-2">
              You need to be logged in to perform this action. Please log in to continue.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2 pt-4">
            <Button variant="ghost" onClick={() => setShowLoginModal(false)}>
              Cancel
            </Button>
            <Button onClick={() => router.push("/auth")}>Go to Login</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Microphone Off Dialog */}
      <Dialog open={showMicOffModal} onOpenChange={setShowMicOffModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertTriangle className="h-6 w-6 text-amber-500" />
              Microphone is Off or Unavailable
            </DialogTitle>
            <DialogDescription className="pt-2">
              Your system microphone appears to be disabled, disconnected, or unavailable. Please enable your microphone
              to start recording.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <Button onClick={openMicrophoneSettings} className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Go to Microphone Settings
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowMicOffModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Microphone Permission Dialog */}
      <Dialog open={showPermissionModal} onOpenChange={setShowPermissionModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <MicOff className="h-6 w-6 text-red-500" />
              Microphone Access Denied
            </DialogTitle>
            <DialogDescription className="pt-2">
              To record audio, you need to grant this application access to your microphone in your system settings.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Click the button below to open your microphone settings and grant permission to this app.
            </p>
            <Button onClick={openMicrophoneSettings} className="w-full">
              <Settings className="mr-2 h-4 w-4" />
              Open Microphone Settings
            </Button>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setShowPermissionModal(false)}>
              Close
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showApiKeySettings} onOpenChange={setShowApiKeySettings}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>API Key Required</DialogTitle>
            <DialogDescription>
              Please provide your Gemini API key to use AI features. Your key is sent securely to your backend and never
              stored on the client.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="api-key">Gemini API Key</Label>
              <Input className="mt-2" id="api-key" type="password" placeholder="Enter your Gemini API key" />
              <p className="text-xs text-muted-foreground mt-1">Get your API key from Google AI Studio.</p>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowApiKeySettings(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveApiKey}>Save API Key</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
