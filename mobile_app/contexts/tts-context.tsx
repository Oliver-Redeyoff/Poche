import React, { createContext, useContext, useState, useCallback } from 'react'
import { useTTS, TtsState, TtsActions } from '../hooks/use-tts'

interface TtsContextValue extends TtsState, TtsActions {
  articleId: number | null
  articleTitle: string | null
  articleAuthor: string | null
  articleThumb: string | null
  setArticle: (content: string, title: string, author?: string | null, thumb?: string | null, id?: number | null) => void
}

const TtsContext = createContext<TtsContextValue | null>(null)

export function TtsProvider({ children }: { children: React.ReactNode }) {
  const tts = useTTS()
  const [articleId, setArticleId] = useState<number | null>(null)
  const [articleTitle, setArticleTitle] = useState<string | null>(null)
  const [articleAuthor, setArticleAuthor] = useState<string | null>(null)
  const [articleThumb, setArticleThumb] = useState<string | null>(null)

  const setArticle = useCallback((content: string, title: string, author?: string | null, thumb?: string | null, id?: number | null) => {
    tts.setContent(content)
    setArticleId(id ?? null)
    setArticleTitle(title)
    setArticleAuthor(author ?? null)
    setArticleThumb(thumb ?? null)
  }, [tts.setContent])

  return (
    <TtsContext.Provider value={{ ...tts, articleId, articleTitle, articleAuthor, articleThumb, setArticle }}>
      {children}
    </TtsContext.Provider>
  )
}

export function useTtsContext(): TtsContextValue {
  const ctx = useContext(TtsContext)
  if (!ctx) throw new Error('useTtsContext must be used within TtsProvider')
  return ctx
}
