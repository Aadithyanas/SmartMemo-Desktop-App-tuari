"use client"

import { useState, useCallback, useEffect, useRef } from "react"
import { useElevenLabs } from "../src/context/ElevenLabsContext"

export function useSpeechSynthesis() {
  const { elevenLabsApiKey, selectedElevenLabsVoiceId } = useElevenLabs()
  const [speakingTextId, setSpeakingTextId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)

  // Cleanup function
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
        audioRef.current = null
      }
      window.speechSynthesis.cancel()
    }
  }, [])

  const speakText = useCallback(
    async (text: string | null, id: string) => {
      if (!text) return

      // Stop any currently speaking text
      window.speechSynthesis.cancel()
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }

      // If same text is clicked, stop speaking
      if (speakingTextId === id) {
        setSpeakingTextId(null)
        return
      }

      // Start new speech
      setSpeakingTextId(id)

      if (elevenLabsApiKey && selectedElevenLabsVoiceId) {
        try {
          // Simple ElevenLabs API call
          const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${selectedElevenLabsVoiceId}`, {
            method: "POST",
            headers: {
              "xi-api-key": elevenLabsApiKey,
              "Content-Type": "application/json",
              Accept: "audio/mpeg",
            },
            body: JSON.stringify({
              text: text,
              model_id: "eleven_monolingual_v1",
              voice_settings: {
                stability: 0.5,
                similarity_boost: 0.75,
              },
            }),
          })

          if (!response.ok) {
            throw new Error(`ElevenLabs API error: ${response.statusText}`)
          }

          // Get audio blob and play it
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          
          // Create or reuse audio element
          if (!audioRef.current) {
            audioRef.current = new Audio()
          }
          
          audioRef.current.src = audioUrl
          audioRef.current.play()

          // Clean up when audio ends
          audioRef.current.onended = () => {
            setSpeakingTextId(null)
            URL.revokeObjectURL(audioUrl)
          }
          
          audioRef.current.onerror = (e) => {
            console.error('Audio playback error:', e)
            setSpeakingTextId(null)
            URL.revokeObjectURL(audioUrl)
          }

        } catch (error) {
          console.error('ElevenLabs failed, using browser speech:', error)
          setSpeakingTextId(null)
          
          // Fallback to browser speech
          const utterance = new SpeechSynthesisUtterance(text)
          utterance.onend = () => setSpeakingTextId(null)
          utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
            if (event.error !== "interrupted") {
              console.error("Browser speech error:", event.error)
            }
            setSpeakingTextId(null)
          }
          window.speechSynthesis.speak(utterance)
        }
      } else {
        // Use browser's native speech synthesis
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.onend = () => setSpeakingTextId(null)
        utterance.onerror = (event: SpeechSynthesisErrorEvent) => {
          if (event.error !== "interrupted") {
            console.error("Browser speech error:", event.error)
          }
          setSpeakingTextId(null)
        }
        window.speechSynthesis.speak(utterance)
      }
    },
    [speakingTextId, elevenLabsApiKey, selectedElevenLabsVoiceId]
  )

  const isSpeaking = useCallback(
    (id: string) => {
      return speakingTextId === id
    },
    [speakingTextId]
  )

  return { speakText, isSpeaking, speakingTextId }
}