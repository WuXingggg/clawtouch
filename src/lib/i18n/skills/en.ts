import type { HubSkill, SkillDetail } from "./zh-CN";

// ── Local skill English descriptions ──
export const LOCAL_SKILL_NAMES: Record<string, string> = {
  "feishu-doc": "Feishu document read/write",
  "feishu-drive": "Feishu cloud drive management",
  "feishu-perm": "Feishu document permissions",
  "feishu-wiki": "Feishu wiki navigation",
  "1password": "1Password CLI manager",
  "apple-notes": "Apple Notes management (macOS)",
  "apple-reminders": "Apple Reminders management (macOS)",
  "bear-notes": "Bear notes management",
  "blogwatcher": "Blog/RSS feed monitoring",
  "blucli": "BluOS speaker control",
  "bluebubbles": "iMessage via BlueBubbles",
  "camsnap": "RTSP/ONVIF camera snapshots",
  "clawhub": "ClawHub skill marketplace CLI",
  "coding-agent": "Background coding agent (Claude Code/Codex)",
  "discord": "Discord messaging",
  "eightctl": "Eight Sleep smart mattress control",
  "gemini": "Gemini CLI Q&A and generation",
  "gifgrep": "GIF search and extraction",
  "github": "GitHub CLI (Issues/PRs/CI)",
  "gog": "Google Workspace (Gmail/Calendar/Drive)",
  "goplaces": "Google Places search",
  "healthcheck": "Host security check and hardening",
  "himalaya": "IMAP/SMTP email management",
  "imsg": "iMessage/SMS management",
  "mcporter": "MCP server management",
  "model-usage": "Model usage and cost statistics",
  "nano-banana-pro": "Gemini image generation/editing",
  "nano-pdf": "Natural language PDF editing",
  "notion": "Notion pages and database management",
  "obsidian": "Obsidian vault management",
  "openai-image-gen": "OpenAI batch image generation",
  "openai-whisper": "Local speech-to-text (Whisper)",
  "openai-whisper-api": "OpenAI speech-to-text API",
  "openhue": "Philips Hue smart light control",
  "oracle": "Oracle CLI prompts and file bundling",
  "ordercli": "Food delivery orders (Foodora)",
  "peekaboo": "macOS UI screenshots and automation",
  "sag": "ElevenLabs text-to-speech",
  "session-logs": "Session log search and analysis",
  "sherpa-onnx-tts": "Local text-to-speech (offline)",
  "skill-creator": "Agent skill creation wizard",
  "slack": "Slack messaging and channels",
  "songsee": "Audio spectrum visualization",
  "sonoscli": "Sonos speaker control",
  "spotify-player": "Spotify playback control",
  "summarize": "URL/file/podcast summarization",
  "things-mac": "Things 3 task management (macOS)",
  "tmux": "Tmux session remote control",
  "trello": "Trello board management",
  "video-frames": "Video frame/clip extraction (ffmpeg)",
  "voice-call": "Voice calls",
  "wacli": "WhatsApp messaging and search",
  "weather": "Weather query and forecast",
};

