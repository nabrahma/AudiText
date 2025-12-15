import DarkVeil from '@/components/DarkVeil';
import Noise from '@/components/Noise';
import { ScrubBar } from '@/components/ScrubBar';
import ShimmeringText from '@/components/ShimmeringText';
import { BookOpenTextIcon } from '@/components/icons/BookOpenTextIcon';
import { HouseIcon } from '@/components/icons/HouseIcon';
import { SettingsIcon } from '@/components/icons/SettingsIcon';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, ChevronRight, Eye, Mic, Pause, Play, Share2, SkipBack, SkipForward, Sparkles } from 'lucide-react';
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.4 }}
      style={{ minHeight: '100vh', position: 'relative', background: '#000' }}
    >
      {/* DarkVeil Background - Fullscreen */}
      <div style={{
        position: 'fixed',
        inset: 0, /* Fullscreen */
        zIndex: 0,
        transform: 'rotate(180deg)', /* Flip so effect comes from bottom */
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
    </motion.div>
  );
}

// ==================== PLAYER PAGE ====================
function PlayerPage({ palette }: { palette: PaletteKey }) {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [amplitude, setAmplitude] = useState(0);
  const [visualMode, setVisualMode] = useState<'BLOB' | 'AURORA'>('BLOB');
  const totalDuration = 180;
  const colors = PALETTES[palette];
  
  useEffect(() => {
    if (isPlaying) {
      const interval = setInterval(() => {
        setCurrentTime((prev) => prev >= totalDuration ? (setIsPlaying(false), 0) : prev + 0.1);
        setAmplitude(Math.random() * 0.5 + 0.3);
      }, 100);
      return () => { clearInterval(interval); setAmplitude(0); };
    }
  }, [isPlaying, totalDuration]);
  
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${Math.floor(s % 60).toString().padStart(2, '0')}`;
  const progress = (currentTime / totalDuration) * 100;
  
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ minHeight: '100vh', position: 'relative', background: '#050505' }}>
      <SubtleBackground palette={palette} />
      
      <div style={{ position: 'relative', zIndex: 1, maxWidth: '390px', margin: '0 auto', padding: '0 24px', minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: '48px', marginBottom: '24px' }}>
          <button onClick={() => navigate('/')} style={{ padding: '10px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: 'white' }}><ChevronDown size={20} /></button>
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.5px', marginBottom: '4px' }}>Now Playing</p>
            <h2 style={{ fontSize: '18px', fontWeight: 600, fontFamily: 'Funnel Display, sans-serif' }}>The Future of AI</h2>
          </div>
          <button style={{ padding: '10px', background: 'rgba(255,255,255,0.08)', border: 'none', borderRadius: '50%', cursor: 'pointer', color: 'white' }}><Share2 size={18} /></button>
        </div>
        
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '280px' }}>
          {visualMode === 'BLOB' ? <GeminiOrb amplitude={isPlaying ? amplitude : 0} size={220} palette={palette} /> : <Sparkles size={100} strokeWidth={1} style={{ color: colors.primary, opacity: 0.4 }} />}
        </div>
        
        <div style={{ paddingBottom: '48px' }}>
          <div style={{ marginBottom: '24px' }}>
            <div style={{ height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
              <div style={{ height: '100%', width: `${progress}%`, background: colors.primary, transition: 'width 0.1s linear' }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', fontSize: '11px', color: 'rgba(255,255,255,0.4)', fontFamily: 'monospace' }}>
              <span>{formatTime(currentTime)}</span><span>{formatTime(totalDuration)}</span>
            </div>
          </div>
          
          <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '32px' }}>
            {['BLOB', 'AURORA'].map((mode) => (
              <button key={mode} onClick={() => setVisualMode(mode as any)} style={{
                padding: '8px 16px', background: visualMode === mode ? 'rgba(255,255,255,0.1)' : 'transparent',
                border: `1px solid ${visualMode === mode ? colors.primary : 'rgba(255,255,255,0.1)'}`,
                borderRadius: '20px', color: visualMode === mode ? colors.primary : 'rgba(255,255,255,0.5)',
                fontSize: '13px', fontWeight: 500, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '6px',
                fontFamily: 'Funnel Display, sans-serif',
              }}>
                {mode === 'BLOB' ? <Eye size={14} /> : <Sparkles size={14} />}{mode === 'BLOB' ? 'Orb' : 'Aurora'}
              </button>
            ))}
          </div>
          
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '36px' }}>
            <button onClick={() => setCurrentTime(Math.max(0, currentTime - 15))} style={{ padding: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}><SkipBack size={26} /></button>
            <button onClick={() => setIsPlaying(!isPlaying)} style={{ width: '72px', height: '72px', borderRadius: '50%', background: 'white', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {isPlaying ? <Pause size={28} fill="#050505" color="#050505" /> : <Play size={28} fill="#050505" color="#050505" style={{ marginLeft: '3px' }} />}
            </button>
            <button onClick={() => setCurrentTime(Math.min(totalDuration, currentTime + 15))} style={{ padding: '10px', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.5)' }}><SkipForward size={26} /></button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ==================== LIBRARY PAGE ====================
const LIBRARY_ITEMS = [
  { id: '1', title: 'The Future of AI', source: 'TechCrunch', platform: 'techcrunch', duration: '5m', progress: 80, isFavorite: true, isOffline: true, type: 'Article' as const },
  { id: '2', title: 'React 19 Thread', source: '@dan_abramov', platform: 'x', duration: '2m', progress: 0, isFavorite: false, isOffline: false, type: 'Tweet' as const },
  { id: '3', title: 'Understanding ML Basics', source: 'Medium', platform: 'medium', duration: '8m', progress: 50, isFavorite: true, isOffline: false, type: 'Article' as const },
  { id: '4', title: 'Web Dev Tips', source: '@wesbos', platform: 'x', duration: '3m', progress: 100, isFavorite: false, isOffline: true, type: 'Tweet' as const },
  { id: '5', title: 'Design Systems Guide', source: 'Smashing Mag', platform: 'web', duration: '12m', progress: 25, isFavorite: false, isOffline: false, type: 'Article' as const },
  { id: '6', title: 'TypeScript Best Practices', source: 'Dev.to', platform: 'devto', duration: '6m', progress: 0, isFavorite: true, isOffline: true, type: 'Article' as const },
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
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
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
    </motion.div>
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
    <motion.div 
      initial={{ opacity: 0 }} 
      animate={{ opacity: 1 }} 
      exit={{ opacity: 0 }} 
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
        
        {/* Scrollable Content Box */}
        <div 
          className="library-list-scroll"
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
          
          {/* Appearance Group */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>Appearance</p>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', overflow: 'hidden' }}>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px', cursor: 'pointer' }}>
                <Eye size={18} style={{ color: 'rgba(255,255,255,0.4)', marginRight: '12px' }} />
                <span style={{ flex: 1, fontSize: '15px', fontFamily: 'Funnel Display, sans-serif' }}>Theme</span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginRight: '8px' }}>Dark</span>
                <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px', borderTop: '1px solid rgba(255,255,255,0.06)', cursor: 'pointer' }}>
                <Sparkles size={18} style={{ color: 'rgba(255,255,255,0.4)', marginRight: '12px' }} />
                <span style={{ flex: 1, fontSize: '15px', fontFamily: 'Funnel Display, sans-serif' }}>Visualizer</span>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.4)', marginRight: '8px' }}>Orb</span>
                <ChevronRight size={16} style={{ color: 'rgba(255,255,255,0.3)' }} />
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
    </motion.div>
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
  
  return (
    <motion.div
      animate={{ 
        filter: isTransitioning ? 'brightness(0.8)' : 'brightness(1)',
      }}
      transition={{ duration: 0.3 }}
    >
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route path="/" element={<HomePage palette={palette} onVisit={handleHomeVisit} />} />
          <Route path="/player" element={<PlayerPage palette={palette} />} />
          <Route path="/library" element={<LibraryPage palette={palette} />} />
          <Route path="/settings" element={<SettingsPage palette={palette} />} />
        </Routes>
      </AnimatePresence>
      <Navigation palette={palette} />
    </motion.div>
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
