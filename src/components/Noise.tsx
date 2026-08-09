import { memo, useEffect, useRef } from 'react';

interface NoiseProps {
  patternSize?: number;
  patternScaleX?: number;
  patternScaleY?: number;
  /** Grain redraws per second. The effect reads as film grain well below 60fps. */
  patternFps?: number;
  patternAlpha?: number;
}

/**
 * Animated film-grain overlay.
 *
 * Perf notes: the grain is regenerated at a low frame rate (the eye cannot tell),
 * the canvas is kept at a fixed low resolution and stretched by CSS instead of
 * matching device pixels, and the loop is fully torn down on unmount and paused
 * while the tab is hidden.
 */
const Noise = memo(function Noise({
  patternSize = 150,
  patternScaleX = 1,
  patternScaleY = 1,
  patternFps = 12,
  patternAlpha = 25,
}: NoiseProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;

    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    const patternCanvas = document.createElement('canvas');
    patternCanvas.width = patternSize;
    patternCanvas.height = patternSize;
    const patternCtx = patternCanvas.getContext('2d');
    if (!patternCtx) return;

    const imageData = patternCtx.createImageData(patternSize, patternSize);
    const data = imageData.data;

    let rafId = 0;
    let lastDraw = 0;
    const frameInterval = 1000 / Math.max(1, patternFps);

    const resize = () => {
      // Half-resolution buffer: the grain is stretched by CSS, so nobody can tell,
      // and we fill a quarter of the pixels each frame.
      canvas.width = Math.max(1, Math.ceil((window.innerWidth * patternScaleX) / 2));
      canvas.height = Math.max(1, Math.ceil((window.innerHeight * patternScaleY) / 2));
      lastDraw = 0; // Force a redraw at the new size
    };

    const createNoise = () => {
      for (let i = 0; i < data.length; i += 4) {
        const value = Math.random() * 255;
        data[i] = value;     // R
        data[i + 1] = value; // G
        data[i + 2] = value; // B
        data[i + 3] = patternAlpha; // A
      }
      patternCtx.putImageData(imageData, 0, 0);
    };

    const paint = () => {
      createNoise();
      const pattern = ctx.createPattern(patternCanvas, 'repeat');
      if (!pattern) return;
      ctx.fillStyle = pattern;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    };

    const draw = (timestamp: number) => {
      if (timestamp - lastDraw >= frameInterval) {
        lastDraw = timestamp;
        paint();
      }
      rafId = requestAnimationFrame(draw);
    };

    const start = () => {
      if (rafId) return;
      rafId = requestAnimationFrame(draw);
    };

    const stop = () => {
      if (!rafId) return;
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const onVisibilityChange = () => {
      if (document.visibilityState === 'hidden') stop();
      else start();
    };

    window.addEventListener('resize', resize);
    resize();

    if (prefersReducedMotion) {
      paint(); // Static grain, no animation loop at all
    } else {
      document.addEventListener('visibilitychange', onVisibilityChange);
      start();
    }

    return () => {
      stop();
      window.removeEventListener('resize', resize);
      document.removeEventListener('visibilitychange', onVisibilityChange);
    };
  }, [patternSize, patternScaleX, patternScaleY, patternFps, patternAlpha]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
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
});

export default Noise;
