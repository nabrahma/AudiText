/* eslint-disable react-refresh/only-export-components */

// Audio Player Context
// Manages global audio state using Browser Native TTS (SpeechSynthesis)
// Features: Chunking for Seek/Speed support, Auto-cleaning of text
//
// Architecture notes:
// - Playback truth lives in refs (chunks / index / speed / playing). React state is a
//   mirror used for rendering, so callbacks never read stale closures.
// - `currentTime` ticks at 60fps, so it is published through its own context
//   (`useAudioTime`) instead of the main state object. That keeps the ticking out of
//   every consumer's render path - only the scrub bar re-renders per frame.
// - Every utterance carries a token. Stale `onend` / `onerror` callbacks (the ones
//   `cancel()` fires for the previous utterance) are ignored by token mismatch, which
//   is what previously caused chunks to be skipped or spoken twice.

import type { ReactNode } from 'react'
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import type { ExtractedContent } from './api'
import { processUrl as processUrlApi } from './api'
import { supabase } from './supabase'

interface AudioState {
  // Content
  url: string | null
  content: ExtractedContent | null

  // Audio State
  isPlaying: boolean
  duration: number
  playbackSpeed: number

  // Native Chunking State
  nativeChunks: string[]
  currentChunkIndex: number

  // Loading states
  isExtracting: boolean
  error: string | null
  itemId?: string // For syncing progress to DB
}

interface AudioContextType extends AudioState {
  isSupported: boolean
  getCurrentTime: () => number
  processUrl: (url: string) => Promise<ExtractedContent>
  playContent: (content: ExtractedContent, speed?: number, itemId?: string, url?: string) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  seek: (time: number) => void
  setSpeed: (speed: number) => void
  reset: () => void
}

const SPEED_KEY = 'audiotext_playback_speed'
const STORAGE_KEY = 'audiotext_player_state'

/** Native TTS at rate 1 lands around ~155 words/min. Used for duration estimates. */
const WORDS_PER_SECOND = 2.6
export const MIN_SPEED = 0.5
export const MAX_SPEED = 2.5
/** Long utterances are unseekable and hit Chrome's ~15s speech watchdog. */
const MAX_CHUNK_CHARS = 220
/** Anything bigger than this is not worth persisting to localStorage. */
const MAX_PERSISTED_CHARS = 150_000

const synth: SpeechSynthesis | undefined =
  typeof window !== 'undefined' && 'speechSynthesis' in window ? window.speechSynthesis : undefined

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)

const readStoredSpeed = () => {
  const stored = Number(localStorage.getItem(SPEED_KEY))
  return Number.isFinite(stored) && stored > 0 ? clamp(stored, MIN_SPEED, MAX_SPEED) : 1
}

const initialState: AudioState = {
  url: null,
  content: null,
  isPlaying: false,
  duration: 0,
  playbackSpeed: 1,
  nativeChunks: [],
  currentChunkIndex: 0,
  isExtracting: false,
  error: null,
  itemId: undefined,
}

// ============================================
// Text preparation
// ============================================

/** Split an over-long sentence on word boundaries so seeking stays granular. */
function splitLongChunk(chunk: string): string[] {
  if (chunk.length <= MAX_CHUNK_CHARS) return [chunk]

  const parts: string[] = []
  let current = ''

  for (const word of chunk.split(/\s+/)) {
    if (current && current.length + word.length + 1 > MAX_CHUNK_CHARS) {
      parts.push(current)
      current = word
    } else {
      current = current ? `${current} ${word}` : word
    }
  }
  if (current) parts.push(current)

  return parts
}

