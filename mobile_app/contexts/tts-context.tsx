import React, { createContext, useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react'
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

export type ModelState = 'checking' | 'not-installed' | 'installing' | 'ready'

const CHUNK_SIZE = 3

function tempWavUri(slot: number): string {
  return FileSystem.cacheDirectory + `tts-sherpa-${slot}.wav`
}

interface TtsContextValue {
  article: Article | null
  isActive: boolean
  isPlaying: boolean
  isGenerating: boolean
  generationProgress: number
  currentIndex: number
  segments: TtsSegment[]
  speed: TtsSpeed
  modelState: ModelState
  setArticle: (article: Article) => void
  startFrom: (index: number) => void
  pause: () => void
  resume: () => void
  cycleSpeed: () => void
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
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationProgress, setGenerationProgress] = useState(0)
  const [currentIndex, setCurrentIndex] = useState(0)
  const [speed, setSpeed] = useState<TtsSpeed>(1)
  const [modelState, setModelState] = useState<ModelState>('checking')

  useEffect(() => {
    isModelInstalled().then(installed => {
      setModelState(installed ? 'ready' : 'not-installed')
    })
  }, [])

  // Refs
  const isActiveRef = useRef(false)
  const isPlayingRef = useRef(false)
  const isGeneratingRef = useRef(false)
  const currentIndexRef = useRef(0)
  const speedRef = useRef<TtsSpeed>(1)
  const segmentsRef = useRef<TtsSegment[]>([])
  const modelStateRef = useRef<ModelState>('checking')

  const sherpaTokenRef = useRef(0)
  const sherpaPlayerRef = useRef<AudioPlayer | null>(null)

  // Rolling window generation state
  const nextChunkReadyRef = useRef(false)
  const playingChunkNumRef = useRef(0)
  const playingChunkEndRef = useRef(0)

  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { isGeneratingRef.current = isGenerating }, [isGenerating])
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { segmentsRef.current = segments }, [segments])
  useEffect(() => { modelStateRef.current = modelState }, [modelState])

  useEffect(() => {
    setAudioModeAsync({ playsInSilentMode: true, shouldPlayInBackground: true }).catch(() => {})
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

  const sherpaPlayChunkRef = useRef<(startIndex: number, chunkNum: number, token: number) => void>(() => {})

  // scheduleNextChunkGeneration — generates the next chunk in the background (no spinner)
  // Defined as a plain inner function inside sherpaPlayChunkRef to capture the latest ref values.
  // We make it a ref so sherpaPlayChunkRef can call it by reference after being defined.
  const scheduleNextChunkGenerationRef = useRef<(nextStart: number, nextChunkNum: number, token: number) => void>(() => {})

  scheduleNextChunkGenerationRef.current = (nextStart: number, nextChunkNum: number, token: number) => {
    const segs = segmentsRef.current
    if (nextStart >= segs.length) return

    const chunkEnd = Math.min(nextStart + CHUNK_SIZE, segs.length)
    const chunkText = segs.slice(nextStart, chunkEnd).map(s => s.text).join(' ')
    const wavSlot = nextChunkNum % 2
    const wavUri = tempWavUri(wavSlot)

    sherpaTtsEngine.generateStream(
      chunkText,
      speedRef.current,
      wavUri,
      () => {
        // Background WAV ready
        if (token !== sherpaTokenRef.current || !isActiveRef.current) {
          FileSystem.deleteAsync(wavUri, { idempotent: true }).catch(() => {})
          return
        }

        nextChunkReadyRef.current = true

        // Gap resolution: if current chunk finished before background gen completed
        if (!sherpaPlayerRef.current && isPlayingRef.current && currentIndexRef.current === nextStart) {
          sherpaPlayChunkRef.current(nextStart, nextChunkNum, token)
        }
      },
      () => {
        // Cancelled — nothing to do
      },
      (_msg) => {
        console.log('Background TTS chunk error:', _msg)
        // Gap recovery: regenerate via sherpaPlayChunkRef (will show no spinner since chunkNum > 0)
        if (!sherpaPlayerRef.current && isPlayingRef.current && currentIndexRef.current === nextStart) {
          sherpaPlayChunkRef.current(nextStart, nextChunkNum, token)
        }
      }
    )
  }

  sherpaPlayChunkRef.current = (startIndex: number, chunkNum: number, token: number) => {
    const segs = segmentsRef.current
    if (!isActiveRef.current || !isPlayingRef.current || startIndex < 0 || segs.length === 0) {
      setIsPlaying(false)
      return
    }

    setCurrentIndex(startIndex)
    currentIndexRef.current = startIndex
    playingChunkNumRef.current = chunkNum

    const chunkEnd = Math.min(startIndex + CHUNK_SIZE, segs.length)
    playingChunkEndRef.current = chunkEnd

    const wavSlot = chunkNum % 2
    const wavUri = tempWavUri(wavSlot)

    // Start playing a WAV that is already on disk (either pre-generated or just generated)
    const startPlayback = () => {
      const player = createAudioPlayer({ uri: wavUri })
      sherpaPlayerRef.current = player

      const sub = player.addListener('playbackStatusUpdate', status => {
        // Track current segment within this chunk using time estimation
        if (status.currentTime != null && status.duration > 0) {
          const chunkSegs = segs.slice(startIndex, chunkEnd)
          const totalChars = chunkSegs.reduce((s, seg) => s + seg.text.length, 0)
          if (totalChars > 0) {
            let elapsed = 0
            for (let i = 0; i < chunkSegs.length; i++) {
              elapsed += (chunkSegs[i].text.length / totalChars) * status.duration
              if (status.currentTime < elapsed) {
                setCurrentIndex(startIndex + i)
                currentIndexRef.current = startIndex + i
                break
              }
            }
          }
        }

        if (!status.didJustFinish) return
        sub.remove()
        sherpaPlayerRef.current = null
        player.remove()
        FileSystem.deleteAsync(wavUri, { idempotent: true }).catch(() => {})

        if (token !== sherpaTokenRef.current || !isActiveRef.current) return

        if (chunkEnd >= segs.length) {
          // End of article
          setCurrentIndex(segs.length - 1)
          currentIndexRef.current = segs.length - 1
          setIsPlaying(false)
          isPlayingRef.current = false
          const _id = articleRef.current?.id
          const _uid = sessionRef.current?.user?.id
          if (_id != null && _uid) { updateReadingProgressLocal(_uid, _id, 100); syncReadingProgressToBackend(_id, 100) }
        } else if (nextChunkReadyRef.current) {
          // Happy path: next chunk already generated, play immediately
          sherpaPlayChunkRef.current(chunkEnd, chunkNum + 1, token)
        } else {
          // Gap: background gen not ready yet — park and wait for scheduleNextChunkGeneration's onWavReady
          setCurrentIndex(chunkEnd)
          currentIndexRef.current = chunkEnd
          // scheduleNextChunkGeneration's onWavReady detects !sherpaPlayerRef && isPlayingRef && currentIndex === nextStart
        }
      })

      player.play()

      // Kick off background generation of the next chunk
      if (chunkEnd < segs.length) {
        scheduleNextChunkGenerationRef.current(chunkEnd, chunkNum + 1, token)
      }
    }

    // If background generation already produced this WAV, play it directly (no re-generation)
    if (nextChunkReadyRef.current) {
      nextChunkReadyRef.current = false
      startPlayback()
      return
    }

    nextChunkReadyRef.current = false

    const showSpinner = chunkNum === 0
    if (showSpinner) {
      setIsGenerating(true)
      isGeneratingRef.current = true
      setGenerationProgress(0)
    }

    const chunkText = segs.slice(startIndex, chunkEnd).map(s => s.text).join(' ')

    sherpaTtsEngine.generateStream(
      chunkText,
      speedRef.current,
      wavUri,
      () => {
        // WAV ready — check token
        if (token !== sherpaTokenRef.current || !isActiveRef.current || !isPlayingRef.current) {
          FileSystem.deleteAsync(wavUri, { idempotent: true }).catch(() => {})
          if (showSpinner) { setIsGenerating(false); isGeneratingRef.current = false }
          return
        }
        if (showSpinner) { setIsGenerating(false); isGeneratingRef.current = false }
        startPlayback()
      },
      () => {
        // Cancelled — nothing to do
        if (showSpinner) { setIsGenerating(false); isGeneratingRef.current = false }
      },
      (_msg) => {
        console.log(_msg)
        if (token !== sherpaTokenRef.current || !isActiveRef.current || !isPlayingRef.current) return
        if (showSpinner) { setIsGenerating(false); isGeneratingRef.current = false }
        setIsPlaying(false)
        isPlayingRef.current = false
      },
      showSpinner ? (p) => setGenerationProgress(p) : undefined
    )
  }

  const stopSherpa = useCallback(() => {
    sherpaTokenRef.current += 1
    sherpaTtsEngine.stopStream()
    releaseSherpaPlayer()
    setIsGenerating(false)
    isGeneratingRef.current = false
    setGenerationProgress(0)
    nextChunkReadyRef.current = false
    playingChunkNumRef.current = 0
    playingChunkEndRef.current = 0
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
      sherpaPlayChunkRef.current(startIndex, 0, sherpaTokenRef.current)
    } catch (e) {
      console.log(e)
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

    setIsActive(true)
    isActiveRef.current = true
    setCurrentIndex(index)
    currentIndexRef.current = index

    if (modelStateRef.current !== 'ready') {
      setIsPlaying(false)
      isPlayingRef.current = false
      installAndPlay(index)
      return
    }

    setIsPlaying(true)
    isPlayingRef.current = true
    sherpaPlayChunkRef.current(index, 0, sherpaTokenRef.current)
  }, [stopSherpa, installAndPlay])

  const pause = useCallback(() => {
    setIsPlaying(false)
    isPlayingRef.current = false
    sherpaTtsEngine.stopStream()
    sherpaPlayerRef.current?.pause()
  }, [])

  const resume = useCallback(() => {
    if (!isActiveRef.current) return
    setIsPlaying(true)
    isPlayingRef.current = true
    if (sherpaPlayerRef.current) {
      sherpaPlayerRef.current.play()
      // Re-kick background generation if it was cancelled by pause()
      const cEnd = playingChunkEndRef.current
      if (cEnd < segmentsRef.current.length && !nextChunkReadyRef.current) {
        scheduleNextChunkGenerationRef.current(cEnd, playingChunkNumRef.current + 1, sherpaTokenRef.current)
      }
    } else {
      sherpaPlayChunkRef.current(currentIndexRef.current, playingChunkNumRef.current, sherpaTokenRef.current)
    }
  }, [])

  const cycleSpeed = useCallback(() => {
    setSpeed(prev => {
      const idx = TTS_SPEEDS.indexOf(prev)
      return TTS_SPEEDS[(idx + 1) % TTS_SPEEDS.length]
    })
  }, [])

  const close = useCallback(() => {
    stopSherpa()
    isActiveRef.current = false
    setIsActive(false)
    setIsPlaying(false)
    setCurrentIndex(0)
    currentIndexRef.current = 0
  }, [stopSherpa])

  // Speed change: update active player rate
  useEffect(() => {
    if (!isPlayingRef.current || !isActiveRef.current) return
    try { sherpaPlayerRef.current?.setPlaybackRate(speed) } catch {}
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
    }
  }, [])

  return (
    <TtsContext.Provider value={{
      article, isActive, isPlaying, isGenerating, generationProgress,
      currentIndex, segments, speed, modelState,
      setArticle, startFrom, pause, resume,
      cycleSpeed, close, setContent,
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
