import DarkVeil from '@/components/DarkVeil';
import { Dither } from '@/components/Dither';
import DotGrid from '@/components/DotGrid';
import { BookOpenTextIcon } from '@/components/icons/BookOpenTextIcon';
import { HouseIcon } from '@/components/icons/HouseIcon';
import { SettingsIcon } from '@/components/icons/SettingsIcon';
import Noise from '@/components/Noise';
import { Orb } from '@/components/Orb';
import { ScrubBar } from '@/components/ScrubBar';
import ShimmeringText from '@/components/ShimmeringText';
import { ScrubBarContainer, ScrubBarProgress, ScrubBarThumb, ScrubBarTimeLabel, ScrubBarTrack } from '@/components/ui/scrub-bar';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight, Mic, Pause, Play, Share2, SkipBack, SkipForward, Sparkles } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import './index.css';

// ==================== WARM PALETTES ====================
const PALETTES = {
  ember: {
    colors: ['#FF6B35', '#FF8C42', '#FFD166', '#000000'],
    primary: '#FF6B35',
    secondary: '#FF8C42',
    tertiary: '#FFD166',
    glow: 'rgba(255, 107, 53, 0.6)',
  },
  sunset: {
    colors: ['#E63946', '#FF6B6B', '#FFA07A', '#000000'],
    primary: '#E63946',
    secondary: '#FF6B6B',
    tertiary: '#FFA07A',
    glow: 'rgba(230, 57, 70, 0.6)',
  },
  aurora: {
    colors: ['#00E5A0', '#00C9A7', '#4DFFD2', '#000000'],
    primary: '#00E5A0',
    secondary: '#00C9A7',
    tertiary: '#4DFFD2',
    glow: 'rgba(0, 229, 160, 0.6)',
  },
  violet: {
    colors: ['#A855F7', '#C084FC', '#E9D5FF', '#000000'],
    primary: '#A855F7',
    secondary: '#C084FC',
    tertiary: '#E9D5FF',
    glow: 'rgba(168, 85, 247, 0.6)',
  },
  gold: {
    colors: ['#F59E0B', '#FBBF24', '#FDE68A', '#000000'],
    primary: '#F59E0B',
    secondary: '#FBBF24',
    tertiary: '#FDE68A',
    glow: 'rgba(245, 158, 11, 0.6)',
  },
};
type PaletteKey = keyof typeof PALETTES;
const PALETTE_KEYS: PaletteKey[] = ['ember', 'sunset', 'aurora', 'violet', 'gold'];

// Hue shift values for DarkVeil background per palette
const PALETTE_HUE_SHIFTS: Record<PaletteKey, number> = {
  ember: 0,      // Orange/red - base color
  sunset: 30,    // Red/pink shift
  aurora: 120,   // Green shift
  violet: 270,   // Purple shift
  gold: 45,      // Yellow/gold shift
};

// ==================== ROTATING WORD CAROUSEL ====================
const ROTATING_WORDS = ['Tweets', 'Articles', 'Blogs', 'News', 'Threads', 'Posts'];

function RotatingWord() {
  return (
    <div 
      className="shine-pill"
      style={{ 
        height: '42px',
        padding: '0 20px',
        borderRadius: '100px',
        border: '1.5px solid rgba(255,255,255,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'transparent',
        minWidth: '120px',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <ShimmeringText 
        cycling={true}
        cycleItems={ROTATING_WORDS}
        cycleInterval={2500}
      >
        {ROTATING_WORDS[0]}
      </ShimmeringText>
    </div>
  );
}

// ==================== GEMINI ORB ====================
function GeminiOrb({ amplitude = 0, size = 200, palette = 'ember' }: { amplitude?: number; size?: number; palette?: PaletteKey }) {
  const colors = PALETTES[palette];
  const baseSize = size * 0.2;
  const pulseScale = 1 + amplitude * 0.3;
  
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div style={{
        position: 'absolute', inset: -30, borderRadius: '50%',
        background: `radial-gradient(ellipse, ${colors.glow} 0%, transparent 70%)`,
        opacity: 0.4 + amplitude * 0.4, transition: 'opacity 0.3s',
      }} />
      <svg style={{ position: 'absolute', width: 0, height: 0 }}>
        <defs><filter id="goo"><feGaussianBlur in="SourceGraphic" stdDeviation="12" result="blur" /><feColorMatrix in="blur" type="matrix" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 20 -8" /></filter></defs>
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', filter: 'url(#goo)' }}>
        <motion.div style={{ position: 'absolute', borderRadius: '50%', width: baseSize, height: baseSize, background: colors.secondary }} animate={{ x: [-35, 35, -35], y: [-20, 25, -20] }} transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }} />
        <motion.div style={{ position: 'absolute', borderRadius: '50%', width: baseSize * 0.85, height: baseSize * 0.85, background: colors.primary }} animate={{ x: [30, -30, 30], y: [20, -20, 20] }} transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }} />
        <div style={{ position: 'absolute', borderRadius: '50%', width: baseSize * 0.7, height: baseSize * 0.7, background: '#FFF', transform: `scale(${pulseScale})`, transition: 'transform 0.15s' }} />
      </div>
    </div>
  );
}