/** Clean the extracted text and split it into speakable, seekable chunks. */
export function prepareChunks(content: ExtractedContent): string[] {
  const title = content.title || ''
  let author = content.author || 'Unknown'
  let text = content.content || ''

  // 1. Remove metadata fluff (conservative - keep hashtags/list items for social posts)
  text = text
    .replace(/(published|posted) on .+/gi, '')
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[(.*?)\]\(.*?\)/g, '$1') // Keep link text, remove URL
    .replace(/https?:\/\/\S+/g, '') // Remove raw URLs
    .replace(/```[\s\S]*?```/g, '') // Remove code blocks
    .replace(/[#*_>~`]/g, '') // Remove markdown syntax chars but keep the text
    .replace(/share on .+/gi, '')
    .trim()

  // 2. Infer author if unknown
  if (author === 'Unknown') {
    const byMatch = text.match(/^(?:written |authored )?by\s+([A-Za-z ]+)/im)
    if (byMatch && byMatch[1].length < 30) {
      author = byMatch[1].trim()
      text = text.replace(byMatch[0], '') // Avoid repeating it in the body
    }
  }

  // 3. Remove title/author from the body when they repeat at the start
  if (title && text.toLowerCase().startsWith(title.toLowerCase())) {
    text = text.substring(title.length).trim()
  }
  const authorPattern = new RegExp(`^by ${author.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}`, 'i')
  if (authorPattern.test(text)) {
    text = text.replace(authorPattern, '').trim()
  }
  text = text.replace(/^Author:\s*.+\n*/i, '').trim()

  // 4. Collapse whitespace
  text = text.replace(/\n{3,}/g, '\n\n').trim()
  if (!text) return []

  // 5. Split on sentence ends and hard line breaks so pauses feel natural
  const sentences = text
    .replace(/([.!?])\s+/g, '$1\n')
    .split('\n')
    .map(s => s.trim())
    .filter(Boolean)

  // 6. Merge fragments ("Mr.", "No.") into the next sentence to avoid choppy pauses
  const merged: string[] = []
  let pending = ''

  for (const sentence of sentences) {
    const candidate = pending ? `${pending} ${sentence}` : sentence
    if (candidate.length < 20) {
      pending = candidate
    } else {
      merged.push(candidate)
      pending = ''
    }
  }
  if (pending) {
    if (merged.length > 0) merged[merged.length - 1] += ` ${pending}`
    else merged.push(pending)
  }

  // 7. Break anything still too long for a single utterance
  return merged.flatMap(splitLongChunk)
}

const estimateDuration = (chunks: string[]) => {
  const words = chunks.reduce((total, chunk) => total + chunk.split(/\s+/).length, 0)
  return words > 0 ? words / WORDS_PER_SECOND : 0
}

// ============================================
// Persistence
// ============================================

interface PersistedState {
  url: string | null
  content: ExtractedContent | null
  currentChunkIndex: number
  itemId?: string
}

const loadStateFromStorage = (): AudioState => {
  const base: AudioState = { ...initialState, playbackSpeed: readStoredSpeed() }

  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return base

    const parsed = JSON.parse(stored) as PersistedState
    if (!parsed?.content?.content) return base

    // Chunks are derived, never stored - keeps localStorage small and always in sync
    // with the current chunking rules.
    const chunks = prepareChunks(parsed.content)
    if (chunks.length === 0) return base

    return {
      ...base,
      url: parsed.url ?? null,
      content: parsed.content,
      itemId: parsed.itemId,
      nativeChunks: chunks,
      currentChunkIndex: clamp(parsed.currentChunkIndex ?? 0, 0, chunks.length - 1),
      duration: estimateDuration(chunks),
    }
  } catch (e) {
    console.warn('Failed to load audio state', e)
    return base
  }
}

