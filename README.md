# YoutubeMaker Studio

An all-in-one AI-powered YouTube content creation desktop app built with Electron, Flask, React, and Supabase.

## Features

- **Script Editor** -- Rich text editor (TipTap) with timestamps, B-roll markers, sponsor segments, section templates, and word count/duration estimation
- **Recording Studio** -- Webcam capture with green screen (chroma key), teleprompter synced to script, audio recording with waveform visualization
- **Asset Manager** -- Upload, organize, tag, and search media files stored in Supabase Storage
- **AI Tools Hub** -- Powered by OpenAI APIs:
  - Script generation, hooks, title optimization (GPT-4o)
  - Image and diagram generation (gpt-image-1.5)
  - AI voiceover with 13 voices and tone steering (gpt-4o-mini-tts)
  - Auto-transcription of recordings (gpt-4o-transcribe)
  - B-roll video clip generation (Sora)
- **Thumbnail Workshop** -- Layer-based canvas editor with AI thumbnail generation
- **YouTube Metadata Editor** -- Title/description/tags with AI optimization, auto-chapters, end screen planner
- **Ideas Panel** -- Quick capture, rating, research workspace, promote-to-project
- **Project Dashboard** -- Kanban board with pipeline stages (Idea to Publish)
- **Neobrutalism UI** -- 5 switchable color themes (Sunrise, Ocean, Forest, Midnight, Candy)

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Desktop Shell | Electron |
| Backend | Flask (Python 3.11+) |
| Frontend | React 18 + Vite + TypeScript |
| Styling | TailwindCSS + Neobrutalism design system |
| Database | Supabase PostgreSQL |
| Storage | Supabase Storage |
| AI | OpenAI API (GPT-4o, gpt-image-1.5, gpt-4o-mini-tts, gpt-4o-transcribe, Sora) |
| Editor | TipTap (ProseMirror) |
| State | Zustand |
| Media | FFmpeg, WebGL, Web Audio API, MediaRecorder |

## Setup

### Prerequisites

- Python 3.11+
- Node.js 18+
- Supabase project (free tier works)
- OpenAI API key

### 1. Clone and configure

```bash
cp .env.example .env
# Edit .env with your keys:
# OPENAI_API_KEY=sk-...
# SUPABASE_URL=https://xxx.supabase.co
# SUPABASE_KEY=eyJ...
# SUPABASE_SERVICE_KEY=eyJ...
```

### 2. Run the Supabase migration

Copy `supabase/migrations/001_initial_schema.sql` and run it in your Supabase SQL editor, or use the Supabase CLI:

```bash
supabase db push
```

### 3. Install backend

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python run.py
```

### 4. Install frontend

```bash
cd frontend
npm install
npm run dev
```

### 5. Run with Electron (optional)

```bash
cd electron
npm install
npm run dev
```

## Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| Cmd/Ctrl + 1 | Dashboard |
| Cmd/Ctrl + 2 | Script Editor |
| Cmd/Ctrl + 3 | Assets |
| Cmd/Ctrl + 4 | Recording Studio |
| Cmd/Ctrl + 5 | Thumbnails |
| Cmd/Ctrl + 6 | Metadata |
| Cmd/Ctrl + 7 | AI Tools |
| Cmd/Ctrl + 8 | Ideas |
| Space (teleprompter) | Play/Pause |
| Up/Down (teleprompter) | Speed +/- |
| R (teleprompter) | Reset |

## Color Themes

Switch themes from the sidebar:

- **Sunrise** (default) -- Warm orange + golden yellow
- **Ocean** -- Royal blue + purple
- **Forest** -- Forest green + sage
- **Midnight** -- Dark mode with lavender accents
- **Candy** -- Coral red + bright yellow

## License

MIT
