import { BookOpenTextIcon } from '@/components/icons/BookOpenTextIcon';
import { HouseIcon } from '@/components/icons/HouseIcon';
import { SettingsIcon } from '@/components/icons/SettingsIcon';
import Noise from '@/components/Noise';

import { ScrubBar } from '@/components/ScrubBar';
import ShimmeringText from '@/components/ShimmeringText';
import { ScrubBarContainer, ScrubBarProgress, ScrubBarThumb, ScrubBarTimeLabel, ScrubBarTrack } from '@/components/ui/scrub-bar';
import { addToLibrary, clearLibrary, deleteLibraryItem, getLibraryItems, toggleFavorite, type LibraryItem } from '@/lib/api';
import { AudioProvider, MAX_SPEED, MIN_SPEED, useAudio, useAudioTime } from '@/lib/AudioContext';
import { AnimatePresence, motion, useAnimation, type PanInfo } from 'framer-motion';
import { ChevronLeft, ChevronRight, Loader2, LogOut, Pause, Play, Share2, SkipBack, SkipForward, Sparkles, Trash2 } from 'lucide-react';
import React, { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BrowserRouter, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { PullToRefresh } from './components/PullToRefresh';
import './index.css';

import { supabase } from '@/lib/supabase';
import { AuthPage } from './AuthPage';

// Desktop-only decoration. Lazy so mobile users never download it (or gsap).
const DotGrid = lazy(() => import('@/components/DotGrid'));





const MAX_URL_LENGTH = 2048;

/**
 * Accept what a person would actually paste ("x.com/foo", "https://…") and hand the
 * backend a canonical absolute URL. Returns null when the input is not a web link.
 *
 * Note: this is a usability guard, not a security boundary - the edge function is
 * what actually fetches the URL and is where SSRF/host allow-listing belongs.
 */
function normalizeUrl(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed || trimmed.length > MAX_URL_LENGTH) return null;

  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;

  try {
    const parsed = new URL(withScheme);
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') return null;
    // Require a real dotted hostname so typos don't get sent to the extractor.
    if (!/^[a-z0-9-]+(\.[a-z0-9-]+)+$/i.test(parsed.hostname)) return null;
    return parsed.toString();
  } catch {
    return null;
  }
}

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