// ==================== NAVIGATION ====================
function Navigation({ palette = 'ember' }: { palette?: PaletteKey }) {
  const location = useLocation();
  const navigate = useNavigate();
  const colors = PALETTES[palette];
  const navItems = [
    { Icon: HouseIcon, path: '/', label: 'Home' },
    { Icon: BookOpenTextIcon, path: '/library', label: 'Library' },
    { Icon: SettingsIcon, path: '/settings', label: 'Settings' },
  ];
  
  if (location.pathname === '/player') return null;
  
  return (
    <div style={{
      position: 'fixed',
      bottom: '48px',
      left: '24px',
      right: '24px',
      maxWidth: '390px',
      margin: '0 auto',
      display: 'flex',
      justifyContent: 'center',
      zIndex: 1000,
    }}>
      <motion.nav 
        className="chrome-pill nav-noise"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.3, type: 'spring', stiffness: 300, damping: 30 }}
        style={{
          background: '#1A1A1C',
          backdropFilter: 'blur(24px)',
          border: '1.5px solid rgba(255, 255, 255, 0.25)',
          borderRadius: '40px',
          padding: '4px 8px',
          display: 'flex', 
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0px',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          overflow: 'hidden',
        }}
      >
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          const Icon = item.Icon;
          return (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                gap: '3px',
                padding: '8px 16px', 
                background: 'none', 
                border: 'none', 
                cursor: 'pointer',
                minWidth: '56px',
                transition: 'all 0.3s ease',
              }}
            >
              <div style={{
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.4)',
                transition: 'color 0.3s ease',
              }}>
                <Icon size={18} isAnimated={isActive} />
              </div>
              <span style={{ 
                fontSize: '10px', 
                fontWeight: isActive ? 600 : 500, 
                color: isActive ? '#FFFFFF' : 'rgba(255,255,255,0.5)', 
                fontFamily: 'Funnel Display, sans-serif',
                letterSpacing: '0.02em',
                transition: 'color 0.3s ease',
              }}>
                {item.label}
              </span>
            </button>
          );
        })}
      </motion.nav>
    </div>
  );
}



// ==================== HOME PAGE ====================
function HomePage({ palette, onVisit }: { palette: PaletteKey; onVisit: () => void }) {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const hasCalledOnVisit = useRef(false);
  
  useEffect(() => {
    if (!hasCalledOnVisit.current) {
      hasCalledOnVisit.current = true;
      onVisit();
    }
  }, [onVisit]);
  
  const handleListen = () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setTimeout(() => { setIsLoading(false); navigate('/player'); }, 1000);
  };
  
  return (
    <div
      style={{ minHeight: '100vh', position: 'relative', background: '#000' }}
    >
      {/* DarkVeil Background - Fullscreen */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        transform: 'rotate(180deg)',
      }}>
        <DarkVeil 
          hueShift={PALETTE_HUE_SHIFTS[palette]}
          speed={0.6}
          noiseIntensity={0.15}
          warpAmount={0.5}
        />
      </div>
      
      {/* Noise Overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Noise patternAlpha={15} patternSize={100} />
      </div>
      
      {/* Gradient fade to black at top */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '50vh',
        background: 'linear-gradient(to bottom, #000 0%, transparent 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />
      
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        maxWidth: '390px', 
        margin: '0 auto', 
        padding: '0 24px', 
        minHeight: '100vh', 
        display: 'flex', 
        flexDirection: 'column' 
      }}>
        
        {/* Version - Moved up, Genos font, Italic */}
        <div style={{ paddingTop: '24px', textAlign: 'center' }}>
          <span className="genos-font" style={{ 
            fontSize: '13px', 
            color: 'rgba(255,255,255,0.4)', 
            fontWeight: 400,
            fontStyle: 'italic',
            letterSpacing: '0.05em',
          }}>
            v1.0
          </span>
        </div>
        
        {/* Centered Hero Content Wrapper */}
        <div style={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column', 
          justifyContent: 'center', 
          paddingBottom: '25vh', /* Visual center adjustment */
        }}>
          
          {/* Logo Section */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px', 
              marginBottom: '32px' 
            }}
          >
            <motion.div 
              style={{ 
                width: '28px', 
                height: '28px', 
                borderRadius: '50%', 
                background: '#4ADE80',
              }}
              animate={{ 
                boxShadow: ['0 0 8px rgba(74, 222, 128, 0.3)', '0 0 16px rgba(74, 222, 128, 0.5)', '0 0 8px rgba(74, 222, 128, 0.3)']
              }}
              transition={{ duration: 2, repeat: Infinity }}
            />
            <span style={{ 
              fontSize: '18px', 
              fontWeight: 600, 
              letterSpacing: '-0.02em',
              fontFamily: 'Funnel Display, sans-serif',
            }}>
              AudiText
            </span>
          </motion.div>
          
          {/* Hero Typography */}
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            {/* Line 1: Listen to [Audio] of - NO WRAP */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              flexWrap: 'nowrap', /* Force single line */
              gap: '12px',
              lineHeight: 1.1,
              marginBottom: '8px',
            }}>
              <span style={{ 
                fontSize: '48px', 
                fontWeight: 800, 
                letterSpacing: '-0.04em',
                fontFamily: 'Funnel Display, sans-serif',
                whiteSpace: 'nowrap',
              }}>
                Listen to
              </span>
              <div 
                className="shine-pill"
                style={{ 
                  height: '42px',
                  padding: '0 20px',
                  borderRadius: '100px',
                  border: '1.5px solid rgba(255,255,255,0.25)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'transparent',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                <ShimmeringText>
                  Audio
                </ShimmeringText>
              </div>
              <span style={{ 
                fontSize: '48px', 
                fontWeight: 800, 
                letterSpacing: '-0.04em',
                fontFamily: 'Funnel Display, sans-serif',
              }}>
                of
              </span>
            </div>
            
            {/* Line 2: [Rotating Word] with dot */}
            <div style={{ 
              display: 'flex', 
              alignItems: 'flex-end', /* Align dot to bottom */
              gap: '16px', 
            }}>
              <RotatingWord />
              <div style={{ 
                width: '8px', 
                height: '8px', 
                borderRadius: '50%', 
                background: 'rgba(255,255,255,0.9)',
                marginBottom: '8px',
              }} />
            </div>
          </motion.div>
          
          {/* Subtitle - Funnel Display Light (300) 19.2px */}
          <motion.p 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            style={{ 
              marginTop: '32px', 
              fontSize: '19.2px', /* Exact requested size */
              fontWeight: 300, /* Light */
              color: 'rgba(255,255,255,0.5)',
              lineHeight: 1.5,
              fontStyle: 'normal',
              fontFamily: 'Funnel Display, sans-serif',
            }}
          >
            From your favorite X account<br />and Websites.
          </motion.p>
        </div>
        
        {/* Input Section - Moved upwards */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ 
            position: 'absolute',
            bottom: '180px', /* Increased from 140px for breathing space */
            left: '24px',
            right: '24px',
            display: 'flex', 
            flexDirection: 'column', 
            gap: '16px',
            maxWidth: '390px',
            margin: '0 auto',
          }}
        >
          <input
            type="url"
            placeholder="Paste Your Link Here"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleListen()}
            style={{
              width: '100%',
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '50px',
              padding: '18px 24px',
              fontSize: '15px',
              color: 'white',
              outline: 'none',
              fontFamily: 'Funnel Display, sans-serif',
              textAlign: 'center',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.3)'}
            onBlur={(e) => e.target.style.borderColor = 'rgba(255,255,255,0.15)'}
          />
          
          <button
            onClick={handleListen}
            disabled={!url.trim() || isLoading}
            style={{
              width: '100%',
              padding: '18px',
              background: '#FAFAFA',
              color: '#0A0A0B',
              border: 'none',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: url.trim() ? 'pointer' : 'not-allowed',
              fontFamily: 'Funnel Display, sans-serif',
              opacity: url.trim() ? 1 : 0.7,
              transition: 'opacity 0.2s, transform 0.15s',
              boxShadow: url.trim() ? '0 0 20px rgba(255,255,255,0.15)' : 'none',
            }}
          >
            Start Listening
          </button>
        </motion.div>
      </div>
    </div>
  );
}

