"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Key, Trash2, Loader2 } from "lucide-react"
import { toast } from "sonner"
import { useElevenLabs } from "../context/ElevenLabsContext" // Import the context hook

interface ElevenLabsVoice {
  voice_id: string
  name: string
  category: string
  labels: Record<string, string>
}

export function ElevenLabsVoiceSettings() {
  const { elevenLabsApiKey, selectedElevenLabsVoiceId, setElevenLabsSettings } = useElevenLabs()
  const [currentApiKeyInput, setCurrentApiKeyInput] = useState(elevenLabsApiKey || "")
  const [voices, setVoices] = useState<ElevenLabsVoice[]>([])
  const [isLoadingVoices, setIsLoadingVoices] = useState(false)
  const [voiceError, setVoiceError] = useState<string | null>(null)

  // Update local input state when context API key changes (e.g., on initial load)
  useEffect(() => {
    setCurrentApiKeyInput(elevenLabsApiKey || "")
  }, [elevenLabsApiKey])

  const fetchVoices = useCallback(
    async (apiKey: string) => {
      if (!apiKey) {
        setVoices([])
        setElevenLabsSettings(apiKey, null) // Clear settings in context
        setVoiceError("Please enter your ElevenLabs API key to load voices.")
        return
      }

      setIsLoadingVoices(true)
      setVoiceError(null)
      
      try {
        // Add timeout to the request
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 10000) // 10 second timeout

        const response = await fetch("https://api.elevenlabs.io/v1/voices", {
          method: "GET",
          headers: {
            "xi-api-key": apiKey.trim(),
            "Content-Type": "application/json",
            "Accept": "application/json",
          },
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // More detailed error handling
        if (!response.ok) {
          let errorMessage = `API Error (${response.status}): ${response.statusText}`
          
          // Get the response body for more details
          const contentType = response.headers.get("content-type")
          
          if (contentType && contentType.includes("application/json")) {
            try {
              const errorData = await response.json()
              console.error("ElevenLabs API Error Response:", errorData)
              
              if (errorData && typeof errorData === "object") {
                const errorText = errorData.detail || errorData.error || errorData.message || JSON.stringify(errorData)
                errorMessage = `${errorMessage} - ${errorText}`
              }
            } catch (jsonError) {
              console.warn("Could not parse error response as JSON:", jsonError)
            }
          } else {
            // Try to get response as text
            try {
              const errorText = await response.text()
              if (errorText) {
                errorMessage = `${errorMessage} - ${errorText}`
              }
            } catch (textError) {
              console.warn("Could not get response as text:", textError)
            }
          }
          
          // Provide user-friendly error messages for common issues
          if (response.status === 401) {
            errorMessage = "Invalid API key. Please check your ElevenLabs API key."
          } else if (response.status === 429) {
            errorMessage = "Rate limit exceeded. Please try again later."
          } else if (response.status === 403) {
            errorMessage = "Access forbidden. Please check your API key permissions."
          } else if (response.status >= 500) {
            errorMessage = "ElevenLabs server error. Please try again later."
          }
          
          throw new Error(errorMessage)
        }

        const data = await response.json()
        
        // Validate response structure
        if (!data || !Array.isArray(data.voices)) {
          throw new Error("Invalid response format from ElevenLabs API")
        }
        
        console.log("Successfully fetched voices:", data.voices.length)
        setVoices(data.voices)

        // If a voice was previously selected and is still available, keep it.
        // Otherwise, select the first available voice or null.
        if (
          selectedElevenLabsVoiceId &&
          data.voices.some((v: ElevenLabsVoice) => v.voice_id === selectedElevenLabsVoiceId)
        ) {
          setElevenLabsSettings(apiKey, selectedElevenLabsVoiceId)
        } else if (data.voices.length > 0) {
          setElevenLabsSettings(apiKey, data.voices[0].voice_id)
        } else {
          setElevenLabsSettings(apiKey, null)
        }
      } catch (error) {
        console.error("Error fetching ElevenLabs voices:", error)
        
        let errorMessage = "Failed to load voices"
        
        if (error instanceof Error) {
          if (error.name === 'AbortError') {
            errorMessage = "Request timed out. Please check your internet connection."
          } else if (error.message.includes('fetch')) {
            errorMessage = "Network error. Please check your internet connection."
          } else {
            errorMessage = error.message
          }
        }
        
        setVoiceError(errorMessage)
        setVoices([])
        setElevenLabsSettings(apiKey, null) // Clear voice ID in context on error
      } finally {
        setIsLoadingVoices(false)
      }
    },
    [selectedElevenLabsVoiceId, setElevenLabsSettings],
  )

  // Fetch voices when the component mounts or API key changes in context
  useEffect(() => {
    if (elevenLabsApiKey) {
      fetchVoices(elevenLabsApiKey)
    } else {
      setVoices([])
      setVoiceError("Please enter your ElevenLabs API key to load voices.")
    }
  }, [elevenLabsApiKey, fetchVoices])

  const handleSaveElevenLabsKey = () => {
    const trimmedKey = currentApiKeyInput.trim()
    
    if (!trimmedKey) {
      toast.error("Please enter a valid ElevenLabs API key")
      return
    }
    
    // Basic validation - ElevenLabs API keys typically start with certain patterns
    if (trimmedKey.length < 10) {
      toast.error("API key appears to be too short. Please check your key.")
      return
    }
    
    setElevenLabsSettings(trimmedKey, selectedElevenLabsVoiceId) // Update context
    toast.success("ElevenLabs API key updated")
  }

  const handleDeleteElevenLabsKey = () => {
    setElevenLabsSettings(null, null) // Clear settings in context
    setCurrentApiKeyInput("")
    setVoices([])
    setVoiceError("ElevenLabs API key deleted. Voices cleared.")
    toast.success("ElevenLabs API key deleted")
  }

  const handleVoiceChange = (voiceId: string) => {
    setElevenLabsSettings(elevenLabsApiKey, voiceId) // Update context
    toast.success("ElevenLabs voice selected")
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>ElevenLabs Voice Settings</CardTitle>
        <CardDescription>Configure ElevenLabs for advanced text-to-speech voices</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* API Key Input */}
        <div className="space-y-2">
          <Label htmlFor="elevenlabs-key">ElevenLabs API Key</Label>
          <Input
            id="elevenlabs-key"
            type="password"
            value={currentApiKeyInput}
            onChange={(e) => setCurrentApiKeyInput(e.target.value)}
            placeholder="Enter your ElevenLabs API key"
          />
          <p className="text-sm text-muted-foreground">
            Get your API key from{" "}
            <a
              href="https://elevenlabs.io/speech-synthesis"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              ElevenLabs
            </a>
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={handleSaveElevenLabsKey} disabled={!currentApiKeyInput.trim()}>
            <Key className="mr-2 h-4 w-4" />
            Save Key
          </Button>
          {elevenLabsApiKey && (
            <Button variant="destructive" onClick={handleDeleteElevenLabsKey}>
              <Trash2 className="mr-2 h-4 w-4" />
              Delete Key
            </Button>
          )}
        </div>

        {/* Voice Selection */}
        <div className="space-y-2">
          <Label htmlFor="elevenlabs-voice">Select Voice</Label>
          {isLoadingVoices ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Loading voices...
            </div>
          ) : voiceError ? (
            <div className="space-y-2">
              <p className="text-sm text-red-500">{voiceError}</p>
              {elevenLabsApiKey && (
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={() => fetchVoices(elevenLabsApiKey)}
                  disabled={isLoadingVoices}
                >
                  Retry
                </Button>
              )}
            </div>
          ) : voices.length > 0 ? (
            <Select value={selectedElevenLabsVoiceId || ""} onValueChange={handleVoiceChange}>
              <SelectTrigger id="elevenlabs-voice">
                <SelectValue placeholder="Choose a voice" />
              </SelectTrigger>
              <SelectContent>
                {voices.map((voice) => (
                  <SelectItem key={voice.voice_id} value={voice.voice_id}>
                    {voice.name} ({voice.category})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          ) : (
            <p className="text-sm text-muted-foreground">No voices available. Please check your API key.</p>
          )}
        </div>
      </CardContent>
    </Card>
  )
}