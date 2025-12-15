import { useEffect, useRef } from 'react';

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  patternRefreshInterval?: number;
  patternAlpha?: number;
}

export default function Noise({
  patternSize = 150,
  patternScaleX = 1,
  patternScaleY = 1,
  patternRefreshInterval = 2,
  patternAlpha = 25,
}: NoiseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const frameRef = useRef(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    const patternCtx = patternCanvas.getContext('2d');
    if (!patternCtx) return;

    const resize = () => {
      canvas.width = window.innerWidth * patternScaleX;
      canvas.height = window.innerHeight * patternScaleY;
    };

    const createNoise = () => {
      const imageData = patternCtx.createImageData(patternSize, patternSize);
      const data = imageData.data;

      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = patternAlpha; // A
      }

      patternCtx.putImageData(imageData, 0, 0);
    };

    const draw = () => {
      frameRef.current++;
      
      if (frameRef.current % patternRefreshInterval === 0) {
        createNoise();
      }

      const pattern = ctx.createPattern(patternCanvas, 'repeat');
      if (pattern) {
        ctx.fillStyle = pattern;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
      }

      requestAnimationFrame(draw);
    };

    window.addEventListener('resize', resize);
    resize();
    draw();

    return () => {
      window.removeEventListener('resize', resize);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternRefreshInterval, patternAlpha]);

  return (
    <canvas
      ref={canvasRef}
      style={{
        position: 'absolute',
        inset: 0,
        width: '100%',
        height: '100%',
        pointerEvents: 'none',
        opacity: 0.05,
        mixBlendMode: 'overlay',
      }}
    />
  );
}