// ==================== PLAYER PAGE ====================
function PlayerPage({ palette }: { palette: PaletteKey }) {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(45); // Start at 45 seconds for demo
  const [playbackSpeed, setPlaybackSpeed] = useState(1); // 1x, 1.25x, 1.5x, 2x
  const totalDuration = 180;
  const colors = PALETTES[palette];
  
  // Speed cycle: 1 -> 1.25 -> 1.5 -> 2 -> 1
  const cycleSpeed = () => {
    setPlaybackSpeed(prev => {
      if (prev === 1) return 1.25;
      if (prev === 1.25) return 1.5;
      if (prev === 1.5) return 2;
      return 1;
    });
  };
  
  // Audio amplitude simulation for the orb
  const [amplitude, setAmplitude] = useState(0);
  
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => {
          if (prev >= totalDuration) {
            setIsPlaying(false);
            return 0;
          }
          return prev + 0.1;
        });
        // Simulate audio amplitude
        setAmplitude(Math.random() * 0.6 + 0.2);
      }, 100);
      return () => { 
        clearInterval(interval); 
        setAmplitude(0); 
      };
    }
  }, [isPlaying, totalDuration]);
  
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  
  // Handle scrub bar seek
  const handleSeek = (time: number) => {
    setCurrentTime(time);
  };
  
  return (
    <div 
      style={{ 
        height: '100vh', 
        position: 'relative', 
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* Dither Background - Grey like ElevenLabs preview - reduced opacity */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        opacity: 0.25,
      }}>
        <Dither 
          waveColor="#606060"
          backgroundColor="#0a0a0a"
          waveAmplitude={30}
          waveFrequency={0.012}
          waveSpeed={0.012}
        />
      </div>
      
      {/* Gradient fade to black at top */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '30vh',
        background: 'linear-gradient(to bottom, #000 0%, transparent 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />
      
      {/* Content Container - Scrollable */}
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        width: '100%',
        padding: '0 24px', 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: '20px',
        boxSizing: 'border-box',
      }}>
        
        {/* Header - pushed up */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingTop: '32px', 
          marginBottom: '16px',
        }}>
          <button 
            onClick={() => navigate('/')} 
            style={{ 
              padding: '12px', 
              background: 'rgba(255,255,255,0.05)', 
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '50%', 
              cursor: 'pointer', 
              color: 'white',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <ChevronLeft size={20} />
          </button>
          
          <p style={{ 
            fontSize: '12px', 
            color: 'rgba(255,255,255,0.5)', 
            textTransform: 'uppercase', 
            letterSpacing: '3px', 
            fontWeight: 500,
            fontFamily: 'Genos, sans-serif',
          }}>
            Now Playing
          </p>
          
          {/* Empty spacer for alignment */}
          <div style={{ width: '44px' }} />
        </div>
        
        {/* Title Section */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 600, 
            fontFamily: 'Genos, sans-serif',
            marginBottom: '6px',
            lineHeight: 1.2,
          }}>
            The Future of Ai
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'Genos, sans-serif',
          }}>
            TechCrunch • 3 min read
          </p>
        </div>
        
        {/* ElevenLabs Orb Visualizer - centered */}
        <div style={{ 
          width: '100%',
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          marginBottom: '16px',
        }}>
          <div style={{ 
            width: '200px', 
            height: '200px',
            borderRadius: '50%',
            overflow: 'hidden',
            background: '#000',
            boxShadow: '0 0 40px rgba(0,0,0,0.5)',
            flexShrink: 0,
          }}>
            <Orb 
              colors={["#CADCFC", "#A0B9D1"]}
              agentState={isPlaying ? 'talking' : null}
              volumeMode="manual"
              manualOutput={isPlaying ? amplitude : 0.1}
              manualInput={isPlaying ? amplitude * 0.5 : 0}
            />
          </div>
        </div>
        
        {/* Scrub Bar below orb */}
        <div style={{ 
          marginBottom: '20px',
          padding: '0 16px',
        }}>
          <ScrubBarContainer
            duration={totalDuration}
            value={currentTime}
            onScrub={handleSeek}
            onScrubStart={() => setIsPlaying(false)}
            onScrubEnd={() => {}}
          >
            <ScrubBarTimeLabel time={currentTime} style={{ width: '36px', textAlign: 'left', fontSize: '12px', fontFamily: 'Genos, sans-serif' }} />
            <ScrubBarTrack style={{ margin: '0 10px', height: '4px' }}>
              <ScrubBarProgress progressColor="#ffffff" />
              <ScrubBarThumb 
                style={{ 
                  width: '12px', 
                  height: '12px',
                  background: '#ffffff',
                }} 
              />
            </ScrubBarTrack>
            <ScrubBarTimeLabel time={totalDuration} style={{ width: '36px', textAlign: 'right', fontSize: '12px', fontFamily: 'Genos, sans-serif' }} />
          </ScrubBarContainer>
        </div>
        
        {/* Controls Row: Share | SkipBack | Play | SkipForward | Speed */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '12px',
          marginBottom: '20px',
        }}>
          {/* Share Button - dark circle */}
          <button 
            style={{ 
              width: '48px',
              height: '48px',
              background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '50%', 
              cursor: 'pointer', 
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            <Share2 size={18} />
          </button>
          
          {/* Skip Back - white oval */}
          <button 
            onClick={() => setCurrentTime(Math.max(0, currentTime - 15))} 
            style={{ 
              width: '52px',
              height: '44px',
              background: 'linear-gradient(145deg, #ffffff 0%, #e8e8e8 100%)',
              border: '1px solid rgba(255,255,255,0.8)', 
              borderRadius: '50%',
              cursor: 'pointer', 
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <SkipBack size={18} fill="#050505" />
          </button>
          
          {/* Play/Pause - larger white oval */}
          <button 
            onClick={() => setIsPlaying(!isPlaying)} 
            style={{ 
              width: '64px', 
              height: '56px', 
              borderRadius: '50%', 
              background: 'linear-gradient(145deg, #ffffff 0%, #e8e8e8 100%)', 
              border: '1px solid rgba(255,255,255,0.8)', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              boxShadow: 'inset 0 2px 0 rgba(255,255,255,0.9), 0 3px 10px rgba(0,0,0,0.3)',
            }}
          >
            {isPlaying ? (
              <Pause size={26} fill="#050505" color="#050505" />
            ) : (
              <Play size={26} fill="#050505" color="#050505" style={{ marginLeft: '3px' }} />
            )}
          </button>
          
          {/* Skip Forward - white oval */}
          <button 
            onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 15))} 
            style={{ 
              width: '52px',
              height: '44px',
              background: 'linear-gradient(145deg, #ffffff 0%, #e8e8e8 100%)',
              border: '1px solid rgba(255,255,255,0.8)', 
              borderRadius: '50%',
              cursor: 'pointer', 
              color: '#000',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9), 0 2px 8px rgba(0,0,0,0.3)',
            }}
          >
            <SkipForward size={18} fill="#050505" />
          </button>
          
          {/* Speed Toggle - dark circle with fixed size */}
          <button 
            onClick={cycleSpeed}
            style={{ 
              width: '48px',
              height: '48px',
              background: 'linear-gradient(145deg, #2a2a2a 0%, #1a1a1a 100%)',
              border: '1px solid rgba(255,255,255,0.1)', 
              borderRadius: '50%',
              cursor: 'pointer', 
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              fontFamily: 'Genos, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.08), 0 2px 6px rgba(0,0,0,0.3)',
            }}
          >
            {playbackSpeed}x
          </button>
        </div>
        
        {/* Contents Section - Spotify-style with sticky header and fade */}
        <div style={{ 
          background: '#1a1a1a',
          borderRadius: '24px',
          border: '1px solid rgba(255,255,255,0.1)',
          marginBottom: '16px',
          minHeight: '320px',
          maxHeight: '350px',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none',
          position: 'relative',
        }} className="hide-scrollbar">
          {/* Sticky Contents header with fade effect */}
          <div style={{ 
            position: 'sticky',
            top: 0,
            background: 'linear-gradient(to bottom, #1a1a1a 0%, #1a1a1a 60%, transparent 100%)',
            padding: '24px 24px 32px 24px',
            zIndex: 1,
          }}>
            <p style={{ 
              fontSize: '14px', 
              color: 'rgba(255,255,255,0.4)', 
              fontFamily: 'Genos, sans-serif',
              fontWeight: 500,
              margin: 0,
            }}>
              Contents
            </p>
          </div>
          
          {/* Lyrics/Text Content - with padding for spacing */}
          <div style={{ 
            fontSize: '16px', 
            lineHeight: 2,
            fontFamily: 'Genos, sans-serif',
            padding: '0 24px 24px 24px',
            marginTop: '-16px',
          }}>
            <p style={{ 
              color: currentTime < 60 ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.35)',
              transition: 'color 0.3s ease, font-weight 0.3s ease',
              marginBottom: '12px',
              fontWeight: currentTime < 60 ? 700 : 400,
            }}>
              Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics
            </p>
            <p style={{ 
              color: currentTime >= 60 && currentTime < 120 ? 'rgba(255,255,255,1)' : 'rgba(255,255,255,0.35)',
              transition: 'color 0.3s ease, font-weight 0.3s ease',
              marginBottom: '12px',
              fontWeight: currentTime >= 60 && currentTime < 120 ? 700 : 400,
            }}>
              Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics
            </p>
            <p style={{ 
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '12px',
            }}>
              Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics
            </p>
            <p style={{ 
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '12px',
            }}>
              Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics
            </p>
            <p style={{ 
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '12px',
            }}>
              Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics
            </p>
            <p style={{ 
              color: 'rgba(255,255,255,0.35)',
              marginBottom: '12px',
            }}>
              Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics
            </p>
            <p style={{ 
              color: 'rgba(255,255,255,0.35)',
            }}>
              Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics Lyrics
            </p>
          </div>
        </div>
        
        {/* Made with love footer - lower position */}
        <div style={{ 
          textAlign: 'center',
          paddingTop: '16px',
          paddingBottom: '48px',
        }}>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'Genos, sans-serif',
          }}>
            Made with ❤️ by Nabaskar
          </p>
        </div>
      </div>
    </div>
  );
}

