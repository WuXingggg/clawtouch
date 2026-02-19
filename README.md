<p align="center">
  <span style="font-size: 48px">🦞</span>
</p>

<h1 align="center">ClawTouch</h1>

<p align="center">
  <strong>A mobile-first control panel for <a href="https://github.com/nicepkg/openclaw">OpenClaw</a> AI agents.</strong>
  <br />
  Chat, manage skills, schedule tasks, and monitor usage — all from your phone.
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#quick-start">Quick Start</a> •
  <a href="#architecture">Architecture</a> •
  <a href="#configuration">Configuration</a> •
  <a href="#license">License</a>
</p>

<p align="center">
  English | <a href="./README.zh-CN.md">简体中文</a>
</p>

---

## Why ClawTouch?

Most OpenClaw interfaces are desktop-first. **ClawTouch** takes a different approach — it's designed as a **mobile-first chat UI** with a capsule toolbar pattern (inspired by WeChat), giving you full agent control from a single screen.

Unlike chat-only clients, ClawTouch includes **operational panels** for managing skills, cron jobs, token usage, and model configuration — making it a lightweight command center for your AI agents.

## Features

**Chat**
- Real-time streaming responses via Server-Sent Events
- Message queue with debounce — send multiple messages without waiting
- Auto-retry with escalating backoff on agent-busy errors
- Markdown rendering with GFM support
- Image attachments with inline preview
- Voice input (Web Speech API)
- Long-press context menu (copy / re-edit / delete)

**Agent Management**
- 🧩 **Skills Panel** — Browse, install, and manage OpenClaw skills from ClawHub
- ⏰ **Cron Panel** — View and control scheduled agent tasks
- 📊 **Token Panel** — Usage statistics with trend charts
- ⚙️ **Settings** — Model selection, context window, history limits

**Experience**
- Mobile-first responsive design (adapts to desktop with centered layout)
- Pull-to-refresh gateway status
- PWA-ready with offline manifest
- Gateway connection reuse (shared WebSocket singleton)
- Ed25519 device authentication

## Quick Start

### Prerequisites

- [Node.js](https://nodejs.org/) 20+
- [OpenClaw](https://github.com/nicepkg/openclaw) installed and running locally

### Setup

```bash
git clone https://github.com/WuXingggg/clawtouch.git
cd clawtouch

# Install dependencies
npm install

# Configure environment
cp .env.example .env.local
# Edit .env.local with your gateway token

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

### Production Build

```bash
npm run build
npm start
```

## Architecture

```
src/
├── app/
│   ├── page.tsx              # Main chat UI (renders all panels)
│   └── api/
│       ├── chat/route.ts     # SSE streaming via Gateway WebSocket RPC
│       ├── gateway/route.ts  # Health check (cached 5s)
│       ├── skills/route.ts   # ClawHub skill management
│       ├── cron/route.ts     # Cron job CRUD
│       ├── tokens/route.ts   # Usage statistics
│       ├── models/route.ts   # Model listing
│       └── upload/route.ts   # File upload handler
├── hooks/
│   ├── useChat.ts            # Message queue, streaming, retry logic
│   ├── useAttachments.ts     # File upload and preview
│   └── useVoiceInput.ts      # Speech recognition
├── components/
│   ├── panels/               # TokenPanel, SkillsPanel, CronPanel, SettingsPanel
│   └── ui/                   # BottomSheet, Card, Badge, etc.
└── lib/
    ├── gateway-ws.ts         # WebSocket RPC client with Ed25519 auth
    ├── openclaw.ts           # CLI wrapper for local OpenClaw operations
    ├── settings.ts           # User preferences (localStorage)
    └── ...
```

### How It Connects to OpenClaw

ClawTouch communicates with the OpenClaw Gateway via **WebSocket RPC** on the server side:

```
Browser ←→ Next.js API Routes ←→ OpenClaw Gateway (WS port 18789)
```

1. Server establishes a shared WebSocket connection to the Gateway
2. Authenticates using `connect.challenge` → `connect` with Ed25519 device signature
3. Chat messages sent via `chat.send` RPC, responses streamed back as SSE to the browser
4. Connection is reused across requests (no reconnection per message)

## Configuration

| Variable | Default | Description |
|----------|---------|-------------|
| `OPENCLAW_GATEWAY_WS_URL` | `ws://127.0.0.1:18789` | Gateway WebSocket URL |
| `OPENCLAW_GATEWAY_TOKEN` | — | Gateway authentication token |
| `OPENCLAW_DEVICE_IDENTITY` | `~/.openclaw/identity/device.json` | Ed25519 device keypair path |
| `OPENCLAW_SESSION_KEY` | `agent:main:clawtouch` | Session identifier |
| `OPENCLAW_BIN` | `openclaw` | Path to OpenClaw CLI binary |

See [`.env.example`](.env.example) for the full list.

## Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router + Turbopack)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/)
- **Data Fetching**: [SWR](https://swr.vercel.app/)
- **Charts**: [Recharts](https://recharts.org/)
- **Icons**: [Lucide React](https://lucide.dev/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm
- **WebSocket**: [ws](https://github.com/websockets/ws) (server-side Gateway RPC)

## License

[MIT](LICENSE) — Made with 🦞 by the ClawTouch contributors.