const AudioContext = createContext<AudioContextType | null>(null)
const AudioTimeContext = createContext<number>(0)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioState>(loadStateFromStorage)
  // A restored session resumes at a chunk partway through, so the clock has to start
  // there too - otherwise the bar reads 0:00 while the highlighted line is halfway down.
  const [displayTime, setDisplayTime] = useState(() =>
    state.nativeChunks.length > 0
      ? (state.currentChunkIndex / state.nativeChunks.length) * state.duration
      : 0
  )

  // --- Playback truth (refs so callbacks never read stale state) ---
  const chunksRef = useRef<string[]>(state.nativeChunks)
  const indexRef = useRef(state.currentChunkIndex)
  const speedRef = useRef(state.playbackSpeed)
  const durationRef = useRef(state.duration)
  const isPlayingRef = useRef(false)
  const itemIdRef = useRef<string | undefined>(state.itemId)

  // --- TTS bookkeeping ---
  const tokenRef = useRef(0)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null) // GC guard (Chrome)
  const charIndexRef = useRef(0) // Resume position inside the current chunk
  const voiceRef = useRef<SpeechSynthesisVoice | null>(null)
  const speedRestartRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // --- Clock ---
  const rafRef = useRef<number | null>(null)
  const lastFrameRef = useRef(0)
  const currentTimeRef = useRef(displayTime)

  /** Update refs and React state together so the two never drift apart. */
  const applyState = useCallback((patch: Partial<AudioState>) => {
    if (patch.nativeChunks !== undefined) chunksRef.current = patch.nativeChunks
    if (patch.currentChunkIndex !== undefined) indexRef.current = patch.currentChunkIndex
    if (patch.playbackSpeed !== undefined) speedRef.current = patch.playbackSpeed
    if (patch.duration !== undefined) durationRef.current = patch.duration
    if (patch.isPlaying !== undefined) isPlayingRef.current = patch.isPlaying
    if (patch.itemId !== undefined) itemIdRef.current = patch.itemId
    setState(prev => ({ ...prev, ...patch }))
  }, [])

  const setTime = useCallback((time: number) => {
    currentTimeRef.current = time
    setDisplayTime(time)
  }, [])

  /** Timeline position where a given chunk starts. */
  const chunkStartTime = useCallback((index: number) => {
    const total = chunksRef.current.length
    if (total === 0) return 0
    return (clamp(index, 0, total) / total) * durationRef.current
  }, [])

  // ============================================
  // Clock
  // ============================================

  const stopClock = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current)
      rafRef.current = null
    }
  }, [])

  const startClock = useCallback(() => {
    stopClock()
    lastFrameRef.current = performance.now()

    const tick = (now: number) => {
      const delta = (now - lastFrameRef.current) / 1000
      lastFrameRef.current = now

      if (isPlayingRef.current) {
        // Never run past the end of the chunk actually being spoken - that is what
        // kept the bar drifting ahead of the voice.
        const ceiling = Math.min(chunkStartTime(indexRef.current + 1), durationRef.current)
        const next = Math.min(currentTimeRef.current + delta * speedRef.current, ceiling)
        if (next !== currentTimeRef.current) setTime(next)
      }

      rafRef.current = requestAnimationFrame(tick)
    }

    rafRef.current = requestAnimationFrame(tick)
  }, [chunkStartTime, setTime, stopClock])

  // ============================================
  // Voices
  // ============================================

  const pickVoice = useCallback(() => {
    if (!synth) return null
    if (voiceRef.current) return voiceRef.current

    const voices = synth.getVoices()
    if (voices.length === 0) return null

    voiceRef.current =
      voices.find(v => /^en[-_]US/i.test(v.lang) && v.localService) ??
      voices.find(v => /^en/i.test(v.lang)) ??
      voices[0]

    return voiceRef.current
  }, [])

  useEffect(() => {
    if (!synth) return
    pickVoice()
    const onVoicesChanged = () => {
      voiceRef.current = null
      pickVoice()
    }
    synth.addEventListener?.('voiceschanged', onVoicesChanged)
    return () => synth.removeEventListener?.('voiceschanged', onVoicesChanged)
  }, [pickVoice])

  // ============================================
  // Progress sync
  // ============================================

  const saveProgress = useCallback(async (id: string | undefined, progress: number) => {
    if (!id) return
    const safeProgress = clamp(Math.round(progress), 0, 100)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return // Guest - nothing to sync

      const { error } = await supabase
        .from('library_items')
        .update({ progress: safeProgress })
        .eq('id', id)

      // "Not authenticated" just means we cannot save; not worth surfacing.
      if (error && !error.message.includes('authenticated')) {
        console.error('Failed to save progress:', error)
      }
    } catch (e) {
      console.error('Failed to save progress:', e)
    }
  }, [])

  const currentProgressPercent = useCallback(() => {
    const total = chunksRef.current.length
    return total > 0 ? (indexRef.current / total) * 100 : 0
  }, [])

  // ============================================
  // Speech engine
  // ============================================

  /**
   * Invalidate the in-flight utterance and stop the engine.
   * Chrome ignores `cancel()` while paused, so we resume first.
   * Returns the new token that callers can use to guard their own callbacks.
   */
  const cancelSpeech = useCallback(() => {
    const token = ++tokenRef.current
    if (synth) {
      if (synth.paused) synth.resume()
      synth.cancel()
    }
    return token
  }, [])

  // `advance` and `speakFrom` are mutually recursive; the ref breaks the cycle.
  const advanceRef = useRef<(fromIndex: number) => void>(() => {})

  const finish = useCallback(() => {
    cancelSpeech()
    stopClock()
    charIndexRef.current = 0
    applyState({ isPlaying: false, currentChunkIndex: 0 })
    setTime(0)
    saveProgress(itemIdRef.current, 100)
  }, [applyState, cancelSpeech, saveProgress, setTime, stopClock])

  /**
   * Speak `chunks[index]`, optionally resuming from `charOffset` inside it.
   * Any previously scheduled utterance is invalidated by the token bump.
   */
  const speakFrom = useCallback((index: number, charOffset = 0) => {
    const chunks = chunksRef.current
    if (!synth || chunks.length === 0) return

    if (index >= chunks.length) {
      finish()
      return
    }

    const token = cancelSpeech()

    const text = chunks[index].slice(charOffset)
    if (!text.trim()) {
      // Nothing left in this chunk - move straight on.
      advanceRef.current(index)
      return
    }

    const utterance = new SpeechSynthesisUtterance(text)
    utterance.rate = clamp(speedRef.current, 0.1, 10)
    const voice = pickVoice()
    if (voice) {
      utterance.voice = voice
      utterance.lang = voice.lang
    }

    utterance.onboundary = event => {
      if (token !== tokenRef.current) return
      charIndexRef.current = charOffset + (event.charIndex ?? 0)
    }

    utterance.onend = () => {
      if (token !== tokenRef.current) return // Superseded by a seek/skip/pause
      charIndexRef.current = 0
      advanceRef.current(index)
    }

    utterance.onerror = event => {
      if (token !== tokenRef.current) return
      // `interrupted` / `canceled` are our own cancel() calls, not real failures.
      if (event.error === 'interrupted' || event.error === 'canceled') return
      console.warn('TTS error, skipping chunk:', event.error)
      charIndexRef.current = 0
      advanceRef.current(index)
    }

    // Chrome drops speak() calls issued in the same tick as cancel(). Defer one tick.
    utteranceRef.current = utterance
    setTimeout(() => {
      if (token !== tokenRef.current) return
      synth.speak(utterance)
    }, 0)

    if (charOffset === 0) setTime(chunkStartTime(index))
    applyState({ currentChunkIndex: index })
    startClock()
  }, [applyState, cancelSpeech, chunkStartTime, finish, pickVoice, setTime, startClock])

  // Kept current after every render; only ever invoked from speech callbacks, which
  // run long after the first commit.
  useEffect(() => {
    advanceRef.current = (fromIndex: number) => {
      const next = fromIndex + 1
      if (next < chunksRef.current.length) speakFrom(next, 0)
      else finish()
    }
  })

  // ============================================
  // Public actions
  // ============================================

  const play = useCallback(() => {
    if (!synth || chunksRef.current.length === 0) return

    applyState({ isPlaying: true })
    startClock()

    if (synth.paused && synth.speaking) {
      synth.resume()
    } else {
      speakFrom(indexRef.current, charIndexRef.current)
    }
  }, [applyState, speakFrom, startClock])

  const pause = useCallback(() => {
    applyState({ isPlaying: false })
    stopClock()
    saveProgress(itemIdRef.current, currentProgressPercent())

    if (!synth) return
    synth.pause()

    // Chrome on Android frequently ignores pause(). Fall back to cancelling and
    // resuming from the tracked character offset on the next play().
    setTimeout(() => {
      if (isPlayingRef.current) return
      if (synth.speaking && !synth.paused) cancelSpeech()
    }, 200)
  }, [applyState, cancelSpeech, currentProgressPercent, saveProgress, stopClock])

  const togglePlay = useCallback(() => {
    if (isPlayingRef.current) pause()
    else play()
  }, [pause, play])

  const seek = useCallback((time: number) => {
    const chunks = chunksRef.current
    if (chunks.length === 0) return

    const duration = durationRef.current || 1
    const target = clamp(time, 0, duration)
    const index = clamp(Math.floor((target / duration) * chunks.length), 0, chunks.length - 1)

    charIndexRef.current = 0
    setTime(target)
    applyState({ currentChunkIndex: index })

    if (isPlayingRef.current) speakFrom(index, 0)
    else cancelSpeech()
  }, [applyState, cancelSpeech, setTime, speakFrom])

  const setSpeed = useCallback((speed: number) => {
    const safeSpeed = clamp(speed, MIN_SPEED, MAX_SPEED)
    applyState({ playbackSpeed: safeSpeed })
    try {
      localStorage.setItem(SPEED_KEY, String(safeSpeed))
    } catch {
      /* storage full or blocked - speed still applies for this session */
    }

    // Rate cannot change mid-utterance, so the chunk restarts. Debounced so dragging
    // the settings slider doesn't restart speech on every pointer move.
    if (speedRestartRef.current) clearTimeout(speedRestartRef.current)
    speedRestartRef.current = setTimeout(() => {
      if (isPlayingRef.current) speakFrom(indexRef.current, charIndexRef.current)
    }, 250)
  }, [applyState, speakFrom])

  const startPlayback = useCallback((
    content: ExtractedContent,
    speed: number,
    itemId?: string,
    url?: string,
  ) => {
    const chunks = prepareChunks(content)
    const duration = estimateDuration(chunks)
    const safeSpeed = clamp(speed, MIN_SPEED, MAX_SPEED)

    cancelSpeech()
    charIndexRef.current = 0

    applyState({
      content,
      url: url ?? null,
      itemId,
      nativeChunks: chunks,
      currentChunkIndex: 0,
      duration,
      playbackSpeed: safeSpeed,
      isPlaying: chunks.length > 0,
      isExtracting: false,
      error: chunks.length === 0 ? 'No readable text found in this content.' : null,
    })
    setTime(0)

    if (chunks.length > 0) speakFrom(0, 0)
  }, [applyState, cancelSpeech, setTime, speakFrom])

  const playContent = useCallback((
    content: ExtractedContent,
    speed?: number,
    itemId?: string,
    url?: string,
  ) => {
    startPlayback(content, speed ?? speedRef.current, itemId, url)
  }, [startPlayback])

  const processUrl = useCallback(async (url: string) => {
    cancelSpeech()
    stopClock()

    applyState({
      url,
      content: null,
      nativeChunks: [],
      currentChunkIndex: 0,
      duration: 0,
      isPlaying: false,
      isExtracting: true,
      error: null,
      itemId: undefined,
    })
    setTime(0)

    try {
      const { content } = await processUrlApi(url)
      startPlayback(content, speedRef.current, undefined, url)
      return content
    } catch (e) {
      const message = e instanceof Error ? e.message : String(e)
      applyState({ isExtracting: false, error: message })
      throw e
    }
  }, [applyState, cancelSpeech, setTime, startPlayback, stopClock])

  const reset = useCallback(() => {
    cancelSpeech()
    stopClock()
    charIndexRef.current = 0
    applyState({ ...initialState, playbackSpeed: speedRef.current })
    setTime(0)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
  }, [applyState, cancelSpeech, setTime, stopClock])

  // ============================================
  // Lifecycle
  // ============================================

  // Tear down speech + clock when the provider unmounts.
  useEffect(() => {
    return () => {
      cancelSpeech()
      stopClock()
      clearTimeout(speedRestartRef.current ?? undefined)
    }
  }, [cancelSpeech, stopClock])

  // Chrome/Android silently stop long-running speech. A periodic resume keeps the
  // engine alive; it is a no-op when nothing is speaking.
  useEffect(() => {
    if (!synth || !state.isPlaying) return
    const keepAlive = setInterval(() => {
      if (synth.speaking && !synth.paused) synth.resume()
    }, 10_000)
    return () => clearInterval(keepAlive)
  }, [state.isPlaying])

  // Persist a small, resumable snapshot. Chunks are derived on load, and oversized
  // articles are skipped so we never blow the localStorage quota mid-playback.
  useEffect(() => {
    if (!state.content || state.isExtracting) return

    const timer = setTimeout(() => {
      const snapshot: PersistedState = {
        url: state.url,
        content: state.content,
        currentChunkIndex: state.currentChunkIndex,
        itemId: state.itemId,
      }
      try {
        const serialized = JSON.stringify(snapshot)
        if (serialized.length > MAX_PERSISTED_CHARS) return
        localStorage.setItem(STORAGE_KEY, serialized)
      } catch {
        /* quota exceeded / private mode - resuming is a nicety, not a requirement */
      }
    }, 1000)

    return () => clearTimeout(timer)
  }, [state.url, state.content, state.currentChunkIndex, state.itemId, state.isExtracting])

  // Flush reading progress when the tab is backgrounded or closed.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState === 'hidden') {
        saveProgress(itemIdRef.current, currentProgressPercent())
      }
    }
    document.addEventListener('visibilitychange', flush)
    return () => document.removeEventListener('visibilitychange', flush)
  }, [currentProgressPercent, saveProgress])

  const getCurrentTime = useCallback(() => currentTimeRef.current, [])

  const value = useMemo<AudioContextType>(() => ({
    ...state,
    isSupported: !!synth,
    getCurrentTime,
    processUrl,
    playContent,
    play,
    pause,
    togglePlay,
    seek,
    setSpeed,
    reset,
  }), [state, getCurrentTime, processUrl, playContent, play, pause, togglePlay, seek, setSpeed, reset])

  return (
    <AudioContext.Provider value={value}>
      {/* `children` is a stable element, so 60fps time updates only re-render
          components that actually call useAudioTime(). */}
      <AudioTimeContext.Provider value={displayTime}>
        {children}
      </AudioTimeContext.Provider>
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) throw new Error('useAudio must be used within AudioProvider')
  return context
}

/** Subscribe to the 60fps playback position without re-rendering on every frame elsewhere. */
export function useAudioTime() {
  return useContext(AudioTimeContext)
}