// ── ClawHub popular skills ──
export const CLAWHUB_SKILLS: HubSkill[] = [
  { slug: "self-improving-agent", name: "Self-Improving Agent", desc: "Capture learning and corrections to continuously improve agent capabilities", stars: 215, installs: 181 },
  { slug: "gog", name: "Google Workspace", desc: "Gmail, Calendar, Drive, Contacts, Sheets, and Docs", stars: 146, installs: 414 },
  { slug: "proactive-agent", name: "Proactive Agent", desc: "Transform AI agent from reactive to proactive", stars: 96, installs: 93 },
  { slug: "agent-browser", name: "Agent Browser", desc: "High-performance headless browser automation built on Rust", stars: 92, installs: 170 },
  { slug: "clawddocs", name: "Clawdbot Docs Expert", desc: "Clawdbot documentation expert with decision tree navigation", stars: 75, installs: 85 },
  { slug: "summarize", name: "Summarize", desc: "Smart summarization for web pages, PDFs, podcasts, and files", stars: 66, installs: 392 },
  { slug: "caldav-calendar", name: "CalDAV Calendar", desc: "Sync and query CalDAV calendars (iCloud/Google etc.)", stars: 65, installs: 53 },
  { slug: "humanizer", name: "Text Humanizer", desc: "Remove AI-generated patterns to make text more natural", stars: 62, installs: 63 },
  { slug: "tavily-search", name: "Tavily Search", desc: "AI-optimized web search with concise results", stars: 56, installs: 121 },
  { slug: "github", name: "GitHub", desc: "GitHub CLI: Issues, PRs, CI, API", stars: 55, installs: 326 },
  { slug: "wacli", name: "WhatsApp", desc: "WhatsApp messaging and history search", stars: 53, installs: 220 },
  { slug: "find-skills", name: "Skill Finder", desc: "Help users discover and install needed agent skills", stars: 52, installs: 106 },
  { slug: "auto-updater", name: "Auto Updater", desc: "Auto-update Clawdbot and all installed skills", stars: 49, installs: 101 },
  { slug: "youtube-watcher", name: "YouTube Captions", desc: "Fetch and read YouTube video captions", stars: 47, installs: 48 },
  { slug: "nano-banana-pro", name: "Gemini Image Gen", desc: "Generate/edit images with Gemini 3 Pro", stars: 40, installs: 229 },
  { slug: "byterover", name: "ByteRover", desc: "Project knowledge management with context tree", stars: 39, installs: 22 },
  { slug: "desktop-control", name: "Desktop Control", desc: "Advanced desktop automation: mouse, keyboard, and screen", stars: 38, installs: 29 },
  { slug: "notion", name: "Notion", desc: "Notion pages, databases, and blocks management", stars: 37, installs: 227 },
  { slug: "clawdhub", name: "ClawHub Market", desc: "Skill marketplace search, install, update, and publish", stars: 37, installs: 96 },
  { slug: "weather", name: "Weather", desc: "Current weather and forecast (no API key needed)", stars: 35, installs: 290 },
  { slug: "frontend-design", name: "Frontend Design", desc: "Production-grade frontend UI design guide", stars: 35, installs: 46 },
  { slug: "trello", name: "Trello", desc: "Trello boards, lists, and cards management", stars: 34, installs: 175 },
  { slug: "openai-whisper", name: "Whisper STT", desc: "Local speech-to-text (no API key needed)", stars: 32, installs: 228 },
  { slug: "marketing-mode", name: "Marketing Mode", desc: "23 comprehensive marketing skills collection", stars: 31, installs: 30 },
  { slug: "answeroverflow", name: "Answer Overflow", desc: "Search Discord community discussion index", stars: 31, installs: 27 },
  { slug: "free-ride", name: "Free AI Models", desc: "Manage OpenRouter free AI models", stars: 31, installs: 11 },
  { slug: "humanize-ai-text", name: "AI Text Humanizer", desc: "Make AI-generated text bypass detection", stars: 30, installs: 22 },
  { slug: "api-gateway", name: "API Gateway", desc: "Third-party API gateway with OAuth management", stars: 29, installs: 14 },
  { slug: "obsidian", name: "Obsidian", desc: "Obsidian vault and Markdown management", stars: 28, installs: 224 },
  { slug: "stock-analysis", name: "Stock Analysis", desc: "Yahoo Finance stocks and crypto analysis", stars: 28, installs: 31 },
  { slug: "prompt-guard", name: "Prompt Guard", desc: "577+ pattern prompt injection defense", stars: 25, installs: 27 },
  { slug: "memory-setup", name: "Memory Search", desc: "Configure personalized memory search", stars: 25, installs: 32 },
  { slug: "slack", name: "Slack", desc: "Slack messages, reactions, and channel management", stars: 24, installs: 177 },
  { slug: "model-usage", name: "Model Usage", desc: "Model usage and cost statistics", stars: 23, installs: 226 },
  { slug: "brave-search", name: "Brave Search", desc: "Brave Search API web search and content extraction", stars: 23, installs: 71 },
  { slug: "mcporter", name: "MCP Manager", desc: "MCP server config, auth, and tool invocation", stars: 21, installs: 239 },
  { slug: "elite-longterm-memory", name: "Long-term Memory", desc: "Ultimate memory system for AI agents", stars: 21, installs: 29 },
  { slug: "moltguard", name: "Security Guard", desc: "Open-source OpenClaw security plugin: prompt sanitization", stars: 21, installs: 7 },
  { slug: "superdesign", name: "Super Design", desc: "Frontend design expert guide for beautiful UIs", stars: 21, installs: 29 },
  { slug: "ui-ux-pro-max", name: "UI/UX Expert", desc: "UI/UX design intelligence and implementation guide", stars: 21, installs: 17 },
  { slug: "skill-creator", name: "Skill Creator", desc: "Agent skill creation and packaging wizard", stars: 20, installs: 198 },
  { slug: "multi-search-engine", name: "Multi Search Engine", desc: "17 search engines integrated (8 Chinese + 9 international)", stars: 20, installs: 17 },
  { slug: "nano-pdf", name: "PDF Editor", desc: "Edit PDF files with natural language", stars: 19, installs: 236 },
  { slug: "discord", name: "Discord", desc: "Discord messaging and channel management", stars: 17, installs: 157 },
  { slug: "qmd", name: "Local Search", desc: "Local search/index CLI (BM25 + vector + rerank)", stars: 17, installs: 37 },
  { slug: "exa-web-search-free", name: "Exa Free Search", desc: "Exa MCP free AI search", stars: 17, installs: 14 },
  { slug: "stock-market-pro", name: "Stock Market Pro", desc: "Yahoo Finance stock quotes and analysis", stars: 17, installs: 20 },
  { slug: "markdown-converter", name: "Markdown Converter", desc: "Convert documents/files to Markdown format", stars: 16, installs: 19 },
  { slug: "clawdbot-security-check", name: "Security Audit", desc: "Comprehensive read-only security audit", stars: 15, installs: 19 },
  { slug: "thinking-partner", name: "Thinking Partner", desc: "Collaborative thinking assistant for complex problems", stars: 15, installs: 13 },
  { slug: "automation-workflows", name: "Automation Workflows", desc: "Design and implement automation workflows", stars: 15, installs: 15 },
  { slug: "gemini", name: "Gemini", desc: "Gemini CLI Q&A, summarization, and generation", stars: 14, installs: 204 },
  { slug: "video-frames", name: "Video Frames", desc: "Extract video frames/clips using ffmpeg", stars: 14, installs: 192 },
  { slug: "atxp", name: "ATXP Paid Tools", desc: "Web search, AI image gen, and other paid APIs", stars: 14, installs: 11 },
  { slug: "todoist", name: "Todoist", desc: "Todoist task and project management", stars: 14, installs: 27 },
  { slug: "fast-browser-use", name: "Fast Browser", desc: "High-performance browser automation with batch scraping", stars: 13, installs: 15 },
  { slug: "reddit", name: "Reddit", desc: "Reddit browsing, searching, posting, and management", stars: 13, installs: 22 },
  { slug: "browser-use", name: "Cloud Browser", desc: "Control cloud browser from sandboxed remote machine", stars: 13, installs: 23 },
  { slug: "linkedin", name: "LinkedIn", desc: "LinkedIn messaging and automation", stars: 13, installs: 17 },
  { slug: "yahoo-finance", name: "Yahoo Finance", desc: "Stock prices, earnings, options, and news", stars: 12, installs: 24 },
  { slug: "news-summary", name: "News Summary", desc: "News digest and summaries", stars: 12, installs: 15 },
  { slug: "peekaboo", name: "Peekaboo", desc: "macOS UI screenshots and automation", stars: 11, installs: 187 },
  { slug: "1password", name: "1Password", desc: "1Password CLI password management", stars: 11, installs: 171 },
  { slug: "clawdefender", name: "Security Scanner", desc: "AI agent security scanning and input sanitization", stars: 11, installs: 11 },
  { slug: "agentmail", name: "AgentMail", desc: "Dedicated email platform for AI agents", stars: 11, installs: 28 },
  { slug: "imap-smtp-email", name: "IMAP/SMTP Email", desc: "Send and receive emails via IMAP/SMTP", stars: 11, installs: 18 },
  { slug: "firecrawl-search", name: "Firecrawl Search", desc: "Firecrawl API web search and scraping", stars: 11, installs: 15 },
  { slug: "hippocampus-memory", name: "Hippocampus Memory", desc: "Persistent memory system for AI agents", stars: 11, installs: 6 },
  { slug: "perplexity", name: "Perplexity", desc: "AI-powered Perplexity web search", stars: 10, installs: 25 },
  { slug: "computer-use", name: "Computer Use", desc: "Linux full desktop control (Xvfb + headless)", stars: 10, installs: 17 },
  { slug: "agent-autonomy-kit", name: "Agent Autonomy Kit", desc: "Keep agents working without waiting for instructions", stars: 10, installs: 18 },
  { slug: "windows-control", name: "Windows Control", desc: "Windows full desktop control: mouse, keyboard, screenshots", stars: 10, installs: 7 },
  { slug: "clean-code", name: "Clean Code", desc: "Pragmatic coding standards — simple and direct", stars: 10, installs: 7 },
];

