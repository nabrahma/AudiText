# AudiText - Implementation Status

## Overview
React Web PWA for converting articles, tweets, and web content into audio. Features premium "Reactive Noir" design with animated WebGL backgrounds, chrome effects, and dynamic color palettes.

**Last Updated:** 2025-12-17 18:48 IST  
**Status:** Frontend Complete ✅ | Backend Required 🚧

---

## 📁 Project Structure

```
AudiText/
├── src/
│   ├── App.tsx                    # All page components + routing
│   ├── index.css                  # Theme, typography, animations
│   ├── main.tsx                   # Entry point
│   └── components/
│       ├── DarkVeil.tsx           # WebGL CPPN shader background
│       ├── Dither.tsx             # Animated dither pattern (optimized)
│       ├── DotGrid.tsx            # Interactive dot grid (GSAP, optimized)
│       ├── Noise.tsx              # Film grain overlay
│       ├── Orb.tsx                # ElevenLabs audio visualizer (Three.js)
│       ├── ScrubBar.tsx           # Reusable scrub bar component
│       ├── ShimmeringText.tsx     # Animated gradient text
│       └── icons/                 # Lucide-style custom icons
├── public/
├── package.json
└── vite.config.ts
```

---

## 📱 Frontend Features (Complete)

### 1. Home Page (`/`)
| Feature | Implementation |
|---------|----------------|
| DarkVeil Background | WebGL CPPN shader with palette-synced hue shifts |
| Rotating Words | Animated cycling: Tweets, Articles, Blogs, News, Threads, Posts |
| URL Input | Glassmorphic pill with placeholder text |
| Start Listening | Primary CTA button navigates to player |
| Noise Overlay | Film grain texture overlay |

### 2. Player Page (`/player`)
| Feature | Implementation |
|---------|----------------|
| Dither Background | Optimized canvas animation (25% resolution, 20fps) |
| Orb Visualizer | ElevenLabs-style Three.js animated orb (200px) |
| Scrub Bar | Functional seeker with time labels (0:45 / 3:00) |
| Speed Control | Cycle: 1x → 1.25x → 1.5x → 2x |
| Lyrics Display | Sticky header with fade, active line highlighting |
| Content Source | Article title, source, word count display |

### 3. Library Page (`/library`)
| Feature | Implementation |
|---------|----------------|
| Filter Tabs | All, Favorites, Saved, Tweets, Articles |
| Item Cards | Progress bars, platform icons, favorite toggle |
| Sample Data | 5 demo items (Twitter, Medium, Substack, Web) |
| Scroll | Hidden scrollbar with scroll capability |

### 4. Settings Page (`/settings`)
| Feature | Implementation |
|---------|----------------|
| Default Voice | Voice selection (Nova, etc.) |
| Playback Speed | ScrubBar component (0.5x - 2.5x) |
| Auto-Archive | Toggle with 30-day description |
| Clear Cache | Action button |
| Haptics | Toggle switch |
| Hidden Scrollbar | CSS scrollbar hiding |

### 5. Desktop Phone Mockup
| Feature | Implementation |
|---------|----------------|
| iPhone Frame | CSS-only metallic frame (360x740px) |
| DotGrid Background | Interactive GSAP dot grid with spatial partitioning |
| Conditional Scaling | Player page 100%, other pages scaled 0.88 |
| Footer | "Made with ❤️ by nabaskar" (bottom-right) |

---

## 🎨 Design System

### Color Palettes
| Palette | Primary | Secondary | Hue Shift |
|---------|---------|-----------|-----------|
| Ember | #FF6B35 | #FF8C42 | 0° |
| Sunset | #E63946 | #FF6B6B | 30° |
| Aurora | #00E5A0 | #00C9A7 | 120° |
| Violet | #A855F7 | #C084FC | 270° |
| Gold | #F59E0B | #FBBF24 | 45° |

