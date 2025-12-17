<p align="center">
  <img src="docs/screenshots/home-page.png" alt="AudiText Home" width="300">
</p>

<h1 align="center">🎧 AudiText</h1>

<p align="center">
  <strong>Transform articles, tweets, and web content into immersive audio experiences</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#roadmap">Roadmap</a> •
  <a href="#contributing">Contributing</a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react" alt="React 19">
  <img src="https://img.shields.io/badge/TypeScript-5.6-3178C6?style=flat-square&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Vite-7.2-646CFF?style=flat-square&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Three.js-WebGL-000000?style=flat-square&logo=three.js" alt="Three.js">
  <img src="https://img.shields.io/badge/License-MIT-green?style=flat-square" alt="MIT License">
</p>

---

## 🎯 Overview

**AudiText** is a Progressive Web App (PWA) that converts text content from articles, tweets, threads, and websites into high-quality audio using AI-powered text-to-speech. Designed with a premium "Reactive Noir" aesthetic, it combines cutting-edge WebGL animations with an intuitive mobile-first interface.

### Why AudiText?

- 📱 **Mobile-First Design** — Optimized for on-the-go listening
- 🎨 **Premium UI/UX** — WebGL shaders, glassmorphism, and smooth animations
- ⚡ **Fast & Responsive** — 60fps animations with performance optimizations
- 🔊 **High-Quality TTS** — Powered by ElevenLabs AI voices
- 📚 **Content Library** — Save, organize, and track your listening history

---

## ✨ Features

### 🏠 Content Extraction
- Paste any URL (articles, tweets, threads)
- Automatic content parsing and cleaning
- Support for Twitter/X, Medium, Substack, and general websites

### 🎧 Audio Player
- ElevenLabs-powered text-to-speech
- Animated orb visualizer (Three.js)
- Variable playback speed (0.5x - 2.5x)
- Seek/scrub functionality
- Lyrics-style text display with active line highlighting

### 📚 Personal Library
- Save content for later
- Track listening progress
- Filter by favorites, content type
- Platform-specific icons

### ⚙️ Customizable Settings
- Default voice selection
- Default playback speed
- Auto-archive preferences
- Haptic feedback toggle

### 🖥️ Desktop Experience
- iPhone mockup frame
- Interactive dot grid background
- Responsive design adaptation

---

## 📸 Screenshots

<p align="center">
  <img src="docs/screenshots/home-page.png" alt="Home Page" width="280">
  <img src="docs/screenshots/library-page.png" alt="Library Page" width="280">
  <img src="docs/screenshots/settings-page.png" alt="Settings Page" width="280">
</p>

<p align="center">
  <em>Left to right: Home (URL input) • Library (saved content) • Settings (preferences)</em>
</p>

---

## 🛠️ Tech Stack

### Frontend
| Technology | Purpose |
|------------|---------|
| **React 19** | UI framework with concurrent features |
| **TypeScript** | Type-safe development |
| **Vite** | Fast development and bundling |
| **React Router** | Client-side routing |
| **Three.js** | 3D orb visualizer (WebGL) |
| **GSAP** | High-performance animations |
| **OGL** | Lightweight WebGL shader library |

### Styling & Design
| Technology | Purpose |
|------------|---------|
| **CSS Variables** | Dynamic theming |
| **Glassmorphism** | Modern UI effects |
| **Custom Fonts** | Funnel Display, Genos |
| **Lucide React** | Icon library |

### Backend (Planned)
| Technology | Purpose |
|------------|---------|
| **Node.js/Express** | API server |
| **Supabase** | Authentication & database |
| **ElevenLabs API** | Text-to-speech |
| **Cheerio/Puppeteer** | Content extraction |

---

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/AudiText.git
cd AudiText

# Install dependencies
npm install

# Start development server
npm run dev -- --host

# Open in browser
# http://localhost:5173
```

### Build for Production

```bash
npm run build
npm run preview
```

---

## 🏗️ Architecture

```
AudiText/
├── src/
│   ├── App.tsx                 # Main app with all pages
│   ├── index.css               # Global styles & animations
│   ├── main.tsx                # React entry point
│   └── components/
│       ├── DarkVeil.tsx        # WebGL CPPN shader background
│       ├── Dither.tsx          # Optimized dither animation
│       ├── DotGrid.tsx         # Interactive dot grid (GSAP)
│       ├── Noise.tsx           # Film grain overlay
│       ├── Orb.tsx             # ElevenLabs-style visualizer
│       ├── ScrubBar.tsx        # Reusable scrub bar
│       └── ShimmeringText.tsx  # Animated gradient text
├── docs/
│   └── screenshots/            # App screenshots
└── public/                     # Static assets
```

### Design Patterns

- **Single-File Components** — All pages in App.tsx for rapid iteration
- **CSS-in-JS** — Inline styles for component-specific styling
- **Performance Optimization** — Canvas throttling, spatial partitioning, sprite caching

---

## 🗺️ Roadmap

### Phase 1: Frontend ✅
- [x] Home page with URL input
- [x] Player page with orb visualizer
- [x] Library page with filters
- [x] Settings page with preferences
- [x] Desktop phone mockup
- [x] Performance optimizations

### Phase 2: Backend 🚧
- [ ] User authentication (Supabase)
- [ ] Content extraction API
- [ ] ElevenLabs TTS integration
- [ ] Library CRUD API
- [ ] Settings persistence

### Phase 3: Polish
- [ ] PWA support (offline, install)
- [ ] Push notifications
- [ ] Social login (Google, GitHub)
- [ ] Voice selection UI
- [ ] Share functionality

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow TypeScript best practices
- Maintain 60fps performance target
- Test on both mobile and desktop viewports
- Document new components

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 👤 Author

**Nabaskar**

- GitHub: [@nabaskar](https://github.com/nabaskar)

---

<p align="center">
  Made with ❤️ by nabaskar
</p>
