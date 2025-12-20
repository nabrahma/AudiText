import { Loader2 } from 'lucide-react';
import React, { useState } from 'react';

interface PullToRefreshProps {
  children: React.ReactNode;
  /** 
   * Ref to the scrollable element within the children. 
   * If provided, pull-to-refresh will only trigger when this element is at scrollTop 0.
   * If not provided, it assumes the content is always at the top (non-scrollable).
   */
  scrollableRef?: React.RefObject<HTMLElement>;
  onRefresh?: () => void;
  className?: string;
  style?: React.CSSProperties;
}

export function PullToRefresh({ children, scrollableRef, onRefresh, className, style }: PullToRefreshProps) {
  const [pullStartY, setPullStartY] = useState(0);
  const [pullMoveY, setPullMoveY] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = () => {
     if (onRefresh) {
        onRefresh();
     } else {
        window.location.reload();
     }
  };

  return (
    <div
      className={className}
      onTouchStart={(e) => {
        // Only enable pull if list is at top or doesn't exist
        const scrollTop = scrollableRef?.current?.scrollTop ?? 0;
        if (scrollTop <= 0) {
          setPullStartY(e.touches[0].clientY);
        }
      }}
      onTouchMove={(e) => {
        const scrollTop = scrollableRef?.current?.scrollTop ?? 0;
        if (pullStartY > 0 && scrollTop <= 0) {
          const touchY = e.touches[0].clientY;
          const diff = touchY - pullStartY;
          // Only allow pulling down
          if (diff > 0) {
            setPullMoveY(diff);
          }
        }
      }}
      onTouchEnd={() => {
        if (pullMoveY > 120) { 
          setIsRefreshing(true);
          handleRefresh();
        }
        setPullStartY(0);
        setPullMoveY(0);
      }}
      style={{
        ...style,
        transform: pullMoveY > 0 ? `translateY(${Math.min(pullMoveY * 0.4, 120)}px)` : 'none',
        transition: pullMoveY === 0 ? 'transform 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)' : 'none', // Smooth snap back
      }}
    >
      {/* Pull Indicator (Background) */}
      {pullMoveY > 0 && (
        <div style={{
          position: 'absolute',
          top: -60, // Start just above
          left: 0,
          right: 0,
          height: '60px',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'flex-end',
          paddingBottom: '10px',
          pointerEvents: 'none',
        }}>
           <div style={{
            background: 'rgba(255,255,255,0.2)',
            borderRadius: '50%',
            padding: '8px',
            transform: `rotate(${pullMoveY * 2}deg)`,
            opacity: Math.min(pullMoveY / 100, 1)
          }}>
            <Loader2 size={24} style={{ color: 'white' }} />
          </div>
        </div>
      )}

      {/* Loading Overlay (Foreground) */}
      {isRefreshing && (
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 100,
          backdropFilter: 'blur(4px)',
          borderRadius: 'inherit',
        }}>
          <Loader2 className="animate-spin" size={32} color="white" />
        </div>
      )}
      
      {children}
    </div>
  );
}