// Sample library items data
interface LibraryItem {
  id: string;
  title: string;
  source: string;
  duration: string;
  progress: number;
  type: 'Tweet' | 'Article' | 'Thread';
  isFavorite: boolean;
  isOffline: boolean;
  platform: 'twitter' | 'medium' | 'substack' | 'web';
}

const LIBRARY_ITEMS: LibraryItem[] = [
  {
    id: '1',
    title: 'The Future of AI in Software Development',
    source: 'TechCrunch',
    duration: '8 min',
    progress: 45,
    type: 'Article',
    isFavorite: true,
    isOffline: false,
    platform: 'web',
  },
  {
    id: '2',
    title: 'Thread: Why startups fail in 2024',
    source: '@pmarca',
    duration: '5 min',
    progress: 100,
    type: 'Thread',
    isFavorite: false,
    isOffline: true,
    platform: 'twitter',
  },
  {
    id: '3',
    title: 'Building products users love',
    source: 'Medium',
    duration: '12 min',
    progress: 0,
    type: 'Article',
    isFavorite: false,
    isOffline: false,
    platform: 'medium',
  },
  {
    id: '4',
    title: 'Hot take: React is overrated',
    source: '@dan_abramov',
    duration: '2 min',
    progress: 80,
    type: 'Tweet',
    isFavorite: true,
    isOffline: true,
    platform: 'twitter',
  },
  {
    id: '5',
    title: 'The Anatomy of a Great Product Launch',
    source: 'Substack',
    duration: '15 min',
    progress: 20,
    type: 'Article',
    isFavorite: false,
    isOffline: false,
    platform: 'substack',
  },
];

