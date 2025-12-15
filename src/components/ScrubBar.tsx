import { useCallback, useRef, useState } from 'react';

interface ScrubBarProps {
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (value: number) => void;
  formatValue?: (value: number) => string;
  primaryColor?: string;
  secondaryColor?: string;
}

export function ScrubBar({
  value,
  min,
  max,
  step = 0.01,
  onChange,
  formatValue = (v) => `${v.toFixed(2)}x`,
  primaryColor = '#FF6B35',
  secondaryColor = '#FF8C42',
}: ScrubBarProps) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  const getValueFromPosition = useCallback((clientX: number) => {
    if (!trackRef.current) return value;
    
    const rect = trackRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.max(0, Math.min(1, x / rect.width));
    const rawValue = min + percentage * (max - min);
    
    // Round to step
    const steppedValue = Math.round(rawValue / step) * step;
    return Math.max(min, Math.min(max, steppedValue));
  }, [min, max, step, value]);
  
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    setIsDragging(true);
    onChange(getValueFromPosition(e.clientX));
    
    const handleMouseMove = (e: MouseEvent) => {
      onChange(getValueFromPosition(e.clientX));
    };
    
    const handleMouseUp = () => {
      setIsDragging(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  };
  
  const handleTouchStart = (e: React.TouchEvent) => {
    setIsDragging(true);
    onChange(getValueFromPosition(e.touches[0].clientX));
    
    const handleTouchMove = (e: TouchEvent) => {
      onChange(getValueFromPosition(e.touches[0].clientX));
    };
    
    const handleTouchEnd = () => {
      setIsDragging(false);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
    
    document.addEventListener('touchmove', handleTouchMove);
    document.addEventListener('touchend', handleTouchEnd);
  };
  
  const percentage = ((value - min) / (max - min)) * 100;
  
  return (
    <div style={{ width: '100%' }}>
      {/* Track Container */}
      <div
        ref={trackRef}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
        style={{
          position: 'relative',
          height: '32px',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          touchAction: 'none',
        }}
      >
        {/* Track Background */}
        <div style={{
          position: 'absolute',
          left: 0,
          right: 0,
          height: '6px',
          background: 'rgba(255,255,255,0.1)',
          borderRadius: '3px',
        }} />
        
        {/* Active Track */}
        <div style={{
          position: 'absolute',
          left: 0,
          width: `${percentage}%`,
          height: '6px',
          background: `linear-gradient(90deg, ${primaryColor}, ${secondaryColor})`,
          borderRadius: '3px',
          transition: isDragging ? 'none' : 'width 0.1s ease',
        }} />
        
        {/* Thumb */}
        <div style={{
          position: 'absolute',
          left: `${percentage}%`,
          transform: 'translateX(-50%)',
          width: isDragging ? '24px' : '20px',
          height: isDragging ? '24px' : '20px',
          borderRadius: '50%',
          background: 'white',
          boxShadow: '0 2px 8px rgba(0,0,0,0.3)',
          transition: isDragging ? 'none' : 'all 0.1s ease',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
          {/* Inner dot */}
          <div style={{
            width: '8px',
            height: '8px',
            borderRadius: '50%',
            background: primaryColor,
          }} />
        </div>
      </div>
      
      {/* Value Display */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginTop: '8px',
      }}>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          {formatValue(min)}
        </span>
        <span style={{ 
          fontSize: '14px', 
          color: primaryColor, 
          fontWeight: 600,
          background: `${primaryColor}15`,
          padding: '4px 12px',
          borderRadius: '12px',
        }}>
          {formatValue(value)}
        </span>
        <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
          {formatValue(max)}
        </span>
      </div>
    </div>
  );
}