// ==================== NAVIGATION ====================
function Navigation() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { Icon: HouseIcon, path: '/', label: 'Home' },
    { Icon: BookOpenTextIcon, path: '/library', label: 'Library' },
    { Icon: SettingsIcon, path: '/settings', label: 'Settings' },
  ];
  
  if (location.pathname === '/player' || location.pathname === '/auth') return null;
  
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
function HomePage({ onVisit }: { onVisit: () => void }) {
  const navigate = useNavigate();
  const [url, setUrl] = useState('');
  const [error, setError] = useState<string | null>(null);
  const hasCalledOnVisit = useRef(false);
  const audio = useAudio();
  
  // Toast logic removed per user request for silent errors
  
  useEffect(() => {
    if (!hasCalledOnVisit.current) {
      hasCalledOnVisit.current = true;
      onVisit();
    }
  }, [onVisit]);

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleListen = async () => {
    const raw = url.trim();
    if (!raw || audio.isExtracting) return;

    // DEV BYPASS: Quick Player Check
    // TODO: REMOVE BEFORE PRODUCTION (Internal Testing Only)
    // -----------------------------------------------------
    if (raw.toLowerCase() === 'test' || raw.toLowerCase() === 'debug') {
      audio.playContent({
        title: "Test Article",
        content: "This is a test article for development purposes. It allows you to verify the player functionality without extracting real content from the web. This saves time and API usage during debugging.",
        author: "Dev Team",
        source: "Localhost",
        platform: "web",
        word_count: 50
      });
      navigate('/player');
      return;
    }

    setError(null);

    const normalized = normalizeUrl(raw);
    if (!normalized) {
      setError('That does not look like a valid web link.');
      return;
    }

    try {
      // Extract the article, then start speaking it
      const content = await audio.processUrl(normalized);

      // Auto-save to the library (best effort - guests have nowhere to save to)
      if (content) {
        try {
          await addToLibrary({
            url: normalized,
            title: content.title || 'Untitled',
            content: content.content,
            author: content.author || 'Unknown',
            source: content.source || 'Web',
            platform: content.platform || 'web',
            word_count: content.word_count || 0,
            progress: 0,
            is_favorite: false,
            is_archived: false,
            audio_url: null,
          });
        } catch (saveError) {
          console.error('Failed to save to library', saveError);
        }
      }

      navigate('/player');
    } catch (err) {
      console.error('Processing Error:', err);
      setError(err instanceof Error ? err.message : 'Could not read that link. Try another one.');
    }
  };

  const isLoading = audio.isExtracting;
  
  return (
    <div
      style={{ height: '100dvh', position: 'relative', background: '#000', overflow: 'hidden' }}
    >
      {/* Grain is rendered once globally in AppLayout - see the note there. */}

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
      
      <PullToRefresh 
        scrollableRef={scrollRef}
        style={{ 
          position: 'relative', 
          zIndex: 2, 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
      <div 
        ref={scrollRef}
        style={{ 
          maxWidth: '390px', 
          margin: '0 auto', 
          padding: '0 24px', 
          height: '100%', 
          display: 'flex', 
          flexDirection: 'column',
          overflowY: 'auto',  /* Allow internal scroll if absolutely necessary */
          overflowX: 'hidden',
          width: '100%', // Ensure width prop
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
            v1.0.3
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
          <div 
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
          </div>
          
          {/* Hero Typography */}
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
          
          {/* Subtitle - Funnel Display Light (300) 19.2px */}
          <p 
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
          </p>
        </div>
        
        {/* Input Section - Moved upwards */}
        <div 
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
            onChange={(e) => {
              setUrl(e.target.value);
              if (error) setError(null); // Don't leave a stale error under a new link
            }}
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
              background: isLoading ? 'rgba(250,250,250,0.8)' : '#FAFAFA',
              color: '#0A0A0B',
              border: 'none',
              borderRadius: '50px',
              fontSize: '16px',
              fontWeight: 700,
              cursor: url.trim() && !isLoading ? 'pointer' : 'not-allowed',
              fontFamily: 'Funnel Display, sans-serif',
              opacity: url.trim() ? 1 : 0.7,
              transition: 'opacity 0.2s, transform 0.15s',
              boxShadow: url.trim() ? '0 0 20px rgba(255,255,255,0.15)' : 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            {isLoading && (
              <Loader2 size={18} className="spin" />
            )}
            {isLoading ? 'Extracting...' : 'Start Listening'}
          </button>

          {/* Status line: errors used to fail silently, which read as "nothing happens". */}
          {(isLoading || error) && (
            <p
              role={error ? 'alert' : 'status'}
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                width: '100%',
                color: error ? 'rgba(248,113,113,0.9)' : 'rgba(255,255,255,0.5)',
                fontSize: '13px',
                textAlign: 'center',
                paddingTop: '12px',
                fontFamily: 'Funnel Display, sans-serif',
              }}
            >
              {isLoading ? 'Processing content...' : error}
            </p>
          )}
        </div>
      </div>
      </PullToRefresh>
    </div>
  );
}

// ==================== PLAYER PAGE ====================

/**
 * Karaoke-style transcript.
 *
 * Deliberately plain DOM: this list can be several hundred paragraphs long, and one
 * framer-motion node per line meant hundreds of animation instances re-evaluating on
 * every playback tick. Opacity/scale via CSS transitions gets the same look for free,
 * and `scale` (rather than a font-size change) keeps the active line off the layout path.
 */
const Lyrics = React.memo(function Lyrics({
  chunks,
  activeIndex,
}: {
  chunks: string[];
  activeIndex: number;
}) {
  const scrollRef = useRef<HTMLDivElement>(null);

  // Keep the active line parked ~30% down the viewport, Spotify style.
  useEffect(() => {
    const container = scrollRef.current;
    const activeEl = container?.querySelector<HTMLElement>(`[data-chunk="${activeIndex}"]`);
    if (!container || !activeEl) return;

    const relativeTop = activeEl.getBoundingClientRect().top - container.getBoundingClientRect().top;
    const targetScroll = container.scrollTop + relativeTop - container.clientHeight * 0.3;
    const jumpDistance = Math.abs(targetScroll - container.scrollTop);
    const prefersReducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

    container.scrollTo({
      top: targetScroll,
      // Smooth-scrolling a long seek is slow and looks broken; snap instead.
      behavior: prefersReducedMotion || jumpDistance > container.clientHeight * 3 ? 'auto' : 'smooth',
    });
  }, [activeIndex, chunks]);

  return (
    <div
      ref={scrollRef}
      className="hide-scrollbar"
      style={{
        height: '100%',
        overflowY: 'auto',
        padding: '40px 16px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: chunks.length > 0 ? 'flex-start' : 'center',
        gap: '12px',
      }}
    >
      {chunks.length === 0 ? (
        <p style={{
          fontSize: '18px',
          color: 'rgba(255,255,255,0.4)',
          fontFamily: 'Genos, sans-serif',
          textAlign: 'center',
        }}>
          Nothing playing yet
        </p>
      ) : (
        chunks.map((chunk, index) => {
          const isActive = index === activeIndex;
          const isPast = index < activeIndex;

          return (
            <p
              key={index}
              data-chunk={index}
              style={{
                fontSize: '21px',
                fontWeight: isActive ? 600 : 400,
                lineHeight: 1.4,
                textAlign: 'center',
                maxWidth: '340px',
                marginBottom: '16px',
                color: isActive ? '#fff' : (isPast ? 'rgba(255,255,255,0.2)' : 'rgba(255,255,255,0.4)'),
                fontFamily: 'Funnel Display, sans-serif',
                opacity: isActive ? 1 : (isPast ? 0.4 : 0.3),
                transform: isActive ? 'scale(1.3)' : 'scale(1)',
                transformOrigin: 'center center',
                transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, color 0.3s ease-out',
                willChange: isActive ? 'transform, opacity' : undefined,
              }}
            >
              {chunk}
            </p>
          );
        })
      )}
    </div>
  );
});

/**
 * The only component subscribed to the 60fps playback clock, so the rest of the
 * player (and the several-hundred-line transcript) is untouched by ticking.
 */
function PlayerScrubBar({ duration }: { duration: number }) {
  const audio = useAudio();
  const currentTime = useAudioTime();

  // While dragging we show the dragged position and hold playback, then commit once
  // on release. Seeking on every pointer move restarted the speech engine
  // continuously, which is what made the bar feel like it was fighting back.
  const [scrubTime, setScrubTime] = useState<number | null>(null);
  const scrubTimeRef = useRef(0);
  const resumeAfterScrubRef = useRef(false);

  const handleScrubStart = useCallback(() => {
    resumeAfterScrubRef.current = audio.isPlaying;
    scrubTimeRef.current = audio.getCurrentTime();
    setScrubTime(scrubTimeRef.current);
    if (audio.isPlaying) audio.pause();
  }, [audio]);

  const handleScrub = useCallback((time: number) => {
    scrubTimeRef.current = time;
    setScrubTime(time);
  }, []);

  const handleScrubEnd = useCallback(() => {
    audio.seek(scrubTimeRef.current);
    setScrubTime(null);
    if (resumeAfterScrubRef.current) audio.play();
    resumeAfterScrubRef.current = false;
  }, [audio]);

  const shownTime = scrubTime ?? currentTime;

  return (
    <ScrubBarContainer
      duration={duration}
      value={shownTime}
      onScrub={handleScrub}
      onScrubStart={handleScrubStart}
      onScrubEnd={handleScrubEnd}
    >
      <ScrubBarTimeLabel time={shownTime} style={{ width: '36px', textAlign: 'left', fontSize: '12px', fontFamily: 'Genos, sans-serif' }} />
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
      <ScrubBarTimeLabel time={duration} style={{ width: '36px', textAlign: 'right', fontSize: '12px', fontFamily: 'Genos, sans-serif' }} />
    </ScrubBarContainer>
  );
}

const SPEED_CYCLE = [1, 1.25, 1.5, 2];

function PlayerPage() {
  const navigate = useNavigate();
  const audio = useAudio();

  const isPlaying = audio.isPlaying;
  const totalDuration = audio.duration;

  const skip = useCallback((seconds: number) => {
    const target = audio.getCurrentTime() + seconds;
    audio.seek(Math.max(0, Math.min(totalDuration, target)));
  }, [audio, totalDuration]);

  const cycleSpeed = useCallback(() => {
    const nextIndex = (SPEED_CYCLE.indexOf(audio.playbackSpeed) + 1) % SPEED_CYCLE.length;
    audio.setSpeed(SPEED_CYCLE[nextIndex]);
  }, [audio]);

  // Extractors sometimes bury the real title/author in the first few lines.
  const parsedMeta = useMemo(() => {
    let title = '';
    let author = '';

    for (const chunk of audio.nativeChunks.slice(0, 5)) {
      const clean = chunk.trim();
      if (/^Title\s*:/i.test(clean)) {
        title = clean.replace(/^Title\s*:\s*/i, '').replace(/[.|]$/g, '').trim();
      }
      if (/^Author\s*:/i.test(clean)) {
        author = clean.replace(/^Author\s*:\s*/i, '').replace(/[.|]$/g, '').trim();
      }
    }

    return { title, author };
  }, [audio.nativeChunks]);

  const rawTitle = audio.content?.title;
  const fullTitle = (rawTitle && rawTitle !== 'Untitled') ? rawTitle : (parsedMeta.title || 'Untitled');
  const displayTitle = fullTitle.length > 50 ? fullTitle.slice(0, 47) + '...' : fullTitle;

  const fullAuthor = parsedMeta.author || audio.content?.author || '';
  const displayAuthor = fullAuthor.length > 30 ? fullAuthor.slice(0, 27) + '...' : fullAuthor;

  const source = audio.content?.source || '';
  const readTime = Math.ceil((audio.content?.word_count || 0) / 200); // ~200 wpm

  const handleShare = useCallback(async () => {
    const sourceUrl = audio.url;
    if (!sourceUrl) return;

    const deepLink = `${window.location.origin}/?share=${encodeURIComponent(sourceUrl)}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: audio.content?.title || 'Listen on AudiText',
          text: 'Check out this audio article:',
          url: deepLink,
        });
      } catch {
        /* user dismissed the share sheet */
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(deepLink);
    } catch (err) {
      console.error('Clipboard failed', err);
    }
  }, [audio]);


  return (
    <div 
      style={{ 
        position: 'absolute',
        inset: 0, // Fill parent completely (top: 0, right: 0, bottom: 0, left: 0)
        background: '#050505',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >

      
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
      
      {/* Content Container - Flex Column to fill parent */}
      <div style={{ 
        position: 'relative', 
        zIndex: 2, 
        width: '100%',
        padding: '0 24px 32px 24px',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        boxSizing: 'border-box',
        overflow: 'hidden', // Prevent scrolling
      }}>
        
        {/* Header - pushed up */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'space-between', 
          paddingTop: '32px', 
          marginBottom: '16px',
          flexShrink: 0,
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
        
        {/* Title Section - Flexible height but usually fixed */}
        <div style={{ textAlign: 'center', marginBottom: '16px', flexShrink: 0 }}>

          <h1 style={{ 
            fontSize: '28px', 
            fontWeight: 600, 
            fontFamily: 'Genos, sans-serif',
            marginBottom: '6px',
            lineHeight: 1.2,
            maxWidth: '300px',
            margin: '0 auto 6px',
            textShadow: '0 2px 10px rgba(0,0,0,0.5)',
          }}>
            {displayTitle}
          </h1>
          <p style={{ 
            fontSize: '14px', 
            color: 'rgba(255,255,255,0.5)',
            fontFamily: 'Genos, sans-serif',
          }}>
            {source}
            {displayAuthor ? ` • ${displayAuthor}` : ''}
            {readTime > 0 ? ` • ${readTime} min read` : ''}
          </p>
        </div>
        
        {/* Lyrics/Content Display Section - Premium Centered Design */}
        <div style={{
          flex: 1,
          position: 'relative',
          overflow: 'hidden',
          minHeight: '200px',
        }}>
          {/* Top Fade Gradient - Match pure black background */}
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '80px', // Taller fade for bigger text
            background: 'linear-gradient(to bottom, #050505 0%, transparent 100%)',
            zIndex: 10,
            pointerEvents: 'none',
          }} />
          
          {/* Bottom Fade Gradient - Match pure black background */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '80px', // Taller fade for bigger text
            background: 'linear-gradient(to top, #050505 0%, transparent 100%)',
            zIndex: 10,
            pointerEvents: 'none',
          }} />
          
          <Lyrics chunks={audio.nativeChunks} activeIndex={audio.currentChunkIndex} />
        </div>

        {/* Scrub Bar - margin-top:auto pushes to bottom */}
        <div style={{
          marginTop: 'auto',
          marginBottom: '20px',
          padding: '0 8px',
        }}>
          <PlayerScrubBar duration={totalDuration} />
        </div>
        
        {/* Controls Row */}
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center', 
          gap: '16px',
          marginBottom: '16px',
          flexShrink: 0,
        }}>
          {/* Share Button */}
          <button
            onClick={handleShare}
            aria-label="Share"
            disabled={!audio.url}
            style={{
              width: '44px',
              height: '44px',
              background: 'transparent',
              border: 'none',
              cursor: audio.url ? 'pointer' : 'not-allowed',
              opacity: audio.url ? 1 : 0.35,
              color: 'rgba(255,255,255,0.7)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Share2 size={20} />
          </button>

          {/* Skip Back */}
          <button
            onClick={() => skip(-15)}
            aria-label="Back 15 seconds"
            style={{
              width: '48px',
              height: '40px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SkipBack size={24} fill="#ffffff" />
          </button>

          {/* Play/Pause */}
          <button
            onClick={audio.togglePlay}
            aria-label={isPlaying ? 'Pause' : 'Play'}
            style={{
              width: '64px', 
              height: '56px', 
              background: 'transparent',
              border: 'none', 
              cursor: 'pointer', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
            }}
          >
            {isPlaying ? (
              <Pause size={48} fill="#ffffff" color="#ffffff" />
            ) : (
              <Play size={48} fill="#ffffff" color="#ffffff" style={{ marginLeft: '4px' }} />
            )}
          </button>
          
          {/* Skip Forward */}
          <button
            onClick={() => skip(15)}
            aria-label="Forward 15 seconds"
            style={{
              width: '48px',
              height: '40px',
              background: 'transparent',
              border: 'none',
              cursor: 'pointer',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SkipForward size={24} fill="#ffffff" />
          </button>

          {/* Speed Toggle */}
          <button
            onClick={cycleSpeed}
            aria-label={`Playback speed ${audio.playbackSpeed}x`}
            style={{
              width: '44px',
              height: '44px',
              background: 'transparent',
              border: 'none', 
              cursor: 'pointer', 
              color: '#fff',
              fontSize: '14px',
              fontWeight: 600,
              fontFamily: 'Genos, sans-serif',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {audio.playbackSpeed}x
          </button>
        </div>
        



        </div>
      </div>
  );
}


type FilterType = 'All' | 'Favorites' | 'Saved' | 'Tweets' | 'Articles';
const FILTER_OPTIONS: FilterType[] = ['All', 'Favorites', 'Saved', 'Tweets', 'Articles'];

// Performance: Memoized swipeable item to prevent re-renders
const SwipeableItem = React.memo(({ 
  item, 
  onDelete, 
  children 
}: { 
  item: LibraryItem; 
  onDelete: (id: string) => void; 
  children: React.ReactNode 
}) => {
  const controls = useAnimation();
  
  const handleDragEnd = useCallback(async (_: PointerEvent | MouseEvent | TouchEvent, info: PanInfo) => {
    const offset = info.offset.x;
    if (offset < -100) {
      // Deleting
      await controls.start({ x: -100 });
    } else {
      // Snap back
      controls.start({ x: 0 });
    }
  }, [controls]);

  const handleDelete = useCallback(() => {
    // Animate out then delete
    controls.start({ height: 0, opacity: 0, marginBottom: 0 }).then(() => {
      onDelete(item.id);
    });
  }, [controls, onDelete, item.id]);

  return (
    <motion.div 
      style={{ position: 'relative', overflow: 'hidden' }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Foreground - Content + Delete Button Attachment */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -100, right: 0 }}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={controls}
        style={{
          background: 'transparent',
          position: 'relative',
          zIndex: 1,
          x: 0,
          display: 'flex',
        }}
      >
        <div style={{ flex: 1, width: '100%' }}>
          {children}
        </div>

        {/* Delete Button - Attached to the right side */}
        <div style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          right: -100,
          width: '100px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}>
           <button
            onClick={handleDelete}
            style={{
              background: 'none',
              border: 'none',
              color: '#F87171',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '4px',
              cursor: 'pointer',
            }}
          >
            <Trash2 size={20} />
            <span style={{ fontSize: '10px', fontFamily: 'Funnel Display' }}>Delete</span>
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
});

function LibraryPage() {
  const audio = useAudio();
  const navigate = useNavigate();
  const scrollRef = useRef<HTMLDivElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterType>('All');
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isGuest, setIsGuest] = useState(false);

  const loadItems = useCallback(async () => {
    try {
      setError(null);
      setLoading(true);

      const { data: { session } } = await supabase.auth.getSession();
      setIsGuest(!session);
      if (!session) {
        setItems([]);
        return;
      }

      setItems(await getLibraryItems());
    } catch (error) {
      console.error('Failed to load library', error);
      setError('Could not connect to Library.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  // Calculate time left from progress and duration
  const getTimeLeft = (wordCount: number, progress: number) => {
    const mins = Math.ceil((wordCount || 1000) / 200); // 200 wpm estimate
    const left = Math.ceil(mins * (1 - progress / 100));
    return left > 0 ? `${left}m left` : 'Done';
  };
  
  // Toggle favorite
  const handleToggleFavorite = useCallback(async (id: string, currentStatus: boolean) => {
    // Optimistic update
    setItems(prev => prev.map(item => 
      item.id === id ? { ...item, is_favorite: !currentStatus } : item
    ));
    
    try {
      await toggleFavorite(id, !currentStatus);
    } catch (error) {
      console.error('Failed to toggle favorite', error);
      // Revert on error
      loadItems();
    }
  }, [loadItems]);

  // Delete item
  const handleDelete = useCallback(async (id: string) => {
    // Optimistic update
    setItems(prev => prev.filter(item => item.id !== id));

    try {
      await deleteLibraryItem(id);
    } catch (error) {
      console.error('Failed to delete item', error);
      // Revert/Reload handles basic error case
      loadItems();
    }
  }, [loadItems]);

  // Filter items by search and active filter
  const filteredItems = items.filter(item => {
    const matchesSearch = (item.title || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                          (item.source || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    if (!matchesSearch) return false;
    
    switch (activeFilter) {
      case 'Favorites': return item.is_favorite;
      case 'Saved': return false; // Offline not implemented yet
      case 'Tweets': return item.platform === 'twitter' || item.platform === 'x';
      case 'Articles': return item.platform !== 'twitter' && item.platform !== 'x';
      default: return true;
    }
  });
  
  // Get platform logo/icon
  const getPlatformLogo = (platform: string) => {
    switch (platform) {
      case 'x':
      case 'twitter':
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

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/library` }
      });
      if (error) throw error;
    } catch (e) {
      alert((e as Error).message);
    }
  };



  return (
    <div 
      style={{ 
        height: '100dvh', 
        position: 'relative', 
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >

      
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
      <PullToRefresh
        scrollableRef={scrollRef}
        onRefresh={loadItems}
        style={{
          position: 'relative', 
          zIndex: 1, 
          width: '100%',
          maxWidth: '390px', 
          margin: '0 auto', 
          padding: '0 24px', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        
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
            flex: 1, // Fill remaining space
            background: 'rgba(20, 20, 24, 0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            padding: '20px',
            marginBottom: 'calc(120px + env(safe-area-inset-bottom))', // Adjusted spacing
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // Clip content to card
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
          
          {/* Article List - Scrollable Internal */}
          <div
            ref={scrollRef}
            className="library-list-content"
            style={{
              flex: 1, 
              overflowY: 'auto',
              minHeight: 0, // CRITICAL for nested flex scrolling
              width: '100%',
              paddingRight: isGuest ? 0 : '8px',
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            {isGuest ? (
               <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '24px' }}>
                    <div>
                        <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '8px', fontFamily: 'Funnel Display, sans-serif' }}>
                            Sign In to Sync
                        </h2>
                        <p style={{ fontSize: '15px', color: 'rgba(255,255,255,0.5)', maxWidth: '280px', margin: '0 auto', lineHeight: 1.5 }}>
                            Access your collection across all devices and save new articles forever.
                        </p>
                    </div>
                    
                    <button
                        onClick={handleGoogleLogin}
                        style={{
                            padding: '16px 28px',
                            background: 'white',
                            color: 'black',
                            borderRadius: '50px',
                            border: 'none',
                            fontSize: '16px',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontFamily: 'Funnel Display, sans-serif',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
                        }}
                    >
                       <svg width="18" height="18" viewBox="0 0 24 24"><path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/><path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/><path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/><path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/></svg>
                       Sign In with Google
                    </button>
                    
                    <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.3)', marginTop: '8px' }}>
                        Guest listening history is not saved.
                    </p>
                </div>
            ) : loading ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
                <Loader2 className="spin" size={24} style={{ color: 'rgba(255,255,255,0.3)' }} />
              </div>
            ) : error || filteredItems.length === 0 ? (
              <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.4)', padding: '40px 0', fontSize: '14px' }}>
                {error ? error : 'No items found'}
              </div>
            ) : (
              <AnimatePresence>
                {filteredItems.map((item, i) => (
                  <SwipeableItem key={item.id} item={item} onDelete={handleDelete}>
                    <div 
                      onClick={() => {
                        audio.playContent({
                          title: item.title || 'Untitled',
                          content: item.content || '',
                          source: item.source,
                          platform: item.platform || 'web',
                          word_count: item.word_count,
                          author: item.author || undefined,
                          ai_cleaned: true
                        // Honour the speed the user picked in Settings, and pass
                        // item.id / item.url for progress sync & sharing.
                        }, audio.playbackSpeed, item.id, item.url);
                        navigate('/player');
                      }}
                      style={{ 
                        display: 'flex', 
                        alignItems: 'flex-start', 
                        gap: '12px', 
                        padding: '14px 0', 
                        background: 'transparent', 
                        borderTop: i > 0 ? '1px solid rgba(255,255,255,0.06)' : 'none',
                        cursor: 'pointer' 
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
                        flexShrink: 0 
                      }}>
                        {getPlatformLogo(item.platform || 'web')}
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
                              {item.title || 'Untitled'}
                            </p>
                            <p style={{ 
                              fontSize: '12px', 
                              color: 'rgba(255,255,255,0.4)',
                              fontFamily: 'Funnel Display, sans-serif',
                            }}>
                              {item.source} · {item.platform === 'twitter' || item.platform === 'x' ? 'Tweet' : 'Article'}
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
                              ? getTimeLeft(item.word_count, item.progress)
                              : `${Math.ceil((item.word_count || 1000) / 200)} min`
                            }
                          </span>
                          
                          {/* Favorite Star */}
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(item.id, item.is_favorite);
                            }}
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
                              fill={item.is_favorite ? '#F59E0B' : 'none'}
                              stroke={item.is_favorite ? '#F59E0B' : 'rgba(255,255,255,0.3)'}
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
                          {/* Played portion */}
                          <div style={{
                            flex: item.progress || 1,
                            height: '3px',
                            borderRadius: '2px',
                            background: item.progress > 0 
                              ? 'linear-gradient(90deg, #F59E0B, #FBBF24)' 
                              : 'rgba(255,255,255,0.15)',
                          }} />
                          {/* Remaining portion */}
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
                  </SwipeableItem>
                ))}
              </AnimatePresence>
            )}
          </div>
        </div>
      </PullToRefresh>
    </div>
  );
}

