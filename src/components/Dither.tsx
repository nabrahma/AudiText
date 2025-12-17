"use client"

import { useEffect, useRef } from 'react'

interface DitherProps {
  waveColor?: string
  backgroundColor?: string
  waveAmplitude?: number
  waveFrequency?: number
  waveSpeed?: number
  className?: string
  resolutionScale?: number // Lower = better performance, 0.25-0.5 recommended
}

/**
 * PERFORMANCE-OPTIMIZED DITHER COMPONENT
 * 
 * Optimizations:
 * 1. Resolution scaling - render at lower resolution, scale up with CSS
 * 2. Frame limiting - 20fps instead of 60fps
 * 3. Pre-calculated sin lookup table
 * 4. Typed arrays for faster pixel manipulation
 */
export function Dither({
  waveColor = '#808080',
  backgroundColor = '#000000',
  waveAmplitude = 50,
  waveFrequency = 0.02,
  waveSpeed = 0.02,
  resolutionScale = 0.25, // Render at 25% resolution for 16x speedup
  className,
}: DitherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)
  const lastFrameTimeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d', { alpha: false })
    if (!ctx) return

    // Get parent element for proper sizing within phone mockup
    const parent = canvas.parentElement

    // Target 20 FPS for smooth-enough animation with good performance
    const targetFPS = 20
    const frameInterval = 1000 / targetFPS

    const resizeCanvas = () => {
      // Use parent dimensions instead of window for proper containment
      const width = parent?.clientWidth || window.innerWidth
      const height = parent?.clientHeight || window.innerHeight
      canvas.width = Math.floor(width * resolutionScale)
      canvas.height = Math.floor(height * resolutionScale)
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Bayer 8x8 matrix flattened for faster lookup
    const bayerMatrix = new Uint8Array([
      0, 32, 8, 40, 2, 34, 10, 42,
      48, 16, 56, 24, 50, 18, 58, 26,
      12, 44, 4, 36, 14, 46, 6, 38,
      60, 28, 52, 20, 62, 30, 54, 22,
      3, 35, 11, 43, 1, 33, 9, 41,
      51, 19, 59, 27, 49, 17, 57, 25,
      15, 47, 7, 39, 13, 45, 5, 37,
      63, 31, 55, 23, 61, 29, 53, 21,
    ])

    // Pre-calculate sin lookup table (360 values)
    const SIN_TABLE_SIZE = 360
    const sinTable = new Float32Array(SIN_TABLE_SIZE)
    for (let i = 0; i < SIN_TABLE_SIZE; i++) {
      sinTable[i] = Math.sin((i / SIN_TABLE_SIZE) * Math.PI * 2)
    }

    const fastSin = (x: number) => {
      const normalized = ((x % (Math.PI * 2)) / (Math.PI * 2)) * SIN_TABLE_SIZE
      const index = Math.floor(normalized) % SIN_TABLE_SIZE
      return sinTable[index < 0 ? index + SIN_TABLE_SIZE : index]
    }

    const parseColor = (color: string) => {
      const hex = color.replace('#', '')
      return {
        r: parseInt(hex.substring(0, 2), 16),
        g: parseInt(hex.substring(2, 4), 16),
        b: parseInt(hex.substring(4, 6), 16),
      }
    }

    const bgColor = parseColor(backgroundColor)
    const fgColor = parseColor(waveColor)

    // Reuse ImageData buffer
    let imageData: ImageData | null = null
    let lastWidth = 0
    let lastHeight = 0

    const animate = (timestamp: number) => {
      // Frame limiting
      if (timestamp - lastFrameTimeRef.current < frameInterval) {
        animationRef.current = requestAnimationFrame(animate)
        return
      }
      lastFrameTimeRef.current = timestamp

      timeRef.current += waveSpeed

      const width = canvas.width
      const height = canvas.height

      // Reuse buffer if size hasn't changed
      if (!imageData || width !== lastWidth || height !== lastHeight) {
        imageData = ctx.createImageData(width, height)
        lastWidth = width
        lastHeight = height
      }

      const data = imageData.data
      const time = timeRef.current
      const freq = waveFrequency / resolutionScale // Adjust frequency for scale
      const amp = waveAmplitude

      // Optimized loop with typed array access
      let i = 0
      for (let y = 0; y < height; y++) {
        const yMod8 = y & 7 // Fast modulo 8
        const yWave = fastSin(y * freq * 0.8 + time * 0.7) * amp * 0.6
        
        for (let x = 0; x < width; x++) {
          // Wave calculations with fast sin lookup
          const wave1 = fastSin(x * freq + time) * amp
          const wave2 = yWave
          const wave3 = fastSin((x + y) * freq * 0.5 + time * 1.2) * amp * 0.4

          // Normalized intensity 0-1
          const intensity = ((wave1 + wave2 + wave3) / (amp * 2) + 1) * 0.5

          // Fast Bayer threshold lookup
          const threshold = bayerMatrix[(yMod8 << 3) | (x & 7)] / 64

          // Branchless color selection would be ideal but this is still fast
          if (intensity > threshold) {
            data[i] = fgColor.r
            data[i + 1] = fgColor.g
            data[i + 2] = fgColor.b
          } else {
            data[i] = bgColor.r
            data[i + 1] = bgColor.g
            data[i + 2] = bgColor.b
          }
          data[i + 3] = 255
          i += 4
        }
      }

      ctx.putImageData(imageData, 0, 0)
      animationRef.current = requestAnimationFrame(animate)
    }

    animationRef.current = requestAnimationFrame(animate)

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [waveColor, backgroundColor, waveAmplitude, waveFrequency, waveSpeed, resolutionScale])

  return (
    <canvas
      ref={canvasRef}
      className={className}
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        imageRendering: 'pixelated', // Keep crisp dither look when scaled
      }}
    />
  )
}

export default Dither
