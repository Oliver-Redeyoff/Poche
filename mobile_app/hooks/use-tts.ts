import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Platform } from 'react-native'
import * as Speech from 'expo-speech'
import * as FileSystem from 'expo-file-system/legacy'
import { createAudioPlayer, AudioPlayer, setAudioModeAsync } from 'expo-audio'
import { tokenize } from '@poche/shared'
import { extractTtsSegments, TtsSegment } from '../lib/tts-extract'
import { isModelInstalled, installModel, getModelPaths } from '../lib/model-manager'
import { sherpaTtsEngine } from '../lib/sherpa-tts-engine'

export type TtsSpeed = 0.75 | 1 | 1.25 | 1.5 | 2
const TTS_SPEEDS: TtsSpeed[] = [0.75, 1, 1.25, 1.5, 2]

export type TtsEngine = 'sherpa' | 'system'
export type ModelState = 'checking' | 'not-installed' | 'installing' | 'ready'

function toSpeechRate(s: TtsSpeed): number {
  return Platform.OS === 'android' ? s : Math.min(1.0, 0.5 * s)
}

// file:// URI for expo-file-system operations
function tempWavUri(index: number): string {
  return FileSystem.cacheDirectory + `tts-sherpa-${index}.wav`
}
// Raw path (no scheme) for sherpa C++ fopen
function toNativePath(uri: string): string {
  return uri.replace(/^file:\/\//, '')
}

export interface TtsState {
  isActive: boolean
  isPlaying: boolean
  currentIndex: number
  segments: TtsSegment[]
  speed: TtsSpeed
  voices: Speech.Voice[]
  selectedVoiceId: string | null
  engine: TtsEngine
  modelState: ModelState
}

export interface TtsActions {
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

export function useTTS(): TtsState & TtsActions {
  const [content, setContentState] = useState('')
  const segments = useMemo(
    () => extractTtsSegments(tokenize(content)),
    [content]
  )

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

  // Sherpa-specific refs
  const sherpaTokenRef = useRef(0)          // incremented on every startFrom/skip/stop to cancel stale operations
  const sherpaPlayerRef = useRef<AudioPlayer | null>(null)   // active expo-audio player

  useEffect(() => { isActiveRef.current = isActive }, [isActive])
  useEffect(() => { isPlayingRef.current = isPlaying }, [isPlaying])
  useEffect(() => { currentIndexRef.current = currentIndex }, [currentIndex])
  useEffect(() => { speedRef.current = speed }, [speed])
  useEffect(() => { segmentsRef.current = segments }, [segments])

  // Configure audio session for background playback
  useEffect(() => {
    setAudioModeAsync({ playsInSilentModeIOS: true, staysActiveInBackground: true }).catch(() => {})
  }, [])
  useEffect(() => { selectedVoiceIdRef.current = selectedVoiceId }, [selectedVoiceId])
  useEffect(() => { engineRef.current = engine }, [engine])
  useEffect(() => { modelStateRef.current = modelState }, [modelState])

  // --- Sherpa playback (generateWav + expo-audio) ---

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
    if (!isActiveRef.current || !isPlayingRef.current || index < 0 || index >= segs.length) {
      setIsPlaying(false)
      return
    }

    setCurrentIndex(index)
    currentIndexRef.current = index

    const wavUri = tempWavUri(index)
    const wavPath = toNativePath(wavUri)

    // Pre-generate next segment in parallel while this one is being generated
    const nextIndex = index + 1
    let nextPregen: Promise<void> | null = null
    if (nextIndex < segs.length) {
      nextPregen = sherpaTtsEngine
        .generateWav(segs[nextIndex].text, toNativePath(tempWavUri(nextIndex)))
        .catch(() => {})
    }

    sherpaTtsEngine
      .generateWav(segs[index].text, wavPath)
      .then(() => {
        // Stale token = a skip/stop happened during generation
        if (token !== sherpaTokenRef.current || !isActiveRef.current || !isPlayingRef.current) {
          FileSystem.deleteAsync(wavUri, { idempotent: true }).catch(() => {})
          return
        }

        const player = createAudioPlayer({ uri: wavUri })
        player.setPlaybackRate(speedRef.current)
        sherpaPlayerRef.current = player

        const sub = player.addListener('playbackStatusUpdate', status => {
          if (!status.didJustFinish) return
          sub.remove()
          sherpaPlayerRef.current = null
          player.remove()
          FileSystem.deleteAsync(wavUri, { idempotent: true }).catch(() => {})

          if (token !== sherpaTokenRef.current || !isActiveRef.current || !isPlayingRef.current) return

          // Wait for the pre-generated next segment then play it
          ;(nextPregen ?? Promise.resolve()).then(() => {
            if (token !== sherpaTokenRef.current || !isActiveRef.current || !isPlayingRef.current) return
            sherpaPlaySegmentRef.current(index + 1, token)
          })
        })

        player.play()
      })
      .catch(() => {
        // generation failed — skip segment
        if (token === sherpaTokenRef.current && isActiveRef.current && isPlayingRef.current) {
          sherpaPlaySegmentRef.current(index + 1, token)
        }
      })
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

  // Stop sherpa: invalidate token + release player (engine stays initialized)
  const stopSherpa = useCallback(() => {
    sherpaTokenRef.current += 1
    releaseSherpaPlayer()
  }, [releaseSherpaPlayer])

  // Auto-install model from bundle and start playing
  const installAndPlay = useCallback(async (startIndex: number) => {
    setModelState('installing')
    modelStateRef.current = 'installing'
    try {
      await installModel()
      await sherpaTtsEngine.initialize(getModelPaths())
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
        // Resume paused player
        sherpaPlayerRef.current.play()
      } else {
        // No active player (e.g., after skip landed between segments) — regenerate
        sherpaPlaySegmentRef.current(currentIndexRef.current, sherpaTokenRef.current)
      }
    } else {
      speakSegmentRef.current(currentIndexRef.current)
    }
  }, [])

  const skipBack = useCallback(() => {
    const newIndex = Math.max(0, currentIndexRef.current - 1)
    const wasPlaying = isPlayingRef.current
    // Clear before Speech.stop() so onDone doesn't auto-advance
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
    // Clear before Speech.stop() so onDone doesn't auto-advance
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

  const setContent = useCallback((newContent: string) => {
    const newSegments = extractTtsSegments(tokenize(newContent))
    segmentsRef.current = newSegments   // sync — playback uses this immediately
    setContentState(newContent)         // async — triggers re-render
  }, [])

  const close = useCallback(() => {
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
        await sherpaTtsEngine.initialize(getModelPaths()).catch(() => {})
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

  return {
    isActive, isPlaying, currentIndex, segments, speed,
    voices, selectedVoiceId, engine, modelState,
    startFrom, pause, resume, skipBack, skipForward,
    cycleSpeed, setVoice, setEngine, close, setContent,
  }
}