// ==================== SETTINGS PAGE ====================
// Green accent colors matching home screen dot
const SETTINGS_COLORS = {
  primary: '#4ADE80',    // Green-400 (matches home dot)
  secondary: '#22C55E',  // Green-500
  tertiary: '#86EFAC',   // Green-300
};

// Defined at module scope: declaring it inside SettingsPage created a brand new
// component type on every render, so React unmounted and remounted the switch
// (killing its transition) each time any setting changed.
function Toggle({ enabled, onToggle }: { enabled: boolean; onToggle: () => void }) {
  return (
    <button
      onClick={onToggle}
      role="switch"
      aria-checked={enabled}
      style={{
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        background: enabled ? SETTINGS_COLORS.primary : 'rgba(255,255,255,0.15)',
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
}

function SettingsPage() {
  const colors = SETTINGS_COLORS;
  const audio = useAudio(); // Connect to real audio context
  
  // Persistent State
  const [autoArchive, setAutoArchive] = useState(() => {
    return localStorage.getItem('audiotext_auto_archive') === 'true';
  });
  const [hapticsEnabled, setHapticsEnabled] = useState(() => {
    const stored = localStorage.getItem('audiotext_haptics');
    return stored === null ? true : stored === 'true'; // Default true
  });
  const [showCacheCleared, setShowCacheCleared] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // setSpeed clamps, persists, and re-applies the rate to any active playback.
  const handleSpeedChange = (speed: number) => {
    audio.setSpeed(Math.round(speed * 100) / 100);
  };
  
  // Persist other settings
  const toggleAutoArchive = () => {
    const newValue = !autoArchive;
    setAutoArchive(newValue);
    localStorage.setItem('audiotext_auto_archive', String(newValue));
  };

  const toggleHaptics = () => {
    const newValue = !hapticsEnabled;
    setHapticsEnabled(newValue);
    localStorage.setItem('audiotext_haptics', String(newValue));
    if (newValue && navigator.vibrate) navigator.vibrate(50);
  };
  
  const handleClearCache = () => {
    // Drop the cached article/playback snapshot but keep user preferences.
    audio.reset();
    localStorage.removeItem('audiotext_native_content_cache');

    setShowCacheCleared(true);
    setTimeout(() => setShowCacheCleared(false), 2000);
    if (hapticsEnabled && navigator.vibrate) navigator.vibrate([50, 50, 50]);
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Clear local settings if desired, or keep them. 
      // We'll reload to ensure clean state and show /auth or home as guest.
      window.location.href = '/auth'; 
    } catch (e) {
      console.error('Sign out error', e);
    }
  };
  
  return (
    <div 
      style={{ 
        height: '100dvh', 
        position: 'relative', 
        background: '#000',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
      }}
    >
      
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
      <PullToRefresh
        scrollableRef={scrollRef}
        style={{ 
          position: 'relative', 
          zIndex: 1, 
          width: '100%',
          maxWidth: '390px', 
          margin: '0 auto', 
          padding: '0 24px', 
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          boxSizing: 'border-box',
        }}
      >
        
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
          ref={scrollRef}
          className="hide-scrollbar"
          style={{ 
            flex: 1,
            background: 'rgba(20, 20, 24, 0.85)',
            backdropFilter: 'blur(20px)',
            borderRadius: '24px',
            border: '1.5px solid rgba(255, 255, 255, 0.2)',
            padding: '20px',
            marginBottom: 'calc(140px + env(safe-area-inset-bottom))',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            overflowY: 'auto',
          }}
        >
          {/* Playback Group */}
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>Playback</p>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', overflow: 'hidden' }}>
              {/* Playback Speed - Free Scrub Bar */}
              <div style={{ padding: '14px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '12px' }}>
                  <Play size={18} style={{ color: 'rgba(255,255,255,0.4)', marginRight: '12px' }} />
                  <span style={{ flex: 1, fontSize: '15px', fontFamily: 'Funnel Display, sans-serif' }}>Default Speed</span>
                </div>
                
                <ScrubBar
                  value={audio.playbackSpeed}
                  min={MIN_SPEED}
                  max={MAX_SPEED}
                  step={0.05}
                  onChange={handleSpeedChange}
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
                <Toggle enabled={autoArchive} onToggle={toggleAutoArchive} />
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
          <div style={{ marginBottom: '20px' }}>
            <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>System</p>
            <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', overflow: 'hidden' }}>
              {/* Haptics */}
              <div style={{ display: 'flex', alignItems: 'center', padding: '14px' }}>
                <Sparkles size={18} style={{ color: 'rgba(255,255,255,0.4)', marginRight: '12px' }} />
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: '15px', display: 'block', fontFamily: 'Funnel Display, sans-serif' }}>Haptics</span>
                  <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.4)' }}>Vibration feedback</span>
                </div>
                <Toggle enabled={hapticsEnabled} onToggle={toggleHaptics} />
              </div>
            </div>
            </div>

          {/* Account Group */}
          <div>
             <p style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '10px', paddingLeft: '4px' }}>Account</p>
             <div style={{ background: 'rgba(255,255,255,0.03)', borderRadius: '14px', overflow: 'hidden' }}>
                <button
                    onClick={handleSignOut}
                    style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        padding: '16px',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        textAlign: 'left'
                    }}
                >
                    <LogOut size={18} style={{ color: '#F87171', marginRight: '12px' }} />
                    <span style={{ flex: 1, fontSize: '15px', fontFamily: 'Funnel Display, sans-serif', color: '#F87171', fontWeight: 500 }}>Sign Out</span>
                </button>
             </div>
          </div>

          {/* Danger Zone */}
          <div style={{ marginTop: '32px', paddingTop: '24px', borderTop: '1px solid rgba(255,255,255,0.1)' }}>
               <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'rgba(255, 90, 90, 0.8)', marginBottom: '16px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                 Danger Zone
               </h3>
               
               <button
                onClick={async () => {
                   if (confirm('Are you sure you want to delete ALL items from your library? This cannot be undone.')) {
                       try {
                           await clearLibrary();
                           setShowCacheCleared(true); // Reuse feedback toast
                           setTimeout(() => setShowCacheCleared(false), 2000);
                           if (hapticsEnabled && navigator.vibrate) navigator.vibrate([100, 50, 100]);
                       } catch (e) {
                           console.error("Failed to clear library", e);
                           alert("Failed to clear library. Please try again.");
                       }
                   }
                }}
                style={{
                  width: '100%',
                  padding: '16px',
                  background: 'rgba(255, 50, 50, 0.1)',
                  border: '1px solid rgba(255, 50, 50, 0.2)',
                  borderRadius: '16px',
                  color: '#ff6b6b',
                  fontSize: '16px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  fontFamily: 'Funnel Display, sans-serif',
                  transition: 'background 0.2s',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px'
                }}
              >
                <Trash2 size={18} />
                Clear All Library Items
              </button>
            </div>
        </div>
      </PullToRefresh>
    </div>
  );
}

