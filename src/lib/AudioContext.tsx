// Audio Player Context
// Manages global audio state using Browser Native TTS (SpeechSynthesis)
// Features: Chunking for Seek/Speed support, Auto-cleaning of text

import type { ReactNode } from 'react'
import { createContext, useContext, useEffect, useRef, useState } from 'react'
import type { ExtractedContent } from './api'
import { processUrl as processUrlApi } from './api'

interface AudioState {
  // Content
  url: string | null
  content: ExtractedContent | null
  
  // Audio State
  isPlaying: boolean
  currentTime: number
  duration: number
  playbackSpeed: number
  
  // Native Chunking State
  nativeChunks: string[]
  currentChunkIndex: number
  
  // Loading states
  isExtracting: boolean
  error: string | null
}

interface AudioContextType extends AudioState {
  processUrl: (url: string) => Promise<ExtractedContent | void>
  playContent: (content: ExtractedContent) => void
  play: () => void
  pause: () => void
  togglePlay: () => void
  seek: (time: number) => void
  setSpeed: (speed: number) => void
  reset: () => void
}

const initialState: AudioState = {
  url: null,
  content: null,
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  playbackSpeed: Number(localStorage.getItem('audiotext_playback_speed')) || 1, // Read from storage
  nativeChunks: [],
  currentChunkIndex: 0,
  isExtracting: false,
  error: null,
}

const STORAGE_KEY = 'audiotext_player_state'

