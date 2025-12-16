"use client"

import { useEffect, useRef } from 'react'

interface DitherProps {
  waveColor?: string
  backgroundColor?: string
  waveAmplitude?: number
  waveFrequency?: number
  waveSpeed?: number
  className?: string
}

export function Dither({
  waveColor = '#808080',
  backgroundColor = '#000000',
  waveAmplitude = 50,
  waveFrequency = 0.02,
  waveSpeed = 0.02,
  className,
}: DitherProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const animationRef = useRef<number>(0)
  const timeRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resizeCanvas = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }

    resizeCanvas()
    window.addEventListener('resize', resizeCanvas)

    // Dither pattern matrix (Bayer 8x8)
    const bayerMatrix = [
      [0, 32, 8, 40, 2, 34, 10, 42],
      [48, 16, 56, 24, 50, 18, 58, 26],
      [12, 44, 4, 36, 14, 46, 6, 38],
      [60, 28, 52, 20, 62, 30, 54, 22],
      [3, 35, 11, 43, 1, 33, 9, 41],
      [51, 19, 59, 27, 49, 17, 57, 25],
      [15, 47, 7, 39, 13, 45, 5, 37],
      [63, 31, 55, 23, 61, 29, 53, 21],
    ]

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

    const animate = () => {
      timeRef.current += waveSpeed

      const width = canvas.width
      const height = canvas.height

      // Create image data
      const imageData = ctx.createImageData(width, height)
      const data = imageData.data

      for (let y = 0; y < height; y++) {
        for (let x = 0; x < width; x++) {
          // Create wave pattern
          const wave1 = Math.sin(x * waveFrequency + timeRef.current) * waveAmplitude
          const wave2 = Math.sin(y * waveFrequency * 0.8 + timeRef.current * 0.7) * waveAmplitude * 0.6
          const wave3 = Math.sin((x + y) * waveFrequency * 0.5 + timeRef.current * 1.2) * waveAmplitude * 0.4

          // Calculate intensity based on waves
          const waveValue = (wave1 + wave2 + wave3) / (waveAmplitude * 2)
          const intensity = (waveValue + 1) / 2 // Normalize to 0-1

          // Get threshold from Bayer matrix
          const threshold = bayerMatrix[y % 8][x % 8] / 64

          // Determine if pixel should be foreground or background
          const isOn = intensity > threshold

          const i = (y * width + x) * 4
          if (isOn) {
            data[i] = fgColor.r
            data[i + 1] = fgColor.g
            data[i + 2] = fgColor.b
          } else {
            data[i] = bgColor.r
            data[i + 1] = bgColor.g
            data[i + 2] = bgColor.b
          }
          data[i + 3] = 255
        }
      }

      ctx.putImageData(imageData, 0, 0)
      animationRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resizeCanvas)
      cancelAnimationFrame(animationRef.current)
    }
  }, [waveColor, backgroundColor, waveAmplitude, waveFrequency, waveSpeed])

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
      }}
    />
  )
}

export default Dither
