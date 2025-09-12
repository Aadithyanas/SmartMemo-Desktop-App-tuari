 "use client"

import { createContext, useContext, useState, type ReactNode, useCallback } from "react"

interface ElevenLabsContextType {
  elevenLabsApiKey: string | null
  selectedElevenLabsVoiceId: string | null
  setElevenLabsSettings: (apiKey: string | null, voiceId: string | null) => void
}

const ElevenLabsContext = createContext<ElevenLabsContextType | undefined>(undefined)

export function ElevenLabsProvider({ children }: { children: ReactNode }) {
  const [elevenLabsApiKey, setElevenLabsApiKey] = useState<string | null>(null)
  const [selectedElevenLabsVoiceId, setSelectedElevenLabsVoiceId] = useState<string | null>(null)

  const setElevenLabsSettings = useCallback((apiKey: string | null, voiceId: string | null) => {
    setElevenLabsApiKey(apiKey)
    setSelectedElevenLabsVoiceId(voiceId)
  }, [])

  return (
    <ElevenLabsContext.Provider value={{ elevenLabsApiKey, selectedElevenLabsVoiceId, setElevenLabsSettings }}>
      {children}
    </ElevenLabsContext.Provider>
  )
}

export function useElevenLabs() {
  const context = useContext(ElevenLabsContext)
  if (context === undefined) {
    throw new Error("useElevenLabs must be used within an ElevenLabsProvider")
  }
  return context
}
