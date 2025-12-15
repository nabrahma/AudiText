import { AnimatePresence, motion } from 'framer-motion';
import { type ReactNode, useEffect, useState } from 'react';

interface ShimmeringTextProps {
  children: ReactNode;
  /** Enable cycling through multiple children */
  cycling?: boolean;
  /** Array of text items to cycle through (only used if cycling=true) */
  cycleItems?: string[];
  /** Interval in ms between cycles (default: 2500) */
  cycleInterval?: number;
  /** Animation speed for shimmer (default: 3s) */
  shimmerDuration?: number;
  /** Gradient colors for shimmer [start, middle, end] */
  gradientColors?: [string, string, string];
  /** Additional className */
  className?: string;
  /** Font style */
  fontStyle?: 'normal' | 'italic';
  /** Font weight */
  fontWeight?: number;
  /** Font size */
  fontSize?: string;
  /** Letter spacing */
  letterSpacing?: string;
}

export default function ShimmeringText({
  children,
  cycling = false,
  cycleItems = [],
  cycleInterval = 2500,
  shimmerDuration = 3,
  gradientColors = ['rgba(255,255,255,0.4)', 'rgba(255,255,255,1)', 'rgba(255,255,255,0.4)'],
  className = '',
  fontStyle = 'italic',
  fontWeight = 400,
  fontSize = '20px',
  letterSpacing = '0.03em',
}: ShimmeringTextProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  useEffect(() => {
    if (!cycling || cycleItems.length === 0) return;
    
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % cycleItems.length);
    }, cycleInterval);
    
    return () => clearInterval(interval);
  }, [cycling, cycleItems.length, cycleInterval]);

  const shimmerStyle = {
    background: `linear-gradient(
      90deg, 
      ${gradientColors[0]} 0%, 
      ${gradientColors[1]} 50%, 
      ${gradientColors[2]} 100%
    )`,
    backgroundSize: '200% 100%',
    WebkitBackgroundClip: 'text',
    backgroundClip: 'text',
    WebkitTextFillColor: 'transparent',
    animation: `shimmer ${shimmerDuration}s ease-in-out infinite`,
    fontStyle,
    fontWeight,
    fontSize,
    letterSpacing,
  };

  if (cycling && cycleItems.length > 0) {
    return (
      <AnimatePresence mode="wait">
        <motion.span
          key={cycleItems[currentIndex]}
          className={`genos-font ${className}`}
          style={shimmerStyle}
          initial={{ y: 12, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -12, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
        >
          {cycleItems[currentIndex]}
        </motion.span>
      </AnimatePresence>
    );
  }

  return (
    <span className={`genos-font ${className}`} style={shimmerStyle}>
      {children}
    </span>
  );
}
