<p align="center">
  <img src="docs/assets/logo.png" alt="AudiText Logo" width="120" height="120">
</p>

<h1 align="center">AudiText</h1>

<p align="center">
  <strong>Transform your reading into listening</strong>
  <br>
  A beautiful, modern PWA that converts articles, tweets, and blog posts into high-quality audio
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#contributing">Contributing</a>
</p>

---

## ✨ Features

### 🎧 Core Functionality
- **Text-to-Speech Conversion** - Transform any article, tweet, or blog post into natural-sounding audio
- **Multi-Platform Support** - Works with X (Twitter), Medium, TechCrunch, Dev.to, and more
- **Offline Mode** - Download content for listening without internet

### 🎨 Premium UI/UX
- **Reactive Noir Aesthetic** - Dark theme with dynamic color palettes (Ember, Sunset, Aurora, Violet, Gold)
- **DarkVeil Background** - WebGL-powered animated gradients with noise overlay
- **Animated Icons** - Smooth micro-interactions on all navigation elements
- **Shiny Filter Pills** - Animated gradient effects for active states

### 📚 Library Management
- **Smart Filtering** - Filter by All, Favorites, Saved, Tweets, or Articles
- **Progress Tracking** - Visual progress bars showing listening status
- **Source Recognition** - Platform logos for easy content identification
- **Favorites System** - Star your preferred content for quick access

### ⚙️ Customization
- **Variable Playback Speed** - Free scrub from 0.5x to 2.5x
- **Voice Selection** - Choose your preferred TTS voice
- **Theme Options** - Multiple color palettes to match your mood
- **Auto-Archive** - Automatic cleanup of old content

---

## 🛠️ Tech Stack

| Category | Technology |
|----------|------------|
| **Framework** | React 19 + TypeScript |
| **Build Tool** | Vite 7 |
| **Styling** | CSS + Tailwind CSS 4 |
| **Animation** | Framer Motion |
| **Routing** | React Router DOM 7 |
| **Icons** | Lucide React + Custom Animated Icons |
| **Graphics** | OGL (WebGL) for DarkVeil shader |
| **PWA** | vite-plugin-pwa |

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/nabrahma/AudiText.git

# Navigate to project directory
cd AudiText

# Install dependencies
npm install

# Start development server
npm run dev
```

### Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run preview` | Preview production build |
| `npm run lint` | Run ESLint |

---

## 📁 Project Structure

```
AudiText/
├── src/
│   ├── components/
│   │   ├── icons/           # Animated icon components
│   │   │   ├── BookOpenTextIcon.tsx
│   │   │   ├── HouseIcon.tsx
│   │   │   └── SettingsIcon.tsx
│   │   ├── DarkVeil.tsx     # WebGL background shader
│   │   ├── Noise.tsx        # Canvas noise overlay
│   │   ├── ScrubBar.tsx     # Custom speed slider
│   │   └── ShimmeringText.tsx
│   ├── checkpoints/         # Version checkpoints
│   ├── App.tsx              # Main application
│   ├── index.css            # Global styles + animations
│   └── main.tsx             # Entry point
├── public/
├── docs/                    # Documentation assets
└── package.json
```

---

## 🏗️ Architecture

### Pages

| Page | Description |
|------|-------------|
| **Home** | Landing page with animated orb visualizer and quick-start options |
| **Library** | Content management with filtering, search, and progress tracking |
| **Settings** | User preferences including playback speed, voice, and theme |
| **Player** | Audio playback interface (in development) |

### Design System

- **Color Palettes**: 5 dynamic palettes with hue-shifted backgrounds
- **Typography**: Funnel Display (headings), Genos (UI elements)
- **Animations**: CSS keyframes + Framer Motion for smooth transitions
- **Effects**: Shine-fill pills, chrome borders, noise overlays

---

## 📸 Screenshots

<details>
<summary>Click to expand screenshots</summary>

### Home Page
The home page features a dynamic DarkVeil WebGL background with an animated orb visualizer.

### Library Page
Library with filter pills, progress bars, and platform source logos.

### Settings Page
Settings with free scrub speed control and toggle switches.

</details>

---

## 🗺️ Roadmap

- [x] **v1.0** - Home page with animated background
- [x] **v2.0** - Complete UI design (Library, Settings, Player)
- [ ] **v2.1** - Backend integration for TTS
- [ ] **v2.2** - Content extraction from URLs
- [ ] **v3.0** - Full PWA with offline support
- [ ] **v3.1** - User authentication & cloud sync

---

## 🤝 Contributing

Contributions are welcome! Please read our contributing guidelines before submitting a PR.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is private and not open source.

---

## 👤 Author

**Nabeel Ibrahim**

- GitHub: [@nabrahma](https://github.com/nabrahma)

---

<p align="center">
  Made with ❤️ and ☕
</p>
