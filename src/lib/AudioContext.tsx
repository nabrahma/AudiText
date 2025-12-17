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
  processUrl: (url: string) => Promise<void>
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
  playbackSpeed: 1,
  nativeChunks: [],
  currentChunkIndex: 0,
  isExtracting: false,
  error: null,
}

const AudioContext = createContext<AudioContextType | null>(null)

export function AudioProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AudioState>(initialState)
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null)
  const nativeTimerRef = useRef<number | null>(null)
  const isManualCancel = useRef(false)
  
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
    
    // 1. Remove Metadata Fluff (Skip if AI Cleaned)
    if (!content.ai_cleaned) {
       text = text
        .replace(/(published|posted) on .+/gi, '')
        .replace(/^\d{1,2} [a-z]+ \d{4}/gi, '') 
        .replace(/!\[.*?\]\(.*?\)/g, '') 
        .replace(/\[(.*?)\]\(.*?\)/g, '$1') 
        .replace(/https?:\/\/\S+/g, '') 
        .replace(/```[\s\S]*?```/g, '') 
        .replace(/[#*_>~`]/g, '')
        .replace(/^\s*[-+*]\s+/gm, '')
        .replace(/share on .+/gi, '')
    }

    // 2. Add structured intro (if not present)
    if (!/^Author:/.test(text)) {
        const intro = `Author: ${content.author || 'Unknown'}. Title: ${content.title}.`
        text = `${intro}\n\n${text}`
    }

    // 3. Split into sentences (approximate)
    return text.match(/[^.!?\n]+[.!?\n]*/g) || [text]
  }

  // Cleanup
  useEffect(() => {
    return () => {
      window.speechSynthesis.cancel()
      if (nativeTimerRef.current) clearInterval(nativeTimerRef.current)
    }
  }, [])

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

    } catch (e) {
      setState(p => ({ ...p, isExtracting: false, error: String(e) }))
    }
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
    
    // Set start time for this chunk
    const progress = (index / chunks.length) * state.duration
    setState(p => ({ ...p, currentChunkIndex: index, currentTime: progress }))
    
    utteranceRef.current = u
    window.speechSynthesis.speak(u)
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
    <AudioContext.Provider value={{ ...state, processUrl, play, pause, togglePlay, seek, setSpeed, reset }}>
      {children}
    </AudioContext.Provider>
  )
}

export function useAudio() {
  const context = useContext(AudioContext)
  if (!context) throw new Error('useAudio must be used within AudioProvider')
  return context
}