type FilterType = 'All' | 'Favorites' | 'Saved' | 'Tweets' | 'Articles';
const FILTER_OPTIONS: FilterType[] = ['All', 'Favorites', 'Saved', 'Tweets', 'Articles'];

function LibraryPage({ palette }: { palette: PaletteKey }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [items, setItems] = useState(LIBRARY_ITEMS);
  
  // Calculate time left from progress and duration
  const getTimeLeft = (duration: string, progress: number) => {
    const mins = parseInt(duration);
    const left = Math.ceil(mins * (1 - progress / 100));
    return left > 0 ? `${left}m left` : 'Done';
  };
  
  // Toggle favorite
  const toggleFavorite = (id: string) => {
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
    ));
  };
  
  // Filter items by search and active filter
  const filteredItems = items.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.source.toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeFilter) {
      case 'Favorites': return item.isFavorite;
      case 'Saved': return item.isOffline;
      case 'Tweets': return item.type === 'Tweet';
      case 'Articles': return item.type === 'Article';
      default: return true;
    }
  });
  
  // Get platform logo/icon
  const getPlatformLogo = (platform: string) => {
    switch (platform) {
      case 'x':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
          </svg>
        );
      case 'medium':
        return (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M13.54 12a6.8 6.8 0 01-6.77 6.82A6.8 6.8 0 010 12a6.8 6.8 0 016.77-6.82A6.8 6.8 0 0113.54 12zM20.96 12c0 3.54-1.51 6.42-3.38 6.42-1.87 0-3.39-2.88-3.39-6.42s1.52-6.42 3.39-6.42 3.38 2.88 3.38 6.42M24 12c0 3.17-.53 5.75-1.19 5.75-.66 0-1.19-2.58-1.19-5.75s.53-5.75 1.19-5.75C23.47 6.25 24 8.83 24 12z"/>
          </svg>
        );
      case 'techcrunch':
        return <span style={{ fontSize: '14px', fontWeight: 700, color: '#0A0' }}>TC</span>;
      case 'devto':
        return <span style={{ fontSize: '12px', fontWeight: 700, color: '#fff' }}>DEV</span>;
      case 'web':
        return (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        );
      default:
        return <span style={{ fontSize: '10px', color: 'rgba(255,255,255,0.4)' }}>Logo</span>;
    }
  };
  
  return (
    <div 
      style={{ 
        height: '100vh', 
        position: 'relative', 
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* DarkVeil Background - Same as Home */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        transform: 'rotate(180deg)',
      }}>
        <DarkVeil 
          hueShift={PALETTE_HUE_SHIFTS[palette]}
          speed={0.6}
          noiseIntensity={0.15}
          warpAmount={0.5}
        />
      </div>
      
      {/* Noise Overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 1, pointerEvents: 'none' }}>
        <Noise patternAlpha={20} patternSize={100} />
      </div>
      
      {/* Gradient fade to black at top */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '50vh',
        background: 'linear-gradient(to bottom, #000 0%, transparent 100%)',
        zIndex: 0,
        pointerEvents: 'none',
      }} />
      
      {/* Content Container */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        width: '100%',
        maxWidth: '390px', 
        margin: '0 auto', 
        padding: '0 24px', 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
      }}>
        
        {/* Version - Same as Home */}
        <div style={{ paddingTop: '24px', textAlign: 'center' }}>
          <span className="genos-font" style={{ 
            fontSize: '13px', 
            color: 'rgba(255,255,255,0.4)', 
            fontStyle: 'italic',
          }}>
            v1.0
          </span>
        </div>
        
        {/* Fixed Header */}
        <div style={{ 
          textAlign: 'center', 
          paddingTop: '32px',
          paddingBottom: '24px',
        }}>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: 800, 
            marginBottom: '8px', 
            fontFamily: 'Funnel Display, sans-serif',
            lineHeight: 1.1,
          }}>
            Your Library
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'Funnel Display, sans-serif',
            fontWeight: 300,
          }}>
            Collection of your recently<br />played and saved
          </p>
        </div>
        
        {/* Scrollable Content Box */}
        <div 
          className="library-scroll-container"
          style={{ 
            flex: 1,
            background: 'rgba(20, 20, 24, 0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            padding: '20px',
            marginBottom: '140px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 320px)',
            overflow: 'hidden',
          }}
        >
          {/* Search Input */}
          <div 
            style={{ 
              marginBottom: '16px',
              borderRadius: '50px',
              border: '1px solid rgba(255,255,255,0.2)',
              background: 'rgba(255,255,255,0.03)',
            }}
          >
            <input
              type="text"
              placeholder="Search Your Collection.."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                background: 'transparent',
                border: 'none',
                padding: '14px 20px',
                fontSize: '14px',
                color: 'white',
                outline: 'none',
                fontFamily: 'Funnel Display, sans-serif',
              }}
            />
          </div>
          
          {/* Filter Pills - All visible in one row */}
          <div style={{ 
            display: 'flex', 
            gap: '6px', 
            marginBottom: '16px', 
          }}>
            {FILTER_OPTIONS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={activeFilter === filter ? 'shine-fill' : ''}
                style={{
                  padding: '6px 12px',
                  borderRadius: '50px',
                  border: activeFilter === filter 
                    ? 'none' 
                    : '1px solid rgba(255,255,255,0.2)',
                  background: activeFilter === filter 
                    ? 'rgba(255,255,255,0.95)' 
                    : 'transparent',
                  color: activeFilter === filter ? '#000' : 'rgba(255,255,255,0.7)',
                  fontSize: '12px',
                  fontWeight: 400,
                  fontStyle: 'italic',
                  cursor: 'pointer',
                  whiteSpace: 'nowrap',
                  transition: 'all 0.2s ease',
                  fontFamily: 'Genos, sans-serif',
                }}
              >
                {filter}
              </button>
            ))}
          </div>
          
          {/* Article List - Scrollable */}
          <div 
            className="library-list-scroll"
            style={{ 
              flex: 1, 
              overflowY: 'auto',
              paddingRight: '8px',
            }}
          >
            {filteredItems.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '24px 0', fontSize: '14px' }}>
                No items found
              </p>
            ) : (
              filteredItems.map((item, i) => (
                <div 
                  key={item.id} 
                  style={{ 
                    display: 'flex', 
                    alignItems: 'flex-start', 
                    gap: '12px', 
                    padding: '14px 0', 
                    borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none' 
                  }}
                >
                  {/* Source Logo */}
                  <div style={{ 
                    width: '48px', 
                    height: '48px', 
                    borderRadius: '10px', 
                    background: 'rgba(255,255,255,0.03)',
                    border: '1px solid rgba(255,255,255,0.12)',
                    display: 'flex', 
                    alignItems: 'center', 
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    {getPlatformLogo(item.platform)}
                  </div>
                  
                  {/* Content + Progress Bar */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '4px' }}>
                      <div style={{ flex: 1, minWidth: 0, marginRight: '12px' }}>
                        <p style={{ 
                          fontSize: '15px', 
                          fontWeight: 500, 
                          overflow: 'hidden', 
                          textOverflow: 'ellipsis', 
                          whiteSpace: 'nowrap',
                          fontFamily: 'Funnel Display, sans-serif',
                          marginBottom: '2px',
                        }}>
                          {item.title}
                        </p>
                        <p style={{ 
                          fontSize: '12px', 
                          color: 'rgba(255,255,255,0.4)',
                          fontFamily: 'Funnel Display, sans-serif',
                        }}>
                          {item.source} · {item.type}
                        </p>
                      </div>
                      
                      {/* Time Left */}
                      <span style={{ 
                        fontSize: '12px', 
                        color: 'rgba(255,255,255,0.5)',
                        fontFamily: 'Funnel Display, sans-serif',
                        marginRight: '8px',
                        flexShrink: 0,
                      }}>
                        {item.progress > 0 && item.progress < 100 
                          ? getTimeLeft(item.duration, item.progress)
                          : `${item.duration} left`
                        }
                      </span>
                      
                      {/* Favorite Star */}
                      <button
                        onClick={() => toggleFavorite(item.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          padding: '4px',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                        }}
                      >
                        <svg 
                          width="20" 
                          height="20" 
                          viewBox="0 0 24 24" 
                          fill={item.isFavorite ? '#F59E0B' : 'none'}
                          stroke={item.isFavorite ? '#F59E0B' : 'rgba(255,255,255,0.3)'}
                          strokeWidth="2"
                          style={{ transition: 'all 0.2s ease' }}
                        >
                          <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" />
                        </svg>
                      </button>
                    </div>
                    
                    {/* Progress Bar */}
                    <div style={{ 
                      display: 'flex',
                      gap: '4px',
                      marginTop: '8px',
                    }}>
                      {/* Played portion (orange/gold) */}
                      <div style={{
                        flex: item.progress || 1,
                        height: '3px',
                        borderRadius: '2px',
                        background: item.progress > 0 
                          ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' 
                          : 'rgba(255,255,255,0.15)',
                      }} />
                      {/* Remaining portion (gray) */}
                      {item.progress > 0 && item.progress < 100 && (
                        <div style={{
                          flex: 100 - item.progress,
                          height: '3px',
                          borderRadius: '2px',
                          background: 'rgba(255,255,255,0.15)',
                        }} />
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== SETTINGS PAGE ====================
function SettingsPage({ palette }: { palette: PaletteKey }) {
  const colors = PALETTES[palette];
  const [playbackSpeed, setPlaybackSpeed] = useState(1.0);
  const [autoArchive, setAutoArchive] = useState(false);
  const [hapticsEnabled, setHapticsEnabled] = useState(true);
  const [showCacheCleared, setShowCacheCleared] = useState(false);
  
  const handleClearCache = () => {
    setShowCacheCleared(true);
    setTimeout(() => setShowCacheCleared(false), 2000);
  };
  
  // Toggle Switch Component
  const Toggle = ({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) => (
    <button
      onClick={onToggle}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: enabled ? colors.primary : 'rgba(255,255,255,0.15)',
        border: 'none',
        cursor: 'pointer',
        position: 'relative',
        transition: 'background 0.2s ease',
      }}
    >
      <div style={{
        position: 'absolute',
        top: '2px',
        left: enabled ? '22px' : '2px',
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        background: 'white',
        transition: 'left 0.2s ease',
        boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
      }} />
    </button>
  );
  
  return (
    <div 
      style={{ 
        height: '100vh', 
        position: 'relative', 
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      {/* DarkVeil Background - Same as Home */}
      <div style={{
        position: 'fixed',
        inset: 0,
        zIndex: 0,
        transform: 'rotate(180deg)',
      }}>
        <DarkVeil 
          hueShift={PALETTE_HUE_SHIFTS[palette]}
          speed={0.6}
          noiseIntensity={0.15}
          warpAmount={0.5}
        />
      </div>
      
      {/* Noise Overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Noise patternAlpha={15} patternSize={100} />
      </div>
      
      {/* Gradient fade to black at top */}
      <div style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: '50vh',
        background: 'linear-gradient(to bottom, #000 0%, transparent 100%)',
        zIndex: 1,
        pointerEvents: 'none',
      }} />
      
      {/* Content Container */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        width: '100%',
        maxWidth: '390px', 
        margin: '0 auto', 
        padding: '0 20px', 
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
      }}>
        
        {/* Version - Same as Home */}
        <div style={{ paddingTop: '24px', textAlign: 'center' }}>
          <span className="genos-font" style={{ 
            fontSize: '13px', 
            color: 'rgba(255,255,255,0.4)', 
            fontStyle: 'italic',
          }}>
            v1.0
          </span>
        </div>
        
        {/* Fixed Header */}
        <div style={{ 
          textAlign: 'center', 
          paddingTop: '32px',
          paddingBottom: '24px',
        }}>
          <h1 style={{ 
            fontSize: '42px', 
            fontWeight: 800, 
            marginBottom: '8px', 
            fontFamily: 'Funnel Display, sans-serif',
            lineHeight: 1.1,
          }}>
            Settings
          </h1>
          <p style={{ 
            fontSize: '16px', 
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'Funnel Display, sans-serif',
            fontWeight: 300,
          }}>
            Customize your<br />experience
          </p>
        </div>
        
        {/* Content Box - Scrollable without visible scrollbar */}
        <div 
          className="hide-scrollbar"
          style={{ 
            flex: 1,
            background: 'rgba(20, 20, 24, 0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            padding: '20px',
            marginBottom: '140px',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: 'calc(100vh - 320px)',
            overflowY: 'auto',
          }}
        >
          {/* Playback Group */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>Playback</p>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', overflow: 'hidden' }}>
              {/* Default Voice */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px', cursor: 'pointer' }}>
                <Mic size={18} style={{ color: 'rgba(255,255,255,0.4)', marginRight: '12px' }} />
                <span style={{ flex: 1, fontSize: '15px', fontFamily: 'Funnel Display, sans-serif' }}>Default Voice</span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginRight: '8px' }}>Nova</span>
                <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
              
              {/* Playback Speed - Free Scrub Bar */}
              <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <Play size={18} style={{ color: 'rgba(255,255,255,0.4)', marginRight: '12px' }} />
                  <span style={{ flex: 1, fontSize: '15px', fontFamily: 'Funnel Display, sans-serif' }}>Default Speed</span>
                </div>
                
                <ScrubBar
                  value={playbackSpeed}
                  min={0.5}
                  max={2.5}
                  step={0.05}
                  onChange={(val) => setPlaybackSpeed(Math.round(val * 100) / 100)}
                  formatValue={(v) => `${v.toFixed(2)}x`}
                  primaryColor={colors.primary}
                  secondaryColor={colors.secondary}
                />
              </div>
            </div>
          </div>
          
          {/* Storage Group */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>Storage & Data</p>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', overflow: 'hidden' }}>
              {/* Auto-Archive */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px' }}>
                <Share2 size={18} style={{ color: 'rgba(255,255,255,0.4)', marginRight: '12px', transform: 'rotate(90deg)' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '15px', display: 'block', fontFamily: 'Funnel Display, sans-serif' }}>Auto-Archive</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Delete after 30 days</span>
                </div>
                <Toggle enabled={autoArchive} onToggle={() => setAutoArchive(!autoArchive)} />
              </div>
              
              {/* Clear Cache */}
              <div 
                onClick={handleClearCache}
                style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  padding: '14px', 
                  borderTop: '1px solid rgba(255,255,255,0.06)', 
                  cursor: 'pointer' 
                }}
              >
                <Sparkles size={18} style={{ color: 'rgba(255,255,255,0.4)', marginRight: '12px' }} />
                <span style={{ flex: 1, fontSize: '15px', fontFamily: 'Funnel Display, sans-serif' }}>Clear Cache</span>
                {showCacheCleared ? (
                  <span style={{ fontSize: '13px', color: colors.primary }}>✓ Cleared</span>
                ) : (
                  <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
                )}
              </div>
            </div>
          </div>
          
          {/* System Group */}
          <div>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>System</p>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', overflow: 'hidden' }}>
              {/* Haptics */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px' }}>
                <Sparkles size={18} style={{ color: 'rgba(255,255,255,0.4)', marginRight: '12px' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '15px', display: 'block', fontFamily: 'Funnel Display, sans-serif' }}>Haptics</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Vibration feedback</span>
                </div>
                <Toggle enabled={hapticsEnabled} onToggle={() => setHapticsEnabled(!hapticsEnabled)} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ==================== PHONE MOCKUP WRAPPER (Desktop Only) ====================
function PhoneMockup({ children }: { children: React.ReactNode }) {
  const [isDesktop, setIsDesktop] = useState(false);
  const location = useLocation();
  const isPlayerPage = location.pathname === '/player';
  
  useEffect(() => {
    const checkDesktop = () => {
      setIsDesktop(window.innerWidth >= 1024);
    };
    checkDesktop();
    window.addEventListener('resize', checkDesktop);
    return () => window.removeEventListener('resize', checkDesktop);
  }, []);
  
  if (!isDesktop) {
    // Mobile/tablet: render app normally without phone frame
    return <>{children}</>;
  }
  
  // Desktop: render phone mockup with gradient background
  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      background: '#0a0a0a',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
      position: 'relative',
    }}>
      {/* Interactive DotGrid background - matching react-bits preview */}
      <DotGrid 
        dotSize={4}
        gap={20}
        baseColor="#2a2a40"
        activeColor="#5227FF"
        proximity={100}
        shockRadius={180}
        shockStrength={2}
        returnSpeed={0.08}
        excludeSelector="[data-phone-frame]"
      />
      
      {/* Made with love footer - bottom right */}
      <div style={{
        position: 'absolute',
        bottom: '24px',
        right: '32px',
        fontSize: '13px',
        color: 'rgba(255, 255, 255, 0.4)',
        fontFamily: 'Genos, sans-serif',
        fontStyle: 'italic',
        letterSpacing: '0.02em',
        zIndex: 5,
      }}>
        Made with ❤️ by nabaskar
      </div>
      
      {/* iPhone Frame - fits viewport */}
      <div 
        data-phone-frame
        style={{
        position: 'relative',
        width: '360px',
        height: '740px',
        background: 'linear-gradient(145deg, #5a5a5a 0%, #4a4a4a 5%, #3a3a3a 15%, #2a2a2a 40%, #1a1a1a 70%, #0d0d0d 100%)',
        borderRadius: '44px',
        padding: '8px',
        boxShadow: `
          0 25px 70px rgba(0, 0, 0, 0.9),
          0 0 0 1px rgba(255, 255, 255, 0.35),
          0 0 0 2px rgba(0, 0, 0, 0.3),
          inset 0 1px 0 rgba(255, 255, 255, 0.4),
          inset 0 -1px 0 rgba(255, 255, 255, 0.1)
        `,
        zIndex: 10,
      }}>
        {/* Shiny metallic edge - left */}
        <div style={{
          position: 'absolute',
          top: '15%',
          bottom: '15%',
          left: '0px',
          width: '2px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.4) 20%, rgba(255,255,255,0.5) 50%, rgba(255,255,255,0.4) 80%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        
        {/* Shiny metallic edge - right */}
        <div style={{
          position: 'absolute',
          top: '15%',
          bottom: '15%',
          right: '0px',
          width: '2px',
          background: 'linear-gradient(180deg, transparent 0%, rgba(255,255,255,0.3) 20%, rgba(255,255,255,0.4) 50%, rgba(255,255,255,0.3) 80%, transparent 100%)',
          pointerEvents: 'none',
        }} />
        
        {/* Phone bezel highlight - top edge shine */}
        <div style={{
          position: 'absolute',
          top: '1px',
          left: '10%',
          right: '10%',
          height: '2px',
          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.5) 30%, rgba(255,255,255,0.6) 50%, rgba(255,255,255,0.5) 70%, transparent 100%)',
          borderRadius: '1px',
          pointerEvents: 'none',
        }} />
        
        {/* Screen area - conditional scaling based on page */}
        <div style={{
          width: '100%',
          height: '100%',
          borderRadius: '36px',
          overflow: 'hidden',
          background: '#000',
          position: 'relative',
          // CRITICAL: transform creates a new containing block for position:fixed elements
          transform: 'translateZ(0)',
          isolation: 'isolate',
        }}>
          {isPlayerPage ? (
            // Player page: NO scaling - orb needs 100% render for centering
            <div style={{
              width: '100%',
              height: '100%',
              overflow: 'auto',
              position: 'relative',
            }} className="hide-scrollbar">
              {children}
            </div>
          ) : (
            // Other pages: Apply transform scale
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '390px',
              height: '844px',
              transform: 'translate(-50%, -50%) scale(0.88)',
              transformOrigin: 'center center',
              overflow: 'hidden',
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                overflow: 'auto',
                position: 'relative',
              }} className="hide-scrollbar">
                {children}
              </div>
            </div>
          )}
        </div>
        
        {/* Side buttons - Mute switch */}
        <div style={{
          position: 'absolute',
          left: '-2px',
          top: '120px',
          width: '3px',
          height: '28px',
          background: 'linear-gradient(90deg, #2a2a2a 0%, #4a4a4a 50%, #3a3a3a 100%)',
          borderRadius: '2px 0 0 2px',
        }} />
        
        {/* Volume up */}
        <div style={{
          position: 'absolute',
          left: '-2px',
          top: '162px',
          width: '3px',
          height: '52px',
          background: 'linear-gradient(90deg, #2a2a2a 0%, #4a4a4a 50%, #3a3a3a 100%)',
          borderRadius: '2px 0 0 2px',
        }} />
        
        {/* Volume down */}
        <div style={{
          position: 'absolute',
          left: '-2px',
          top: '228px',
          width: '3px',
          height: '52px',
          background: 'linear-gradient(90deg, #2a2a2a 0%, #4a4a4a 50%, #3a3a3a 100%)',
          borderRadius: '2px 0 0 2px',
        }} />
        
        {/* Power button */}
        <div style={{
          position: 'absolute',
          right: '-2px',
          top: '190px',
          width: '3px',
          height: '82px',
          background: 'linear-gradient(270deg, #2a2a2a 0%, #4a4a4a 50%, #3a3a3a 100%)',
          borderRadius: '0 2px 2px 0',
        }} />
      </div>
    </div>
  );
}


// ==================== APP ====================
function AppLayout() {
  const location = useLocation();
  const [palette, setPalette] = useState<PaletteKey>('ember');
  const [isTransitioning, setIsTransitioning] = useState(false);
  
  const handleHomeVisit = () => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    
    const currentIndex = PALETTE_KEYS.indexOf(palette);
    const nextPalette = PALETTE_KEYS[(currentIndex + 1) % PALETTE_KEYS.length];
    
    setTimeout(() => {
      setPalette(nextPalette);
      setIsTransitioning(false);
    }, 100);
  };
  
  const appContent = (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <Routes location={location}>
        <Route path="/" element={<HomePage palette={palette} onVisit={handleHomeVisit} />} />
        <Route path="/player" element={<PlayerPage palette={palette} />} />
        <Route path="/library" element={<LibraryPage palette={palette} />} />
        <Route path="/settings" element={<SettingsPage palette={palette} />} />
      </Routes>
      <Navigation palette={palette} />
    </div>
  );
  
  return (
    <PhoneMockup>
      {appContent}
    </PhoneMockup>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AppLayout />
    </BrowserRouter>
  );
}

export default App;

