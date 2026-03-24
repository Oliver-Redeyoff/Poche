import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import * as Speech from 'expo-speech'
import * as FileSystem from 'expo-file-system/legacy'
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio'
import { tokenize, Article } from '@poche/shared'
import { extractTtsSegments, TtsSegment } from '../lib/tts-extract'
import { isModelInstalled, installModel, getModelDir } from '../lib/model-manager'
import { sherpaTtsEngine } from '../lib/sherpa-tts-engine'
import { useAuth } from '../app/_layout'
import { updateReadingProgressLocal, syncReadingProgressToBackend } from '../lib/article-sync'

export type TtsSpeed = 0.75 | 1 | 1.25 | 1.5 | 2
const TTS_SPEEDS: TtsSpeed[] = [0.75, 1, 1.25, 1.5, 2]

export type TtsEngine = 'sherpa' | 'system'
export type ModelState = 'checking' | 'not-installed' | 'installing' | 'ready'

function toSpeechRate(s: TtsSpeed): number {
  return Platform.OS === 'android' ? s : Math.min(1.0, 0.5 * s)
}

function tempWavUri(index: number): string {
  return FileSystem.cacheDirectory + `tts-sherpa-${index}.wav`
}

interface TtsContextValue {
  article: Article | null
  isActive: boolean
  isPlaying: boolean
  currentIndex: number
  segments: TtsSegment[]
  speed: TtsSpeed
  voices: Speech.Voice[]
  selectedVoiceId: string | null
  engine: TtsEngine
  modelState: ModelState
  setArticle: (article: Article) => void
  startFrom: (index: number) => void
  pause: () => void
  resume: () => void
  skipBack: () => void
  skipForward: () => void
  cycleSpeed: () => void
  setVoice: (id: string | null) => void
  setEngine: (engine: TtsEngine) => void
  close: () => void
  setContent: (content: string) => void
}

const TtsContext = createContext<TtsContextValue | null>(null)