const loadStateFromStorage = (): AudioState => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored) {
      const parsed = JSON.parse(stored)
      // Restore playback speed separately as it has its own key/logic
      const speed = Number(localStorage.getItem('audiotext_playback_speed')) || 1
      return { 
        ...initialState, 
        ...parsed, 
        isPlaying: false, // Always start paused
        playbackSpeed: speed 
      }
    }
  } catch (e) {
    console.warn('Failed to load audio state', e)
  }
  return initialState
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioState>(loadStateFromStorage)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const nativeTimerRef = useRef<number | null>(null)
  const isManualCancel = useRef(false)
  
  // Persist state changes
  useEffect(() => {
    const saveState = setTimeout(() => {
      // Don't save if empty or extracting
      if (!state.content || state.isExtracting) return
      
      const { isPlaying, isExtracting, error, ...stateToSave } = state
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave))
    }, 1000) // Debounce 1s
    
    return () => clearTimeout(saveState)
  }, [state])
  
  // Timer to simulate progress updates for native TTS
  const startNativeTimer = () => {
    if (nativeTimerRef.current) clearInterval(nativeTimerRef.current)
    nativeTimerRef.current = window.setInterval(() => {
      setState(prev => {
        if (!prev.isPlaying) return prev
        const newTime = prev.currentTime + (0.1 * prev.playbackSpeed)
        return { ...prev, currentTime: Math.min(newTime, prev.duration) }
      })
    }, 100)
  }
  
  // Clean text and split into chunks
  const prepareChunks = (content: ExtractedContent): string[] => {
    let text = content.content
    let title = content.title || ''
    let author = content.author || 'Unknown'

    // 1. Remove Metadata Fluff and Leading Hashtags
    // Regex cleanup mainly for non-AI cleaned, but hashtags might persist even in AI cleaned.
    text = text
      .replace(/^#[A-Za-z0-9_]+\s+/gm, '') // Remove starting hashtags
      .replace(/(published|posted) on .+/gi, '')
      .replace(/^\d{1,2} [a-z]+ \d{4}/gi, '') 
      .replace(/!\[.*?\]\(.*?\)/g, '') 
      .replace(/\[(.*?)\]\(.*?\)/g, '$1') 
      .replace(/https?:\/\/\S+/g, '') 
      .replace(/```[\s\S]*?```/g, '') 
      .replace(/[#*_>~`]/g, '') // Remove remaining markdown symbols
      .replace(/^\s*[-+*]\s+/gm, '')
      .replace(/share on .+/gi, '')
      .trim()

    // 2. Infer Author if Unknown
    if (author === 'Unknown') {
        const byMatch = text.match(/^(?:written |authored )?by\s+([A-Za-z ]+)/im)
        if (byMatch && byMatch[1].length < 30) {
            author = byMatch[1].trim()
            // Remove the "By X" line to avoid repetition
            text = text.replace(byMatch[0], '') 
        }
    }

    // 3. Remove Title/Author from body if they repeat exactly at the start
    if (text.toLowerCase().startsWith(title.toLowerCase())) {
        text = text.substring(title.length).trim()
    }
    const authorPattern = new RegExp(`^by ${author}`, 'i')
    if (authorPattern.test(text)) {
        text = text.replace(authorPattern, '').trim()
    }
    
    // 4. Construct Smart Intro
    // Only verify if we need to add it.
    const intro = `${title}.` + (author !== 'Unknown' ? ` By ${author}.` : '')
    
    // If text doesn't start with the intro (roughly), prepend it.
    if (!text.startsWith(title)) {
        text = `${intro}\n\n${text}`
    }

    // 5. Clean up multiple newlines/spaces
    text = text.replace(/\n{3,}/g, '\n\n').trim()

    // 6. Split into sentences (approximate) including newlines as chunk breaks
    return text.match(/[^.!?\n]+[.!?\n]*/g) || [text]
  }

  // Cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      if (nativeTimerRef.current) clearInterval(nativeTimerRef.current)
    }
  }, [])

  // Chrome/Android TTS Timeout Fix: Periodically resume to keep engine alive
  useEffect(() => {
    if (!state.isPlaying) return

    const resumeInterval = setInterval(() => {
      // Only resume if we are supposed to be playing but it's technically "paused" 
      // or just to keep the process active.
      if (window.speechSynthesis.speaking || window.speechSynthesis.paused) {
        window.speechSynthesis.resume()
      }
    }, 10000) // 10 seconds

    return () => clearInterval(resumeInterval)
  }, [state.isPlaying])

  const processUrl = async (url: string) => {
    window.speechSynthesis.cancel()
    if (nativeTimerRef.current) clearInterval(nativeTimerRef.current)
    
    setState(prev => ({ 
      ...initialState, 
      url, 
      isExtracting: true,
      playbackSpeed: prev.playbackSpeed // keep user preference
    }))

    try {
      const { content } = await processUrlApi(url)
      setState(prev => ({ ...prev, content, isExtracting: false }))

      // Start Native TTS
      const chunks = prepareChunks(content)
      // Duration estimate: ~3 words/sec seems reasonable
      const totalDuration = chunks.reduce((acc, chunk) => acc + (chunk.split(' ').length / 3), 0)

      setState(prev => ({ 
        ...prev, 
        nativeChunks: chunks,
        currentChunkIndex: 0,
        duration: totalDuration || 60, 
        isPlaying: true
      }))
      
      speakChunk(chunks, 0, state.playbackSpeed)
      
      return content // Return content for immediate usage (e.g. saving to library)

    } catch (e) {
      setState(p => ({ ...p, isExtracting: false, error: String(e) }))
      throw e // Re-throw to let caller handle/show error
    }
  }

  const playContent = (content: ExtractedContent) => {
    window.speechSynthesis.cancel()
    if (nativeTimerRef.current) clearInterval(nativeTimerRef.current)

    // Reset state but keep speed
    setState(prev => ({
      ...initialState,
      content: content,
      playbackSpeed: prev.playbackSpeed,
      isExtracting: false,
    }))

    // Prepare chunks
    const chunks = prepareChunks(content)
    const totalDuration = chunks.reduce((acc, chunk) => acc + (chunk.split(' ').length / 3), 0)

    // Update state and play
    setState(prev => ({
      ...prev,
      nativeChunks: chunks,
      currentChunkIndex: 0,
      duration: totalDuration || 60,
      isPlaying: true
    }))

    // Start speaking immediately
    speakChunk(chunks, 0, state.playbackSpeed)
  }

  const speakChunk = (chunks: string[], index: number, speed: number) => {
    if (index >= chunks.length) {
      setState(p => ({ ...p, isPlaying: false, currentChunkIndex: 0, currentTime: 0 }))
      return
    }

    isManualCancel.current = true
    window.speechSynthesis.cancel()
    
    // Safety timeout to reset flag in case onend doesn't fire (browser quirk)
    setTimeout(() => { isManualCancel.current = false }, 50)

    const u = new SpeechSynthesisUtterance(chunks[index])
    u.rate = speed
    u.onend = () => {
      if (isManualCancel.current) return
      playNext()
    }
    
    utteranceRef.current = u
    window.speechSynthesis.speak(u)
    
    // Set start time for this chunk using FUNCTIONAL UPDATE to ensure fresh state
    setState(p => {
      const progress = (index / chunks.length) * p.duration
      return { ...p, currentChunkIndex: index, currentTime: progress }
    })
    
    startNativeTimer()
  }

  const playNext = () => {
    setState(prev => {
      if (!prev.isPlaying) return prev
      const nextIdx = prev.currentChunkIndex + 1
      if (nextIdx < prev.nativeChunks.length) {
        // We use a timeout to prevent stack overflow/recursion issues
        setTimeout(() => speakChunk(prev.nativeChunks, nextIdx, prev.playbackSpeed), 0)
        return { ...prev, currentChunkIndex: nextIdx }
      } else {
        if (nativeTimerRef.current) clearInterval(nativeTimerRef.current)
        return { ...prev, isPlaying: false, currentChunkIndex: 0, currentTime: 0 }
      }
    })
  }

  const play = () => {
    setState(p => ({ ...p, isPlaying: true }))
    // Resume or Restart current chunk
    if (window.speechSynthesis.paused) {
      window.speechSynthesis.resume()
    } else {
      speakChunk(state.nativeChunks, state.currentChunkIndex, state.playbackSpeed)
    }
  }

  const pause = () => {
    setState(p => ({ ...p, isPlaying: false }))
    if (nativeTimerRef.current) clearInterval(nativeTimerRef.current)
    window.speechSynthesis.pause() 
  }

  const togglePlay = () => state.isPlaying ? pause() : play()

  const seek = (time: number) => {
    // Calculate chunk index from time
    const ratio = time / state.duration
    const targetIdx = Math.floor(ratio * state.nativeChunks.length)
    const safeIdx = Math.max(0, Math.min(targetIdx, state.nativeChunks.length - 1))
    
    setState(p => ({ ...p, currentTime: time, currentChunkIndex: safeIdx, isPlaying: true }))
    speakChunk(state.nativeChunks, safeIdx, state.playbackSpeed)
  }

  const setSpeed = (speed: number) => {
    setState(p => ({ ...p, playbackSpeed: speed }))
    // Restart current chunk with new speed
    if (state.isPlaying) {
      speakChunk(state.nativeChunks, state.currentChunkIndex, speed)
    }
  }

  const reset = () => {
    pause()
    setState(initialState)
  }

  return (
    <AudioContext.Provider value={{ ...state, processUrl, playContent, play, pause, togglePlay, seek, setSpeed, reset }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) throw new Error('useAudio must be used within AudioProvider')
  return context
}
