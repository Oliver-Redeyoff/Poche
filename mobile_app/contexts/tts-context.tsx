import React, { createContext, useContext, useState, useCallback } from 'react'
import { useTTS, TtsState, TtsActions } from '../hooks/use-tts'

interface TtsContextValue extends TtsState, TtsActions {
  articleTitle: string | null
  setArticle: (content: string, title: string) => void
}

const TtsContext = createContext<TtsContextValue | null>(null)

export function TtsProvider({ children }: { children: React.ReactNode }) {
  const tts = useTTS()
  const [articleTitle, setArticleTitle] = useState<string | null>(null)

  const setArticle = useCallback((content: string, title: string) => {
    tts.setContent(content)
    setArticleTitle(title)
  }, [tts.setContent])

  return (
    <TtsContext.Provider value={{ ...tts, articleTitle, setArticle }}>
      {children}
    </TtsContext.Provider>
  )
}

export function useTtsContext(): TtsContextValue {
  const ctx = useContext(TtsContext)
  if (!ctx) throw new Error('useTtsContext must be used within TtsProvider')
  return ctx
}