export function TtsProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth()
  const sessionRef = useRef(session)
  sessionRef.current = session

  // --- Article metadata ---
  const [article, setArticleState] = useState<Article | null>(null)
  const articleRef = useRef<Article | null>(null)

  // --- TTS state ---
  const [content, setContentState] = useState('')
  const segments = useMemo(() => extractTtsSegments(tokenize(content)), [content])

  const [isActive, setIsActive] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [speed, setSpeed] = useState<TtsSpeed>(1)
  const [voices, setVoices] = useState<Speech.Voice[]>([])
  const [selectedVoiceId, setSelectedVoiceId] = useState<string | null>(null)
  const [engine, setEngineState] = useState<TtsEngine>('sherpa')
  const [modelState, setModelState] = useState<ModelState>('checking')

  useEffect(() => {
    Speech.getAvailableVoicesAsync().then(v => setVoices(v)).catch(() => {})
  }, [])

  useEffect(() => {
    isModelInstalled().then(installed => {
      setModelState(installed ? 'ready' : 'not-installed')
    })
  }, [])

  // Refs
  const isActiveRef = useRef(false)
  const isPlayingRef = useRef(false)
  const currentIndexRef = useRef(0)
  const speedRef = useRef<TtsSpeed>(1)
  const segmentsRef = useRef<TtsSegment[]>([])
  const selectedVoiceIdRef = useRef<string | null>(null)
  const engineRef = useRef<TtsEngine>('sherpa')
  const modelStateRef = useRef<ModelState>('checking')

  const sherpaTokenRef = useRef(0)
  const sherpaPlayerRef = useRef<AudioPlayer | null>(null)

  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { segmentsRef.current = segments }, [segments])
  useEffect(() => { selectedVoiceIdRef.current = selectedVoiceId }, [selectedVoiceId])
  useEffect(() => { engineRef.current = engine }, [engine])
  useEffect(() => { modelStateRef.current = modelState }, [modelState])

  useEffect(() => {
    setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true }).catch(() => {})
  }, [])

  // --- Sherpa playback ---

  const releaseSherpaPlayer = useCallback(() => {
    const p = sherpaPlayerRef.current
    if (p) {
      sherpaPlayerRef.current = null
      try { p.pause() } catch {}
      try { p.remove() } catch {}
    }
  }, [])

  const sherpaPlaySegmentRef = useRef<(index: number, token: number) => void>(() => {})

  sherpaPlaySegmentRef.current = (index: number, token: number) => {
    const segs = segmentsRef.current
    if (!isActiveRef.current || !isPlayingRef.current || index < 0 || segs.length === 0) {
      setIsPlaying(false)
      return
    }

    setCurrentIndex(index)
    currentIndexRef.current = index

    // Join all segments from the start index into one string
    const fullText = segs.slice(index).map(s => s.text).join(' ')

    sherpaTtsEngine.generateStream(
      fullText,
      speedRef.current,
      (_msg) => {
        if (token !== sherpaTokenRef.current || !isActiveRef.current || !isPlayingRef.current) return
        setIsPlaying(false)
        isPlayingRef.current = false
      }
    )
  }

  // --- System (expo-speech) playback ---

  const speakSegmentRef = useRef<(index: number) => void>(() => {})

  speakSegmentRef.current = (index: number) => {
    const segs = segmentsRef.current
    if (!isActiveRef.current || index < 0 || index >= segs.length) {
      setIsPlaying(false)
      return
    }

    setCurrentIndex(index)
    currentIndexRef.current = index

    Speech.speak(segs[index].text, {
      rate: toSpeechRate(speedRef.current),
      voice: selectedVoiceIdRef.current ?? undefined,
      onDone: () => { if (isActiveRef.current && isPlayingRef.current) speakSegmentRef.current(index + 1) },
      onStopped: () => {},
      onError: () => { if (isActiveRef.current) speakSegmentRef.current(index + 1) },
    })
  }

  // --- Unified dispatch ---

  const playSegment = useCallback((index: number) => {
    if (engineRef.current === 'sherpa' && modelStateRef.current === 'ready') {
      sherpaPlaySegmentRef.current(index, sherpaTokenRef.current)
    } else {
      speakSegmentRef.current(index)
    }
  }, [])

  const stopSherpa = useCallback(() => {
    sherpaTokenRef.current += 1
    sherpaTtsEngine.stopStream()
    releaseSherpaPlayer()
  }, [releaseSherpaPlayer])

  const installAndPlay = useCallback(async (startIndex: number) => {
    setModelState('installing')
    modelStateRef.current = 'installing'
    try {
      await installModel()
      await sherpaTtsEngine.initialize(getModelDir())
      setModelState('ready')
      modelStateRef.current = 'ready'
      setIsPlaying(true)
      isPlayingRef.current = true
      sherpaPlaySegmentRef.current(startIndex, sherpaTokenRef.current)
    } catch {
      setModelState('not-installed')
      modelStateRef.current = 'not-installed'
      setIsActive(false)
      isActiveRef.current = false
      setIsPlaying(false)
      isPlayingRef.current = false
    }
  }, [])

  // --- Public actions ---

  const setArticle = useCallback((newArticle: Article) => {
    setContentState(newArticle.content || '')
    const newSegments = extractTtsSegments(tokenize(newArticle.content || ''))
    segmentsRef.current = newSegments
    setArticleState(newArticle)
    articleRef.current = newArticle
  }, [])

  const setContent = useCallback((newContent: string) => {
    const newSegments = extractTtsSegments(tokenize(newContent))
    segmentsRef.current = newSegments
    setContentState(newContent)
  }, [])

  const startFrom = useCallback((index: number) => {
    stopSherpa()
    Speech.stop()

    setIsActive(true)
    isActiveRef.current = true
    setCurrentIndex(index)
    currentIndexRef.current = index

    if (engineRef.current === 'sherpa' && modelStateRef.current !== 'ready') {
      setIsPlaying(false)
      isPlayingRef.current = false
      installAndPlay(index)
      return
    }

    setIsPlaying(true)
    isPlayingRef.current = true
    playSegment(index)
  }, [stopSherpa, playSegment, installAndPlay])

  const pause = useCallback(() => {
    setIsPlaying(false)
    isPlayingRef.current = false
    if (engineRef.current === 'sherpa') {
      sherpaTtsEngine.stopStream()
      sherpaPlayerRef.current?.pause()
    } else {
      Speech.stop()
    }
  }, [])

  const resume = useCallback(() => {
    if (!isActiveRef.current) return
    setIsPlaying(true)
    isPlayingRef.current = true
    if (engineRef.current === 'sherpa') {
      if (sherpaPlayerRef.current) {
        sherpaPlayerRef.current.play()
      } else {
        sherpaPlaySegmentRef.current(currentIndexRef.current, sherpaTokenRef.current)
      }
    } else {
      speakSegmentRef.current(currentIndexRef.current)
    }
  }, [])

  const skipBack = useCallback(() => {
    const newIndex = Math.max(0, currentIndexRef.current - 1)
    const wasPlaying = isPlayingRef.current
    isPlayingRef.current = false
    stopSherpa()
    Speech.stop()
    setCurrentIndex(newIndex)
    currentIndexRef.current = newIndex
    if (wasPlaying) {
      isPlayingRef.current = true
      playSegment(newIndex)
    }
  }, [stopSherpa, playSegment])

  const skipForward = useCallback(() => {
    const newIndex = Math.min(segmentsRef.current.length - 1, currentIndexRef.current + 1)
    const wasPlaying = isPlayingRef.current
    isPlayingRef.current = false
    stopSherpa()
    Speech.stop()
    setCurrentIndex(newIndex)
    currentIndexRef.current = newIndex
    if (wasPlaying) {
      isPlayingRef.current = true
      playSegment(newIndex)
    }
  }, [stopSherpa, playSegment])

  const cycleSpeed = useCallback(() => {
    setSpeed(prev => {
      const idx = TTS_SPEEDS.indexOf(prev)
      return TTS_SPEEDS[(idx + 1) % TTS_SPEEDS.length]
    })
  }, [])

  const setVoice = useCallback((id: string | null) => {
    setSelectedVoiceId(id)
    selectedVoiceIdRef.current = id
    if (isPlayingRef.current && isActiveRef.current && engineRef.current === 'system') {
      isPlayingRef.current = false
      Speech.stop()
      isPlayingRef.current = true
      speakSegmentRef.current(currentIndexRef.current)
    }
  }, [])

  const setEngine = useCallback((newEngine: TtsEngine) => {
    const wasPlaying = isPlayingRef.current
    isPlayingRef.current = false
    stopSherpa()
    Speech.stop()
    setEngineState(newEngine)
    engineRef.current = newEngine
    if (wasPlaying && isActiveRef.current) {
      isPlayingRef.current = true
      playSegment(currentIndexRef.current)
    }
  }, [stopSherpa, playSegment])

  const close = useCallback(() => {
    const id = articleRef.current?.id
    const userId = sessionRef.current?.user?.id
    if (id != null && userId && isActiveRef.current && segmentsRef.current.length > 0) {
      const progress = Math.min(100, Math.round((currentIndexRef.current + 1) / segmentsRef.current.length * 100))
      updateReadingProgressLocal(userId, id, progress)
      syncReadingProgressToBackend(id, progress)
    }
    stopSherpa()
    Speech.stop()
    isActiveRef.current = false
    setIsActive(false)
    setIsPlaying(false)
    setCurrentIndex(0)
    currentIndexRef.current = 0
  }, [stopSherpa])

  // Speed change: update active player rate (Sherpa) or restart segment (system)
  useEffect(() => {
    if (!isPlayingRef.current || !isActiveRef.current) return
    if (engineRef.current === 'sherpa') {
      try { sherpaPlayerRef.current?.setPlaybackRate(speed) } catch {}
    } else {
      Speech.stop()
      speakSegmentRef.current(currentIndexRef.current)
    }
  }, [speed])

  // Initialize engine on mount if model already installed
  useEffect(() => {
    isModelInstalled().then(async installed => {
      if (installed) {
        await sherpaTtsEngine.initialize(getModelDir()).catch(() => {})
      }
    })
  }, [])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isActiveRef.current = false
      sherpaTokenRef.current += 1
      releaseSherpaPlayer()
      sherpaTtsEngine.dispose()
      Speech.stop()
    }
  }, [])

  return (
    <TtsContext.Provider value={{
      article, isActive, isPlaying, currentIndex, segments, speed,
      voices, selectedVoiceId, engine, modelState,
      setArticle, startFrom, pause, resume, skipBack, skipForward,
      cycleSpeed, setVoice, setEngine, close, setContent,
    }}>
      {children}
    </TtsContext.Provider>
  )
}

export function useTtsContext(): TtsContextValue {
  const ctx = useContext(TtsContext)
  if (!ctx) throw new Error('useTtsContext must be used within TtsProvider')
  return ctx
}
