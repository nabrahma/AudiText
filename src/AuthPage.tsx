import { type PaletteKey, PALETTE_HUE_SHIFTS } from '@/lib/theme'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from './lib/supabase'

// Shared Components (Importing directly from App's dependencies references would be better, 
// strictly we should move these to separate files, but for now I assume they are globally available or I import them if they are exported from components)
// Actually App.tsx imports them from '@/components/...'. I will do the same.
import DarkVeil from '@/components/DarkVeil'
import Noise from '@/components/Noise'
import ShimmeringText from '@/components/ShimmeringText'
import { Loader2 } from 'lucide-react'

// Simple Google Icon SVG
const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
    <g transform="matrix(1, 0, 0, 1, 27.009001, -39.23856)">
      <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.229 -9.424 56.479 -10.684 57.329 L -10.684 60.329 L -6.824 60.329 C -4.564 58.239 -3.264 55.159 -3.264 51.509 Z" />
      <path fill="#34A853" d="M -14.754 63.239 C -11.514 63.239 -8.804 62.159 -6.824 60.329 L -10.684 57.329 C -11.764 58.049 -13.134 58.489 -14.754 58.489 C -17.884 58.489 -20.534 56.379 -21.484 53.529 L -25.464 53.529 L -25.464 56.619 C -23.494 60.539 -19.444 63.239 -14.754 63.239 Z" />
      <path fill="#FBBC05" d="M -21.484 53.529 C -21.734 52.809 -21.864 52.039 -21.864 51.239 C -21.864 50.439 -21.724 49.669 -21.484 48.949 L -21.484 45.859 L -25.464 45.859 C -26.284 47.479 -26.754 49.299 -26.754 51.239 C -26.754 53.179 -26.284 54.999 -25.464 56.619 L -21.484 53.529 Z" />
      <path fill="#EA4335" d="M -14.754 43.989 C -12.984 43.989 -11.404 44.599 -10.154 45.789 L -6.734 42.369 C -8.804 40.429 -11.514 39.239 -14.754 39.239 C -19.444 39.239 -23.494 41.939 -25.464 45.859 L -21.484 48.949 C -20.534 46.099 -17.884 43.989 -14.754 43.989 Z" />
    </g>
  </svg>
)

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


export function AuthPage({ palette }: { palette: PaletteKey }) {
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: `${window.location.origin}/library`
        }
      })
      if (error) throw error
    } catch (error) {
      alert('Error logging in: ' + (error as Error).message)
      setLoading(false)
    }
  }

  const handleGuest = () => {
    // Set 7-day expiry for guest mode
    const expiry = Date.now() + 7 * 24 * 60 * 60 * 1000;
    localStorage.setItem('audiotext_guest_expiry', expiry.toString());
    navigate('/');
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', background: '#000' }}>
      
      {/* DarkVeil Background */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, transform: 'rotate(180deg)' }}>
        <DarkVeil hueShift={PALETTE_HUE_SHIFTS[palette]} speed={0.6} noiseIntensity={0.15} warpAmount={0.5} />
      </div>
      
      {/* Noise Overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}>
        <Noise patternAlpha={15} patternSize={100} />
      </div>
      
      {/* Gradient Overlay */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '50vh', background: 'linear-gradient(to bottom, #000 0%, transparent 100%)', zIndex: 1, pointerEvents: 'none' }} />

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
        
        {/* Header / Version */}
        <div style={{ paddingTop: '24px', textAlign: 'center' }}>
          <span className="genos-font" style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)', fontWeight: 400, fontStyle: 'italic', letterSpacing: '0.05em' }}>
            v1.0
          </span>
        </div>

        {/* content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingBottom: '25vh' }}>
          
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

        {/* Actions */}
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          style={{ position: 'absolute', bottom: '140px', left: '24px', right: '24px', display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '390px', margin: '0 auto' }}
        >
            <button
                onClick={handleGoogleLogin}
                disabled={loading}
                style={{
                    width: '100%',
                    padding: '18px',
                    background: 'white',
                    color: '#0A0A0B',
                    border: 'none',
                    borderRadius: '50px',
                    fontSize: '16px',
                    fontWeight: 700,
                    cursor: loading ? 'wait' : 'pointer',
                    fontFamily: 'Funnel Display, sans-serif',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                    opacity: loading ? 0.8 : 1,
                    transition: 'transform 0.1s',
                    boxShadow: '0 0 20px rgba(255,255,255,0.2)'
                }}
                onMouseDown={e => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                {loading ? <Loader2 className="animate-spin" color="black" /> : <GoogleIcon />}
                {loading ? 'Connecting...' : 'Continue with Google'}
            </button>

            <button
                onClick={handleGuest}
                style={{
                    width: '100%',
                    padding: '18px',
                    background: 'rgba(255,255,255,0.05)',
                    color: 'rgba(255,255,255,0.6)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '50px',
                    fontSize: '15px',
                    fontWeight: 500,
                    cursor: 'pointer',
                    fontFamily: 'Funnel Display, sans-serif',
                }}
            >
                Continue as Guest
            </button>
        </motion.div>

      </div>
    </div>
  )
}