### Typography
| Element | Font | Weight |
|---------|------|--------|
| Headings | Funnel Display | 800 |
| Body | Funnel Display | 300-400 |
| Pills/Labels | Genos | 400 Italic |

### Performance Optimizations
- **Dither**: 25% resolution, 20fps, sin lookup table, buffer reuse
- **DotGrid**: Spatial partitioning, pre-rendered sprites, native lerp
- **DPR Capping**: Max 2x for all canvas elements

---

## 🚧 Backend Requirements

### Core APIs Needed

#### 1. Content Extraction API
```
POST /api/extract
Body: { url: string }
Response: { title, content, wordCount, source, author, publishDate }
```
- Extract text from URLs (articles, tweets, threads) ✅
- Support: Twitter/X, Medium, Substack, general websites ✅
- HTML parsing and content cleaning (AI Powered) ✅

#### 2. Text-to-Speech Engine
- **Engine**: Browser Native TTS (SpeechSynthesis) 🤖
- **Cost**: Free & Unlimited ✅
- **Features**: 
  - Sentence-level Chunking for seeking
  - Speed control (0.5x - 2.5x)
  - Client-side generation (Privacy focused)
  - No API keys required

#### 3. User Library API
```
GET /api/library
POST /api/library
PATCH /api/library/:id
DELETE /api/library/:id
```
- CRUD operations for saved content
- Track listening progress
- Favorite/archive functionality

#### 4. User Settings API
```
GET /api/settings
PUT /api/settings
```
- Default voice preference
- Default playback speed
- Auto-archive settings

---

## 🔐 User Authentication (Required)

### Why Authentication?
- Store user's listening history
- Sync library across devices
- Save user preferences
- ElevenLabs API quotas per user

### Recommended Approach

#### Option A: Supabase Auth (Recommended)
- Email/Password + Social logins (Google, GitHub)
- Built-in PostgreSQL for user data
- Row-level security for library items
- Easy integration with React

#### Option B: Firebase Auth
- Email/Password + Social logins
- Firestore for user data
- Real-time sync capability

#### Option C: Custom JWT
- Self-hosted auth server
- More control, more complexity

### Auth Flow
1. Sign up / Sign in page
2. Email verification (optional)
3. JWT tokens stored in localStorage
4. Protected API routes
5. Refresh token rotation

---

## 📋 Implementation Priority

### Phase 1: Backend Foundation
- [ ] Set up Node.js/Express or Next.js API routes
- [ ] User authentication (Supabase recommended)
- [ ] Database schema (users, library_items, settings)

### Phase 2: Core Features
- [ ] Content extraction API (URL → text)
- [ ] ElevenLabs TTS integration
- [ ] Library CRUD operations

### Phase 3: Integration
- [ ] Connect frontend to backend APIs
- [ ] Audio streaming in player
- [ ] Real library data (replace sample data)
- [ ] Persist user settings

### Phase 4: Polish
- [ ] PWA: Service worker, offline support
- [ ] Error handling and loading states
- [ ] Rate limiting and quotas
- [ ] Analytics and logging

---

## 🚀 Running

```bash
# Development
npm run dev -- --host

# Build
npm run build
```

**Local:** http://localhost:5173/

---

## � Dependencies

### Current (Frontend)
- React 19 + TypeScript
- Vite
- React Router DOM
- Three.js + @react-three/fiber (Orb)
- GSAP (DotGrid animations)
- OGL (DarkVeil shader)
- Lucide React (icons)

### Required (Backend)
- Express.js or Next.js API routes
- Supabase (auth + database) or Firebase
- ElevenLabs SDK
- Cheerio/Puppeteer (content extraction)
- Node.js stream handling

---

## 💾 Checkpoints

| Version | Date | Description |
|---------|------|-------------|
| v1 | 2025-12-13 | Home page complete |
| v2 | 2025-12-17 | All pages + desktop mockup + optimizations |