// ── Skill details ──
export const SKILL_DETAILS: Record<string, SkillDetail> = {
  "self-improving-agent": {
    usage: "Auto-triggered: records learnings when commands fail, user corrects, or knowledge is outdated. Say \"review past experiences\" to trigger manually.",
    highlights: [
      "Auto-captures errors and corrections into structured .learnings/ logs",
      "Important learnings auto-promoted to project memory (CLAUDE.md), persistent across sessions",
      "Categorized management: error logs, feature requests, best practices, knowledge gaps",
    ],
  },
  "gog": {
    usage: "Chat directly, e.g. \"check today's emails\", \"create a calendar event\", \"search drive files\". Requires Google OAuth setup.",
    highlights: [
      "All-in-one Google suite: Gmail, Calendar, Drive, Contacts, Sheets, Docs",
      "Complex operations: email filtering, calendar conflict detection, file sharing permissions",
      "Secure OAuth auth, no passwords stored, multi-account support",
    ],
  },
  "proactive-agent": {
    usage: "Works automatically after install. Agent proactively checks tasks, reminders, and background work progress between conversations.",
    highlights: [
      "From reactive Q&A to proactive work: auto-checks to-dos, follows up on task progress",
      "Smart intervention timing — won't over-interrupt",
      "Combined with cron jobs for fully automated workflows",
    ],
  },
  "agent-browser": {
    usage: "Say \"open website xxx\", \"scrape page content\", \"fill out form\", etc. Requires: npm i -g agent-browser",
    highlights: [
      "Rust-based high-performance headless browser, much faster than Puppeteer",
      "Full automation: navigate, click, type, screenshot, extract data",
      "Auto-fallback: falls back to Node.js when Rust version unavailable",
    ],
  },
  "clawddocs": {
    usage: "Auto-triggered when asking \"how to configure xxx in OpenClaw\" or \"what's the SKILL.md format\".",
    highlights: [
      "Built-in complete OpenClaw docs with decision tree navigation",
      "Covers config, skill development, Gateway, cron jobs, and more",
      "Code snippets and config examples ready to copy",
    ],
  },
  "summarize": {
    usage: "Say \"summarize this webpage/PDF/file\" or send a URL. Agent auto-extracts and generates a summary.",
    highlights: [
      "Supports web pages, PDFs, audio podcasts, and local files",
      "Smart segmented summaries preserving key info and structure",
      "Customizable summary length and focus areas",
    ],
  },
  "caldav-calendar": {
    usage: "Say \"show my schedule today\" or \"add a meeting\". Requires CalDAV server URL and credentials.",
    highlights: [
      "Compatible with iCloud, Google Calendar, Fastmail, and more",
      "Event CRUD, schedule queries, and free time detection",
      "CalDAV standard protocol — data stays on your server",
    ],
  },
  "humanizer": {
    usage: "Say \"make this text more natural\" or \"polish it\". Auto-removes AI patterns.",
    highlights: [
      "Professionally removes typical AI-generated text patterns",
      "Preserves original meaning, adjusts expression only",
      "Multiple styles: academic, business, casual, etc.",
    ],
  },
  "tavily-search": {
    usage: "Say \"search xxx\" or \"check recent xxx news\". Requires TAVILY_API_KEY.",
    highlights: [
      "Search engine optimized for AI agents with clean, concise results",
      "Deep search mode for complex research tasks",
      "News-specific search and time range filtering",
    ],
  },
  "github": {
    usage: "Say \"view PR #123\", \"create issue\", \"check CI status\". Uses gh CLI. Requires: gh auth login.",
    highlights: [
      "Full GitHub ops: Issues, PRs, CI/CD, Releases, API",
      "Repo management, code review, Actions workflow triggers",
      "Uses gh CLI — secure, reliable, fine-grained permissions",
    ],
  },
  "wacli": {
    usage: "Say \"send message to xxx\" or \"search chat history with someone\". Requires WhatsApp bridge setup.",
    highlights: [
      "WhatsApp message send, receive, and history search",
      "Contact lookup and group messaging",
      "CLI-based bridge — doesn't affect phone app",
    ],
  },
  "find-skills": {
    usage: "Say \"I need a skill that can xxx\" or \"is there a skill for xxx\". Agent searches and recommends.",
    highlights: [
      "Smart requirement matching from ClawHub marketplace",
      "Shows skill details, ratings, and compatibility info",
      "One-click install for recommended skills",
    ],
  },
  "auto-updater": {
    usage: "Say \"check for updates\" or \"update all skills\". Auto-checks and updates to latest versions.",
    highlights: [
      "One-click update for OpenClaw core and all installed skills",
      "Auto-detects version differences, only updates changed components",
      "Auto-backup before update, rollback on failure",
    ],
  },
  "youtube-watcher": {
    usage: "Send a YouTube link or say \"get captions for this video\". Agent auto-extracts full caption text.",
    highlights: [
      "Supports auto and manual caption extraction for most videos",
      "Multi-language subtitles with language preference",
      "Captions can be used for summarization, translation, etc.",
    ],
  },
  "nano-banana-pro": {
    usage: "Say \"generate an image of xxx\" or \"edit this image, change xxx to yyy\".",
    highlights: [
      "Gemini 3 Pro model for high-quality image generation and editing",
      "Text-to-image and original-image-based editing",
      "Multiple sizes and style outputs",
    ],
  },
  "weather": {
    usage: "Say \"what's the weather today\" or \"will it rain in Beijing tomorrow\". No configuration needed.",
    highlights: [
      "Zero config, no API key required, works out of the box",
      "Global city coverage with current weather and multi-day forecast",
      "Temperature, humidity, wind speed, precipitation probability",
    ],
  },
  "clawdhub": {
    usage: "Say \"search xxx skill\", \"install xxx\", \"update skills\", \"publish my skill\", etc.",
    highlights: [
      "Complete CLI interface for ClawHub skill marketplace",
      "Search, install, update, uninstall, and publish skills",
      "Version management and dependency checking",
    ],
  },
  "notion": {
    usage: "Say \"create Notion page\", \"search notes xxx\", \"update database\". Requires Notion API Token.",
    highlights: [
      "Full Notion API: CRUD for pages, databases, and blocks",
      "Rich text, tables, kanban, and multiple content formats",
      "Database queries with complex filtering and sorting",
    ],
  },
  "obsidian": {
    usage: "Say \"create a note\", \"search notes xxx\", \"show recently modified notes\". Requires vault path.",
    highlights: [
      "Direct read/write of Obsidian Markdown files with backlinks",
      "Full-text search and tag indexing",
      "Compatible with all Obsidian Markdown extensions",
    ],
  },
  "slack": {
    usage: "Say \"send message to #general\" or \"search Slack messages xxx\". Requires Slack Bot Token.",
    highlights: [
      "Message send, search, reactions, and channel management",
      "Thread replies and file uploads",
      "Fine-grained Bot Token permissions",
    ],
  },
  "model-usage": {
    usage: "Say \"check today's usage\" or \"how much did I spend this month\".",
    highlights: [
      "Token consumption and cost stats by model and time period",
      "Visual trend analysis to spot usage anomalies",
      "Multi-provider aggregated statistics",
    ],
  },
  "mcporter": {
    usage: "Say \"connect MCP server\" or \"call xxx tool\". Manages multiple MCP server connections.",
    highlights: [
      "One-stop MCP server config, connection, and tool invocation",
      "OAuth auth and multiple transport protocols",
      "Extend agent capabilities to any MCP-compatible service",
    ],
  },
  "skill-creator": {
    usage: "Say \"help me create a new skill\" or \"I want to develop a skill for xxx\". Guided wizard.",
    highlights: [
      "Interactive wizard: from requirements to complete SKILL.md in one go",
      "Auto-generates script templates, dependency declarations, and metadata",
      "Publish directly to ClawHub marketplace",
    ],
  },
  "free-ride": {
    usage: "Say \"what free models are available\" or \"switch to a free model\". Auto-manages OpenRouter free model list.",
    highlights: [
      "Real-time list of all free AI models on OpenRouter",
      "One-click switch to free models, save on API costs",
      "Auto-filters unstable models, recommends reliable options only",
    ],
  },
  "gemini": {
    usage: "Say \"ask Gemini to help with xxx\" or \"ask Gemini\". Invokes Gemini CLI.",
    highlights: [
      "Multi-model collaboration via Gemini CLI",
      "Q&A, generation, summarization, and more",
      "Acts as an auxiliary brain for complex reasoning",
    ],
  },
  "video-frames": {
    usage: "Say \"extract key frames from the video\" or \"capture the frame at 30 seconds\". Requires ffmpeg.",
    highlights: [
      "ffmpeg-based video frame extraction and clip capture",
      "Key frames, equal intervals, specific timestamps, and more",
      "Output ready for image analysis or documentation",
    ],
  },
  "feishu-doc": {
    usage: "Say \"read Feishu document xxx\" or \"create Feishu document\". Requires Feishu app credentials.",
    highlights: [
      "Create, read, and edit Feishu documents",
      "Rich text formatting and collaborative editing",
      "Fine-grained API permissions, secure and reliable",
    ],
  },
  "feishu-drive": {
    usage: "Say \"upload file to Feishu\" or \"search cloud drive\". Requires Feishu app credentials.",
    highlights: [
      "Feishu cloud drive file upload, download, and management",
      "Folder operations and permission settings",
      "Search by filename and content",
    ],
  },
  "coding-agent": {
    usage: "Say \"start a background coding task: xxx\". Agent launches subprocess to execute, reports results when done.",
    highlights: [
      "Run Claude Code, Codex, etc. in the background",
      "Non-blocking — handle multiple tasks simultaneously",
      "Auto-collects and reports execution results",
    ],
  },
  "session-logs": {
    usage: "Say \"search previous conversations xxx\" or \"view yesterday's session logs\".",
    highlights: [
      "Full-text search across session logs and history",
      "Locate by time, keywords, or session ID",
      "Trace back previous discussions and decisions",
    ],
  },
  "imsg": {
    usage: "Say \"send a text to xxx\" or \"check recent messages\". macOS only.",
    highlights: [
      "Read and send iMessage and SMS messages",
      "Contact search and message history queries",
      "System API based — secure, no third-party bridge needed",
    ],
  },
  "discord": {
    usage: "Say \"send message to Discord #channel\" or \"search messages xxx\". Requires Discord Bot Token.",
    highlights: [
      "Discord message send, search, and channel management",
      "Embed messages and reaction operations",
      "Fine-grained Bot permissions",
    ],
  },
  "tmux": {
    usage: "Say \"list terminal sessions\", \"run xxx in tmux\", or \"check session output\".",
    highlights: [
      "Remote tmux terminal session management",
      "Create, attach, detach, and close sessions",
      "View and send commands to running terminals",
    ],
  },
  "trello": {
    usage: "Say \"view board\", \"create card xxx\", or \"move task to done column\". Requires Trello API Key.",
    highlights: [
      "Full Trello boards, lists, and cards management",
      "Labels, due dates, member assignment, and more",
      "Automate task flow and progress tracking",
    ],
  },
  "voice-call": {
    usage: "Say \"call xxx\" or \"answer the call\". Requires voice call service setup.",
    highlights: [
      "AI agent voice calling capability",
      "Outbound and inbound calls with real-time voice interaction",
      "Auto-transcription and recording of call content",
    ],
  },
  "clawhub": {
    usage: "Say \"search skill xxx\", \"install xxx skill\", or \"update all skills\". Uses clawhub CLI.",
    highlights: [
      "ClawHub marketplace search, install, and version management",
      "One-click publish your own skills to the marketplace",
      "Auto-handles dependencies and configuration",
    ],
  },
  "healthcheck": {
    usage: "Say \"check system security\" or \"run security scan\". Auto-detects host configuration risks.",
    highlights: [
      "Comprehensive host security configuration check and hardening advice",
      "Detects SSH, firewall, permission, and other common security risks",
      "Configurable risk tolerance levels",
    ],
  },
  "feishu-perm": {
    usage: "Say \"set document permissions\" or \"check who has access\". Requires Feishu app credentials.",
    highlights: [
      "Query and manage Feishu document and file permissions",
      "Batch set collaborator permission levels",
      "Auditable permission change tracking",
    ],
  },
  "feishu-wiki": {
    usage: "Say \"search wiki xxx\" or \"browse wiki directory\". Requires Feishu app credentials.",
    highlights: [
      "Feishu wiki navigation and content search",
      "Browse knowledge spaces and locate documents",
      "Backend data source for team knowledge Q&A",
    ],
  },
};