// ==================== PHONE MOCKUP WRAPPER (Desktop Only) ====================
const DESKTOP_QUERY = '(min-width: 1024px)';

function PhoneMockup({ children }: { children: React.ReactNode }) {
  // Resolved during the first render so desktop users never see the mobile layout flash.
  const [isDesktop, setIsDesktop] = useState(() => window.matchMedia(DESKTOP_QUERY).matches);
  const location = useLocation();
  const isPlayerPage = location.pathname === '/player';

  // matchMedia fires only when the breakpoint is actually crossed, unlike a resize
  // listener that used to call setState on every pixel of a window drag.
  useEffect(() => {
    const query = window.matchMedia(DESKTOP_QUERY);
    const onChange = (e: MediaQueryListEvent) => setIsDesktop(e.matches);
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
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
      <Suspense fallback={null}>
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
      </Suspense>
      
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
              overflow: 'hidden', // FIXED: Prevent scrolling on player page
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
const NOOP = () => {};

/** True while the 7-day guest pass is still valid; clears it once it expires. */
function hasValidGuestPass() {
  const expiry = localStorage.getItem('audiotext_guest_expiry');
  if (!expiry) return false;
  if (Date.now() < Number(expiry)) return true;
  localStorage.removeItem('audiotext_guest_expiry');
  return false;
}

function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const audio = useAudio();
  const processedShareRef = useRef<string | null>(null);

  // Latest values for effects that must not re-run on every render.
  const navigateRef = useRef(navigate);
  const audioRef = useRef(audio);
  const pathnameRef = useRef(location.pathname);

  useEffect(() => {
    navigateRef.current = navigate;
    audioRef.current = audio;
    pathnameRef.current = location.pathname;
  });

  // Deep Link Handler (Share Feature).
  // Depends on the query string alone - it used to list `audio`, whose identity
  // changed on every playback tick, so this ran ~60x per second while playing.
  useEffect(() => {
    const shareUrl = new URLSearchParams(location.search).get('share');
    if (!shareUrl || shareUrl === processedShareRef.current) return;

    processedShareRef.current = shareUrl;
    const decodedUrl = decodeURIComponent(shareUrl);

    // Strip the param so a refresh doesn't re-trigger extraction.
    const cleanUrl = window.location.protocol + '//' + window.location.host + window.location.pathname;
    window.history.replaceState({ path: cleanUrl }, '', cleanUrl);

    audioRef.current.processUrl(decodedUrl)
      .then(() => navigateRef.current('/player'))
      .catch(err => {
        console.error('Failed to process deep link', err);
        navigateRef.current('/');
      });
  }, [location.search]);

  // Auth gate + OAuth redirect handling.
  // Mount-only: this previously re-ran on every navigation, firing a fresh
  // getSession() request and re-subscribing to auth changes each time.
  useEffect(() => {
    let cancelled = false;

    const checkAuthStatus = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (cancelled) return;

      const isAuthPage = pathnameRef.current === '/auth';
      const hasAccess = !!session || hasValidGuestPass();

      if (!hasAccess && !isAuthPage) navigateRef.current('/auth', { replace: true });
      else if (hasAccess && isAuthPage) navigateRef.current('/', { replace: true });
    };

    checkAuthStatus();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN') {
        // Clear the OAuth fragment, then leave the auth page.
        if (window.location.hash.includes('access_token')) {
          navigateRef.current(pathnameRef.current, { replace: true });
        }
        if (pathnameRef.current === '/auth') navigateRef.current('/', { replace: true });
      }

      if (event === 'SIGNED_OUT') {
        localStorage.removeItem('audiotext_guest_expiry');
        navigateRef.current('/auth', { replace: true });
      }
    });

    return () => {
      cancelled = true;
      subscription.unsubscribe();
    };
  }, []);

  const appContent = (
    <div style={{ background: '#000', minHeight: '100vh' }}>
      <Routes location={location}>
        <Route path="/" element={<HomePage onVisit={NOOP} />} />
        <Route path="/player" element={<PlayerPage />} />
        <Route path="/auth" element={<AuthPage />} />
        <Route path="/library" element={<LibraryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>

      {/* Single global grain layer. Each page used to mount its own on top of this
          one, so two full-screen canvas loops ran at all times. */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Noise patternAlpha={15} patternSize={100} />
      </div>

      <Navigation />
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
      <AudioProvider>
        <AppLayout />
      </AudioProvider>
    </BrowserRouter>
  );
}

export default App;

