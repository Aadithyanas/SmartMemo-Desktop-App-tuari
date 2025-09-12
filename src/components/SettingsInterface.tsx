"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import { useTheme } from "next-themes"
import { Moon, Sun, Monitor, Trash2, Download, Key } from "lucide-react"
import { useMemoStore } from "../../lib/memo-store"
import { invoke } from "@tauri-apps/api/core"
import { toast } from "sonner"
import { ElevenLabsVoiceSettings } from "./ElevenLabsVoiceSettings"
import Link from "next/link"

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

export function SettingsInterface() {
  const { theme, setTheme } = useTheme()
  const { clearAllMemos } = useMemoStore()
  const [mounted, setMounted] = useState(false)
  const [autoDelete, setAutoDelete] = useState(false)
  const [autoDeleteDays, setAutoDeleteDays] = useState(30)
  const [transcriptionLanguage, setTranscriptionLanguage] = useState("en-US")
  const [playbackSpeed, setPlaybackSpeed] = useState([1])
  const [autoTranscribe, setAutoTranscribe] = useState(true)
  const [geminiKey, setGeminiKey] = useState("")
  const [helperAppEnabled, setHelperAppEnabled] = useState<boolean>(false)
  const [token, setToken] = useState<string | null>(null); // NEW: State for JWT

  // NEW: Effect to load token from localStorage on component mount
  useEffect(() => {
    const storedToken = localStorage.getItem("jwt");
    if (storedToken) {
      setToken(storedToken);
    } else {
      toast.error("You must be logged in to view settings.");
    }
    setMounted(true);
  }, []);

  // NEW: Effect to load settings only after the token is loaded
  useEffect(() => {
    const loadSettings = async () => {
      if (!token) return; // Don't load if there's no token
      try {
        const key = await invoke<string | null>("get_api_key_command", { token })
        const helperAppToggle = await invoke<boolean>("get_helper_window_state_command", { token })
        if (key) setGeminiKey(key)
        setHelperAppEnabled(helperAppToggle)
        console.log(helperAppToggle)
      } catch (error) {
        console.error("Failed to load settings:", error)
        toast.error("Could not load settings from the server.")
      }
    }
    loadSettings()
  }, [token])

  const formatDate = (dateString: string | null | undefined) => {
    const date = dateString ? new Date(dateString) : new Date()
    return date.toLocaleDateString("en-US", {
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    })
  }

  const generateTextContent = (memos: VoiceMemo[]) => {
    let content = `Smart Memo Export\nGenerated on: ${formatDate(new Date().toISOString())}\n\n`
    content += `Total Memos: ${memos.length}\n\n`
    content += "=".repeat(50) + "\n\n"
    memos.forEach((memo, index) => {
      content += `${index + 1}. MEMO: ${memo.title}\n`
      content += `Date: ${formatDate(memo.created_at)}\n`
      content += `Duration: ${memo.duration}\n\n`
      if (memo.transcription) {
        content += `TRANSCRIPTION:\n${memo.transcription}\n\n`
      }
      if (memo.summary) {
        content += `SUMMARY:\n${memo.summary}\n\n`
      }
      if (memo.translate) {
        content += `TRANSLATION:\n${memo.translate}\n\n`
      }
      if (memo.tags && memo.tags.length > 0) {
        content += `TAGS:\n${memo.tags.map((tag: string) => `• ${tag}`).join("\n")}\n\n`
      }
      content += "-".repeat(30) + "\n\n"
    })
    return content
  }

  const getMemos = async (): Promise<VoiceMemo[]> => {
    if (!token) {
        toast.error("Authentication required.");
        return [];
    }
    try {
      return await invoke("get_memos_command", { token }) as VoiceMemo[]
    } catch (error) {
      console.error("Failed to get memos:", error)
      return []
    }
  }

  const handleExportData = async () => {
    try {
      const memos = await getMemos()
      if (memos.length === 0) {
        toast.info("No memos to export.");
        return;
      }
      const content = generateTextContent(memos)
      const dataBlob = new Blob([content], { type: "text/plain;charset=utf-8" })
      const url = URL.createObjectURL(dataBlob)
      const link = document.createElement("a")
      link.href = url
      link.download = `smart-memo-export-${new Date().toISOString().split("T")[0]}.txt`
      link.click()
      URL.revokeObjectURL(url)
      toast.success("Memo data exported successfully")
    } catch (error) {
      console.error("Failed to export data:", error)
      toast.error("Failed to export data")
    }
  }

  const handleClearAllData = async () => {
    if (!token) return toast.error("Authentication required.");
    if (confirm("Are you sure you want to delete all memos? This action cannot be undone.")) {
      try {
        await invoke("clear_all_memos", { token })
        clearAllMemos()
        toast.success("All memos deleted successfully")
      } catch (error) {
        console.error("Failed to delete memos:", error)
        toast.error("Failed to delete memos")
      }
    }
  }

  const handleSaveApiKey = async () => {
    if (!token) return toast.error("Authentication required.");
    if (!geminiKey.trim()) {
      toast.error("Please enter a valid API key")
      return
    }
    try {
      await invoke("save_api_key_command", { token, geminiKey })
      toast.success("Gemini API key saved successfully")
    } catch (error) {
      console.error("Failed to save API key:", error)
      toast.error("Failed to save API key")
    }
  }

  const handleDeleteApiKey = async () => {
    if (!token) return toast.error("Authentication required.");
    try {
      await invoke("delete_gemini_api_key_command", { token })
      setGeminiKey("")
      toast.success("Gemini API key deleted successfully")
    } catch (error) {
      console.error("Failed to delete API key:", error)
      toast.error("Failed to delete API key")
    }
  }

  const toggleHelperApp = async (enabled: boolean) => {
    if (!token) return toast.error("Authentication required.");
    try {
      await invoke("toggle_helper_window_command", { enabled, token })
      setHelperAppEnabled(enabled)
      toast.success(`Helper window ${enabled ? "enabled" : "disabled"}`)
    } catch (error) {
      console.error("Failed to toggle helper window:", error)
      toast.error(`Failed to ${enabled ? "enable" : "disable"} helper window`)
    }
  }

  if (!mounted) {
    return null
  }

  if (!token) {
    return (
        <div className="flex items-center justify-center h-full p-6 text-center">
            <Card className="max-w-md">
                <CardHeader>
                    <CardTitle>Authentication Required</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground mb-4">Please log in to view your settings.</p>
                    <Link href="/auth">
                        <Button>Go to Login</Button>
                    </Link>
                </CardContent>
            </Card>
        </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6 p-4 md:p-0">
      {/* API Key Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Gemini API Key</CardTitle>
          <CardDescription>Enter your Gemini API key for AI transcription and processing</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="gemini-key">API Key</Label>
            <Input
              id="gemini-key"
              type="password"
              value={geminiKey}
              onChange={(e) => setGeminiKey(e.target.value)}
              placeholder="Enter your Gemini API key"
            />
            <p className="text-sm text-muted-foreground">
              Get your API key from{" "}
              <a href="https://ai.google.dev/" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                Google AI Studio
              </a>
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleSaveApiKey} disabled={!geminiKey.trim()}>
              <Key className="mr-2 h-4 w-4" />
              Save Key
            </Button>
            {geminiKey && (
              <Button variant="destructive" onClick={handleDeleteApiKey}>
                <Trash2 className="mr-2 h-4 w-4" />
                Delete Key
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
      
      {/* ElevenLabs Voice Settings */}
      <ElevenLabsVoiceSettings />

      {/* Helper Window Settings */}
      <Card>
        <CardHeader>
          <CardTitle>Helper Window</CardTitle>
          <CardDescription>Control the floating helper window for quick access</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Floating Helper Window</Label>
              <p className="text-sm text-muted-foreground">
                Show a floating window for quick memo access
              </p>
            </div>
            <Switch checked={helperAppEnabled} onCheckedChange={toggleHelperApp} />
          </div>
        </CardContent>
      </Card>
      
      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle>Appearance</CardTitle>
          <CardDescription>Customize the look and feel of Smart Memo</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <Label htmlFor="theme">Theme</Label>
            <Select value={theme || "system"} onValueChange={setTheme}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="Select theme" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="light"><div className="flex items-center gap-2"><Sun className="h-4 w-4" />Light</div></SelectItem>
                <SelectItem value="dark"><div className="flex items-center gap-2"><Moon className="h-4 w-4" />Dark</div></SelectItem>
                <SelectItem value="system"><div className="flex items-center gap-2"><Monitor className="h-4 w-4" />System</div></SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Data Management */}
      <Card>
        <CardHeader>
          <CardTitle>Data Management</CardTitle>
          <CardDescription>Manage your memo data and storage preferences</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label>Auto-delete old memos</Label>
              <p className="text-sm text-muted-foreground">Automatically delete memos after a specified time</p>
            </div>
            <Switch checked={autoDelete} onCheckedChange={setAutoDelete} />
          </div>
          {autoDelete && (
            <div className="space-y-2">
              <Label htmlFor="auto-delete-days">Delete after (days)</Label>
              <Input
                id="auto-delete-days"
                type="number"
                value={autoDeleteDays}
                onChange={(e) => setAutoDeleteDays(Number.parseInt(e.target.value) || 30)}
                min={1}
                max={365}
              />
            </div>
          )}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button onClick={handleExportData} variant="outline" className="flex-1 bg-transparent">
              <Download className="mr-2 h-4 w-4" />
              Export Data
            </Button>
            <Button onClick={handleClearAllData} variant="destructive" className="flex-1">
              <Trash2 className="mr-2 h-4 w-4" />
              Clear All Data
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
