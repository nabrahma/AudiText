"use client"

import * as React from "react"
import {
    createContext,
    useCallback,
    useContext,
    useRef,
    type HTMLAttributes
} from "react"

// Simple className merger (replacement for cn from shadcn)
function cn(...classes: (string | undefined | null | false)[]) {
  return classes.filter(Boolean).join(' ')
}

function formatTimestamp(value: number) {
  if (!Number.isFinite(value) || value < 0) return "0:00"
  const totalSeconds = Math.floor(value)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${seconds.toString().padStart(2, "0")}`
}

interface ScrubBarContextValue {
  duration: number
  value: number
  progress: number
  onScrub?: (time: number) => void
  onScrubStart?: () => void
  onScrubEnd?: () => void
}

const ScrubBarContext = createContext<ScrubBarContextValue | null>(null)

function useScrubBarContext() {
  const context = useContext(ScrubBarContext)
  if (!context) {
    throw new Error("useScrubBarContext must be used within a ScrubBar.Root")
  }
  return context
}

interface ScrubBarContainerProps extends HTMLAttributes<HTMLDivElement> {
  duration: number
  value: number
  onScrub?: (time: number) => void
  onScrubStart?: () => void
  onScrubEnd?: () => void
}

function ScrubBarContainer({
  duration,
  value,
  onScrub,
  onScrubStart,
  onScrubEnd,
  children,
  className,
  ...props
}: ScrubBarContainerProps) {
  const progress = duration > 0 ? (value / duration) * 100 : 0

  const contextValue: ScrubBarContextValue = {
    duration,
    value,
    progress,
    onScrub,
    onScrubStart,
    onScrubEnd,
  }

  return (
    <ScrubBarContext.Provider value={contextValue}>
      <div
        data-slot="scrub-bar-root"
        className={cn("scrub-bar-container", className)}
        style={{
          display: 'flex',
          width: '100%',
          alignItems: 'center',
        }}
        {...props}
      >
        {children}
      </div>
    </ScrubBarContext.Provider>
  )
}
ScrubBarContainer.displayName = "ScrubBarContainer"

type ScrubBarTrackProps = HTMLAttributes<HTMLDivElement>

function ScrubBarTrack({ className, children, style, ...props }: ScrubBarTrackProps) {
  const trackRef = useRef<HTMLDivElement | null>(null)
  const { duration, onScrub, onScrubStart, onScrubEnd, value } =
    useScrubBarContext()

  const getTimeFromClientX = useCallback(
    (clientX: number) => {
      const track = trackRef.current
      if (!track || !duration) return null
      const rect = track.getBoundingClientRect()
      const ratio = (clientX - rect.left) / rect.width
      const clamped = Math.min(Math.max(ratio, 0), 1)
      return duration * clamped
    },
    [duration]
  )

  const handlePointerDown = useCallback(
    (event: React.PointerEvent<HTMLDivElement>) => {
      if (!duration) return
      event.preventDefault()
      onScrubStart?.()
      const time = getTimeFromClientX(event.clientX)
      if (time != null) {
        onScrub?.(time)
      }

      const handleMove = (moveEvent: PointerEvent) => {
        const nextTime = getTimeFromClientX(moveEvent.clientX)
        if (nextTime != null) {
          onScrub?.(nextTime)
        }
      }

      const handleUp = () => {
        onScrubEnd?.()
        window.removeEventListener("pointermove", handleMove)
        window.removeEventListener("pointerup", handleUp)
      }

      window.addEventListener("pointermove", handleMove)
      window.addEventListener("pointerup", handleUp, { once: true })
    },
    [duration, getTimeFromClientX, onScrub, onScrubEnd, onScrubStart]
  )

  const clampedValue = Math.min(Math.max(value, 0), duration || 0)

  return (
    <div
      ref={trackRef}
      data-slot="scrub-bar-track"
      className={cn("scrub-bar-track", className)}
      style={{
        position: 'relative',
        height: '8px',
        width: '100%',
        flexGrow: 1,
        cursor: 'pointer',
        touchAction: 'none',
        borderRadius: '9999px',
        userSelect: 'none',
        background: 'rgba(255,255,255,0.1)',
        ...style,
      }}
      onPointerDown={handlePointerDown}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={duration || 0}
      aria-valuenow={clampedValue}
      {...props}
    >
      {children}
    </div>
  )
}
ScrubBarTrack.displayName = "ScrubBarTrack"

interface ScrubBarProgressProps extends HTMLAttributes<HTMLDivElement> {
  progressColor?: string
}

function ScrubBarProgress({ className, style, progressColor = 'white', ...props }: ScrubBarProgressProps) {
  const { progress } = useScrubBarContext()

  return (
    <div
      data-slot="scrub-bar-progress"
      className={cn("scrub-bar-progress", className)}
      style={{
        position: 'absolute',
        height: '100%',
        borderRadius: '9999px',
        background: progressColor,
        width: `${progress}%`,
        transition: 'none',
        ...style,
      }}
      {...props}
    />
  )
}
ScrubBarProgress.displayName = "ScrubBarProgress"

type ScrubBarThumbProps = HTMLAttributes<HTMLDivElement>

function ScrubBarThumb({ className, children, style, ...props }: ScrubBarThumbProps) {
  const { progress } = useScrubBarContext()
  return (
    <div
      data-slot="scrub-bar-thumb"
      className={cn("scrub-bar-thumb", className)}
      style={{
        position: 'absolute',
        top: '50%',
        left: `${progress}%`,
        width: '16px',
        height: '16px',
        transform: 'translate(-50%, -50%)',
        borderRadius: '50%',
        background: 'white',
        boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
        transition: 'transform 0.1s ease',
        ...style,
      }}
      {...props}
    >
      {children}
    </div>
  )
}
ScrubBarThumb.displayName = "ScrubBarThumb"

interface ScrubBarTimeLabelProps extends HTMLAttributes<HTMLSpanElement> {
  time: number
  format?: (time: number) => string
}

function ScrubBarTimeLabel({
  className,
  time,
  format = formatTimestamp,
  style,
  ...props
}: ScrubBarTimeLabelProps) {
  return (
    <span
      data-slot="scrub-bar-time-label"
      className={cn("scrub-bar-time-label", className)}
      style={{
        fontVariantNumeric: 'tabular-nums',
        fontSize: '12px',
        color: 'rgba(255,255,255,0.5)',
        fontFamily: 'Genos, sans-serif',
        fontStyle: 'italic',
        ...style,
      }}
      {...props}
    >
      {format(time)}
    </span>
  )
}
ScrubBarTimeLabel.displayName = "ScrubBarTimeLabel"

export {
    ScrubBarContainer, ScrubBarProgress,
    ScrubBarThumb,
    ScrubBarTimeLabel, ScrubBarTrack
}

