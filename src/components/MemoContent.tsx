"use client"

import { FileText, Languages, Brain, Tag, Volume2, VolumeX } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useState, useCallback, useEffect, useRef } from "react"
import { useElevenLabs } from "../context/ElevenLabsContext"

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

interface MemoContentProps {
  memo: Memo
}

export function useSpeechSynthesis() {
  const { elevenLabsApiKey, selectedElevenLabsVoiceId } = useElevenLabs()
  const [speakingTextId, setSpeakingTextId] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)

  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause()
        audioRef.current.src = ""
      }
      window.speechSynthesis.cancel()
    }
  }, [])

  const stopAllSpeech = useCallback(() => {
    window.speechSynthesis.cancel()
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ""
    }
    setSpeakingTextId(null)
    setIsLoading(false)
  }, [])

  const speakText = useCallback(
    async (text: string | null, id: string) => {
      if (!text) return

      if (speakingTextId === id) {
        stopAllSpeech()
        return
      }

      stopAllSpeech()
      setSpeakingTextId(id)
      setIsLoading(true)

      try {
        if (elevenLabsApiKey && selectedElevenLabsVoiceId) {
          const audioElement = new Audio()
          audioRef.current = audioElement
          const response = await fetch(
            `https://api.elevenlabs.io/v1/text-to-speech/${selectedElevenLabsVoiceId}`,
            {
              method: "POST",
              headers: {
                "xi-api-key": elevenLabsApiKey,
                "Content-Type": "application/json",
                "Accept": "audio/mpeg",
              },
              body: JSON.stringify({ text, model_id: "eleven_monolingual_v1" }),
            }
          )
          if (!response.ok) throw new Error(`API error: ${response.statusText}`)
          const audioBlob = await response.blob()
          const audioUrl = URL.createObjectURL(audioBlob)
          audioElement.src = audioUrl
          await audioElement.play()
          setIsLoading(false)
          audioElement.onended = () => {
            setSpeakingTextId(null)
            URL.revokeObjectURL(audioUrl)
          }
        } else {
          utteranceRef.current = new SpeechSynthesisUtterance(text)
          utteranceRef.current.onend = () => setSpeakingTextId(null)
          window.speechSynthesis.speak(utteranceRef.current)
          setIsLoading(false)
        }
      } catch (error) {
        console.error('Speech synthesis error:', error)
        stopAllSpeech()
      }
    },
    [speakingTextId, elevenLabsApiKey, selectedElevenLabsVoiceId, stopAllSpeech]
  )

  const isSpeaking = useCallback((id: string) => speakingTextId === id, [speakingTextId])

  return { speakText, isSpeaking, speakingTextId, isLoading }
}

export function MemoContent({ memo }: MemoContentProps) {
  const { speakText, isSpeaking, isLoading } = useSpeechSynthesis()

  return (
    <div className="space-y-4">
      {memo.transcript && (
        <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-500/10 dark:to-cyan-500/10 p-6 rounded-xl border border-blue-200 dark:border-blue-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              <h4 className="font-semibold text-blue-800 dark:text-blue-300">Transcription</h4>
            </div>
            <Button variant="ghost" size="icon" onClick={() => speakText(memo.transcript, `${memo.id}-transcription`)} disabled={isLoading && isSpeaking(`${memo.id}-transcription`)} className="text-blue-600 dark:text-blue-400 hover:bg-blue-100 dark:hover:bg-blue-900/20">
              {isLoading && isSpeaking(`${memo.id}-transcription`) ? <div className="h-5 w-5 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" /> : isSpeaking(`${memo.id}-transcription`) ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
          <div className="max-h-[150px] overflow-y-auto pr-2">
            <p className="text-gray-800 dark:text-white leading-relaxed">{memo.transcript}</p>
          </div>
        </div>
      )}
      {memo.translate && (
        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-500/10 dark:to-emerald-500/10 p-6 rounded-xl border border-green-200 dark:border-green-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Languages className="h-5 w-5 text-green-600 dark:text-green-400" />
              <h4 className="font-semibold text-green-800 dark:text-green-300">Translation</h4>
            </div>
            <Button variant="ghost" size="icon" onClick={() => speakText(memo.translate, `${memo.id}-translation`)} disabled={isLoading && isSpeaking(`${memo.id}-translation`)} className="text-green-600 dark:text-green-400 hover:bg-green-100 dark:hover:bg-green-900/20">
              {isLoading && isSpeaking(`${memo.id}-translation`) ? <div className="h-5 w-5 border-2 border-green-600 border-t-transparent rounded-full animate-spin" /> : isSpeaking(`${memo.id}-translation`) ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
          <div className="max-h-[150px] overflow-y-auto pr-2">
            <p className="text-gray-800 dark:text-white leading-relaxed">{memo.translate}</p>
          </div>
        </div>
      )}
      {memo.summary && (
        <div className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-500/10 dark:to-pink-500/10 p-6 rounded-xl border border-purple-200 dark:border-purple-500/20">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              <h4 className="font-semibold text-purple-800 dark:text-purple-300">AI Summary</h4>
            </div>
            <Button variant="ghost" size="icon" onClick={() => speakText(memo.summary, `${memo.id}-summary`)} disabled={isLoading && isSpeaking(`${memo.id}-summary`)} className="text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/20">
              {isLoading && isSpeaking(`${memo.id}-summary`) ? <div className="h-5 w-5 border-2 border-purple-600 border-t-transparent rounded-full animate-spin" /> : isSpeaking(`${memo.id}-summary`) ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
            </Button>
          </div>
          <div className="max-h-[150px] overflow-y-auto pr-2">
            <p className="text-gray-800 dark:text-white leading-relaxed">{memo.summary}</p>
          </div>
        </div>
      )}
    </div>
  )
}
