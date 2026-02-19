// ── 本地技能中文翻译 ──
export const LOCAL_SKILL_NAMES: Record<string, string> = {
  "feishu-doc": "飞书文档读写操作",
  "feishu-drive": "飞书云盘文件管理",
  "feishu-perm": "飞书文档权限管理",
  "feishu-wiki": "飞书知识库导航",
  "1password": "1Password 密码管理 CLI",
  "apple-notes": "Apple Notes 备忘录管理 (macOS)",
  "apple-reminders": "Apple 提醒事项管理 (macOS)",
  "bear-notes": "Bear 笔记管理",
  "blogwatcher": "博客/RSS 订阅监控",
  "blucli": "BluOS 音箱控制",
  "bluebubbles": "iMessage 消息管理 (BlueBubbles)",
  "camsnap": "RTSP/ONVIF 摄像头截图",
  "clawhub": "ClawHub 技能市场搜索、安装和发布",
  "coding-agent": "编程 Agent 后台运行 (Claude Code/Codex 等)",
  "discord": "Discord 消息操作",
  "eightctl": "Eight Sleep 智能床垫控制",
  "gemini": "Gemini CLI 问答和生成",
  "gifgrep": "GIF 搜索和提取",
  "github": "GitHub CLI 操作 (Issue/PR/CI)",
  "gog": "Google Workspace (Gmail/日历/云盘 等)",
  "goplaces": "Google Places 地点搜索",
  "healthcheck": "主机安全检查和加固",
  "himalaya": "IMAP/SMTP 邮件管理",
  "imsg": "iMessage/SMS 消息管理",
  "mcporter": "MCP 服务器管理工具",
  "model-usage": "模型用量和费用统计",
  "nano-banana-pro": "Gemini 图片生成/编辑",
  "nano-pdf": "自然语言 PDF 编辑",
  "notion": "Notion 页面和数据库管理",
  "obsidian": "Obsidian 笔记库管理",
  "openai-image-gen": "OpenAI 批量图片生成",
  "openai-whisper": "本地语音转文字 (Whisper)",
  "openai-whisper-api": "OpenAI 语音转文字 API",
  "openhue": "Philips Hue 智能灯控制",
  "oracle": "Oracle CLI 提示和文件打包",
  "ordercli": "外卖订单查询 (Foodora)",
  "peekaboo": "macOS UI 截图和自动化",
  "sag": "ElevenLabs 文字转语音",
  "session-logs": "会话日志搜索和分析",
  "sherpa-onnx-tts": "本地文字转语音 (离线)",
  "skill-creator": "Agent 技能创建向导",
  "slack": "Slack 消息和频道管理",
  "songsee": "音频频谱可视化",
  "sonoscli": "Sonos 音箱控制",
  "spotify-player": "Spotify 播放控制",
  "summarize": "URL/文件/播客内容摘要",
  "things-mac": "Things 3 任务管理 (macOS)",
  "tmux": "Tmux 会话远程控制",
  "trello": "Trello 看板管理",
  "video-frames": "视频帧/片段提取 (ffmpeg)",
  "voice-call": "语音通话",
  "wacli": "WhatsApp 消息发送和搜索",
  "weather": "天气查询和预报",
};

// ── ClawHub 热门技能 ──
export interface HubSkill {
  slug: string;
  name: string;
  desc: string;
  stars: number;
  installs: number;
}

export const CLAWHUB_SKILLS: HubSkill[] = [
  { slug: "self-improving-agent", name: "自我改进 Agent", desc: "捕获学习经验和纠错，持续改进 Agent 能力", stars: 215, installs: 181 },
  { slug: "gog", name: "Google Workspace", desc: "Gmail、日历、云盘、通讯录、表格和文档", stars: 146, installs: 414 },
  { slug: "proactive-agent", name: "主动式 Agent", desc: "让 AI Agent 从被动执行变为主动工作", stars: 96, installs: 93 },
  { slug: "agent-browser", name: "Agent 浏览器", desc: "基于 Rust 的高性能无头浏览器自动化", stars: 92, installs: 170 },
  { slug: "clawddocs", name: "Clawdbot 文档专家", desc: "Clawdbot 文档专家，含决策树导航", stars: 75, installs: 85 },
  { slug: "summarize", name: "内容摘要", desc: "网页、PDF、播客、文件内容智能摘要", stars: 66, installs: 392 },
  { slug: "caldav-calendar", name: "CalDAV 日历", desc: "同步和查询 CalDAV 日历 (iCloud/Google 等)", stars: 65, installs: 53 },
  { slug: "humanizer", name: "文本人性化", desc: "去除 AI 生成痕迹，使文本更自然", stars: 62, installs: 63 },
  { slug: "tavily-search", name: "Tavily 搜索", desc: "AI 优化的网页搜索，返回精简结果", stars: 56, installs: 121 },
  { slug: "github", name: "GitHub", desc: "GitHub CLI 操作：Issue、PR、CI、API", stars: 55, installs: 326 },
  { slug: "wacli", name: "WhatsApp", desc: "WhatsApp 消息发送和历史搜索", stars: 53, installs: 220 },
  { slug: "find-skills", name: "技能发现", desc: "帮助用户发现和安装所需的 Agent 技能", stars: 52, installs: 106 },
  { slug: "auto-updater", name: "自动更新", desc: "自动更新 Clawdbot 和所有已安装技能", stars: 49, installs: 101 },
  { slug: "youtube-watcher", name: "YouTube 字幕", desc: "获取和阅读 YouTube 视频字幕", stars: 47, installs: 48 },
  { slug: "nano-banana-pro", name: "Gemini 图片生成", desc: "使用 Gemini 3 Pro 生成/编辑图片", stars: 40, installs: 229 },
  { slug: "byterover", name: "ByteRover", desc: "项目知识管理，提供上下文树", stars: 39, installs: 22 },
  { slug: "desktop-control", name: "桌面控制", desc: "鼠标、键盘和屏幕高级桌面自动化", stars: 38, installs: 29 },
  { slug: "notion", name: "Notion", desc: "Notion 页面、数据库和块管理", stars: 37, installs: 227 },
  { slug: "clawdhub", name: "ClawHub 市场", desc: "技能市场搜索、安装、更新和发布", stars: 37, installs: 96 },
  { slug: "weather", name: "天气查询", desc: "当前天气和预报 (无需 API Key)", stars: 35, installs: 290 },
  { slug: "frontend-design", name: "前端设计", desc: "创建生产级前端界面设计指南", stars: 35, installs: 46 },
  { slug: "trello", name: "Trello", desc: "Trello 看板、列表和卡片管理", stars: 34, installs: 175 },
  { slug: "openai-whisper", name: "Whisper 语音转文字", desc: "本地语音转文字 (无需 API Key)", stars: 32, installs: 228 },
  { slug: "marketing-mode", name: "营销模式", desc: "23 项综合营销技能合集", stars: 31, installs: 30 },
  { slug: "answeroverflow", name: "Answer Overflow", desc: "搜索 Discord 社区讨论索引", stars: 31, installs: 27 },
  { slug: "free-ride", name: "免费 AI 模型", desc: "管理 OpenRouter 免费 AI 模型", stars: 31, installs: 11 },
  { slug: "humanize-ai-text", name: "AI 文本人性化", desc: "让 AI 生成文本绕过检测", stars: 30, installs: 22 },
  { slug: "api-gateway", name: "API 网关", desc: "第三方 API 调用网关，含 OAuth 管理", stars: 29, installs: 14 },
  { slug: "obsidian", name: "Obsidian", desc: "Obsidian 笔记库和 Markdown 管理", stars: 28, installs: 224 },
  { slug: "stock-analysis", name: "股票分析", desc: "Yahoo Finance 股票和加密货币分析", stars: 28, installs: 31 },
  { slug: "prompt-guard", name: "提示词防护", desc: "577+ 模式的提示词注入防御", stars: 25, installs: 27 },
  { slug: "memory-setup", name: "记忆搜索", desc: "配置个性化记忆搜索功能", stars: 25, installs: 32 },
  { slug: "slack", name: "Slack", desc: "Slack 消息、反应和频道管理", stars: 24, installs: 177 },
  { slug: "model-usage", name: "模型用量", desc: "模型用量和费用统计", stars: 23, installs: 226 },
  { slug: "brave-search", name: "Brave 搜索", desc: "Brave Search API 网页搜索和内容提取", stars: 23, installs: 71 },
  { slug: "mcporter", name: "MCP 管理器", desc: "MCP 服务器配置、认证和工具调用", stars: 21, installs: 239 },
  { slug: "elite-longterm-memory", name: "长期记忆", desc: "AI Agent 终极记忆系统", stars: 21, installs: 29 },
  { slug: "moltguard", name: "安全防护", desc: "开源 OpenClaw 安全插件：提示词净化", stars: 21, installs: 7 },
  { slug: "superdesign", name: "超级设计", desc: "前端设计专家指南，创建精美界面", stars: 21, installs: 29 },
  { slug: "ui-ux-pro-max", name: "UI/UX 专家", desc: "UI/UX 设计智能和实现指导", stars: 21, installs: 17 },
  { slug: "skill-creator", name: "技能创建", desc: "Agent 技能创建和打包向导", stars: 20, installs: 198 },
  { slug: "multi-search-engine", name: "多搜索引擎", desc: "17 个搜索引擎集成 (8 国内 + 9 国际)", stars: 20, installs: 17 },
  { slug: "nano-pdf", name: "PDF 编辑", desc: "自然语言编辑 PDF 文件", stars: 19, installs: 236 },
  { slug: "discord", name: "Discord", desc: "Discord 消息和频道管理", stars: 17, installs: 157 },
  { slug: "qmd", name: "本地搜索", desc: "本地搜索/索引 CLI (BM25 + 向量 + 重排)", stars: 17, installs: 37 },
  { slug: "exa-web-search-free", name: "Exa 免费搜索", desc: "Exa MCP 免费 AI 搜索", stars: 17, installs: 14 },
  { slug: "stock-market-pro", name: "股市专家", desc: "Yahoo Finance 股票报价和分析", stars: 17, installs: 20 },
  { slug: "markdown-converter", name: "Markdown 转换", desc: "文档/文件转 Markdown 格式", stars: 16, installs: 19 },
  { slug: "clawdbot-security-check", name: "安全审计", desc: "全面只读安全审计", stars: 15, installs: 19 },
  { slug: "thinking-partner", name: "思维伙伴", desc: "复杂问题的协作思考助手", stars: 15, installs: 13 },
  { slug: "automation-workflows", name: "自动化工作流", desc: "设计和实现自动化工作流", stars: 15, installs: 15 },
  { slug: "gemini", name: "Gemini", desc: "Gemini CLI 问答、摘要和生成", stars: 14, installs: 204 },
  { slug: "video-frames", name: "视频帧提取", desc: "使用 ffmpeg 提取视频帧/片段", stars: 14, installs: 192 },
  { slug: "atxp", name: "ATXP 付费工具", desc: "网页搜索、AI 图片生成等付费 API", stars: 14, installs: 11 },
  { slug: "todoist", name: "Todoist", desc: "Todoist 任务和项目管理", stars: 14, installs: 27 },
  { slug: "fast-browser-use", name: "高速浏览器", desc: "高性能浏览器自动化，支持批量抓取", stars: 13, installs: 15 },
  { slug: "reddit", name: "Reddit", desc: "Reddit 浏览、搜索、发帖和管理", stars: 13, installs: 22 },
  { slug: "browser-use", name: "云浏览器", desc: "从沙箱远程机器控制云浏览器", stars: 13, installs: 23 },
  { slug: "linkedin", name: "LinkedIn", desc: "LinkedIn 消息和自动化", stars: 13, installs: 17 },
  { slug: "yahoo-finance", name: "Yahoo Finance", desc: "股价、财报、期权和新闻查询", stars: 12, installs: 24 },
  { slug: "news-summary", name: "新闻摘要", desc: "新闻动态摘要和资讯", stars: 12, installs: 15 },
  { slug: "peekaboo", name: "Peekaboo", desc: "macOS UI 截图和自动化", stars: 11, installs: 187 },
  { slug: "1password", name: "1Password", desc: "1Password CLI 密码管理", stars: 11, installs: 171 },
  { slug: "clawdefender", name: "安全扫描器", desc: "AI Agent 安全扫描和输入净化", stars: 11, installs: 11 },
  { slug: "agentmail", name: "AgentMail", desc: "AI Agent 专用邮件平台", stars: 11, installs: 28 },
  { slug: "imap-smtp-email", name: "IMAP/SMTP 邮件", desc: "通过 IMAP/SMTP 收发邮件", stars: 11, installs: 18 },
  { slug: "firecrawl-search", name: "Firecrawl 搜索", desc: "Firecrawl API 网页搜索和抓取", stars: 11, installs: 15 },
  { slug: "hippocampus-memory", name: "海马体记忆", desc: "AI Agent 持久化记忆系统", stars: 11, installs: 6 },
  { slug: "perplexity", name: "Perplexity", desc: "AI 驱动的 Perplexity 网页搜索", stars: 10, installs: 25 },
  { slug: "computer-use", name: "电脑控制", desc: "Linux 全桌面控制 (Xvfb + 无头)", stars: 10, installs: 17 },
  { slug: "agent-autonomy-kit", name: "Agent 自主套件", desc: "让 Agent 持续工作无需等待指令", stars: 10, installs: 18 },
  { slug: "windows-control", name: "Windows 控制", desc: "Windows 全桌面控制：鼠标、键盘、截图", stars: 10, installs: 7 },
  { slug: "clean-code", name: "整洁代码", desc: "务实的编码规范——简洁、直接", stars: 10, installs: 7 },
];

// ── 技能详细介绍 ──
export interface SkillDetail {
  usage: string;
  highlights: string[];
}

export const SKILL_DETAILS: Record<string, SkillDetail> = {
  "self-improving-agent": {
    usage: "自动触发：当命令失败、用户纠正、知识过时时自动记录学习。也可以说「回顾一下之前的经验」手动触发。",
    highlights: [
      "自动捕获错误和纠正，形成 .learnings/ 目录下的结构化日志",
      "重要经验自动提升到项目记忆 (CLAUDE.md)，跨会话持续生效",
      "支持分类管理：错误日志、功能请求、最佳实践、知识缺口",
    ],
  },
  "gog": {
    usage: "直接对话调用，如「查看今天的邮件」「创建日历事件」「搜索云盘文件」等。需先配置 Google OAuth。",
    highlights: [
      "一站式 Google 全家桶：Gmail、日历、云盘、通讯录、表格、文档",
      "支持复杂操作：邮件搜索过滤、日历冲突检测、文件分享权限",
      "OAuth 认证安全，不存储密码，支持多账户切换",
    ],
  },
  "proactive-agent": {
    usage: "安装后自动生效，Agent 会在对话间隙主动检查任务、提醒和后台工作进度。",
    highlights: [
      "从被动问答变为主动工作：自动检查待办、跟进任务进度",
      "智能判断何时该主动介入，不会过度打扰",
      "结合定时任务可实现全自动化工作流",
    ],
  },
  "agent-browser": {
    usage: "说「打开网页 xxx」「抓取页面内容」「填写表单」等，Agent 会用无头浏览器执行。需先安装：npm i -g agent-browser",
    highlights: [
      "基于 Rust 的高性能无头浏览器，速度远超 Puppeteer",
      "支持导航、点击、输入、截图、提取数据等完整自动化",
      "自动降级：Rust 版本不可用时回退到 Node.js 方案",
    ],
  },
  "clawddocs": {
    usage: "问「OpenClaw 怎么配置 xxx」「SKILL.md 格式是什么」等问题时自动调用文档搜索。",
    highlights: [
      "内置 OpenClaw 完整文档，含决策树导航快速定位",
      "覆盖配置、技能开发、Gateway、定时任务等所有主题",
      "代码片段和配置示例可直接复制使用",
    ],
  },
  "summarize": {
    usage: "说「总结这个网页/PDF/文件」或直接发送 URL，Agent 会自动提取并生成摘要。",
    highlights: [
      "支持网页、PDF、音频播客、本地文件等多种来源",
      "智能分段摘要，保留关键信息和结构",
      "支持自定义摘要长度和关注点",
    ],
  },
  "caldav-calendar": {
    usage: "说「查看我今天的日程」「添加一个会议」等。需配置 CalDAV 服务器地址和凭据。",
    highlights: [
      "兼容 iCloud、Google Calendar、Fastmail 等主流日历",
      "支持事件创建/编辑/删除、日程查询、空闲时间检测",
      "CalDAV 标准协议，数据存储在你自己的服务器上",
    ],
  },
  "humanizer": {
    usage: "说「把这段文字改得更自然」或「润色一下」，会自动去除 AI 痕迹。",
    highlights: [
      "专业去除 AI 生成文本的典型模式和用词",
      "保持原文含义不变，只调整表达方式",
      "支持多种风格：学术、商务、口语化等",
    ],
  },
  "tavily-search": {
    usage: "说「搜索 xxx」或「查一下最近的 xxx 新闻」，Agent 通过 Tavily API 搜索并返回精简结果。需设置 TAVILY_API_KEY。",
    highlights: [
      "专为 AI Agent 优化的搜索引擎，返回干净精简的内容",
      "支持深度搜索模式，适合复杂调研任务",
      "支持新闻专题搜索和时间范围过滤",
    ],
  },
  "github": {
    usage: "说「查看 PR #123」「创建 Issue」「检查 CI 状态」等，通过 gh CLI 操作。需先登录 gh auth login。",
    highlights: [
      "完整 GitHub 操作：Issue、PR、CI/CD、Release、API",
      "支持仓库管理、代码审查、Actions 工作流触发",
      "利用 gh CLI，安全可靠，权限可控",
    ],
  },
  "wacli": {
    usage: "说「给 xxx 发消息」「搜索和某人的聊天记录」等。需先配置 WhatsApp 桥接。",
    highlights: [
      "WhatsApp 消息发送、接收和历史搜索",
      "支持联系人查找和群组消息",
      "基于 CLI 桥接，不影响手机端正常使用",
    ],
  },
  "find-skills": {
    usage: "说「我需要一个能 xxx 的技能」或「有没有技能可以做 xxx」，Agent 会搜索推荐。",
    highlights: [
      "智能匹配需求，从 ClawHub 市场推荐合适技能",
      "展示技能详情、评分和兼容性信息",
      "支持一键安装推荐的技能",
    ],
  },
  "auto-updater": {
    usage: "说「检查更新」或「更新所有技能」，自动检查并更新 OpenClaw 和已安装技能到最新版本。",
    highlights: [
      "一键更新 OpenClaw 核心和所有已安装技能",
      "自动检测版本差异，只更新有变化的组件",
      "更新前自动备份，失败可回滚",
    ],
  },
  "youtube-watcher": {
    usage: "发送 YouTube 链接或说「获取这个视频的字幕」，Agent 自动提取并返回完整字幕文本。",
    highlights: [
      "支持自动和手动字幕提取，覆盖绝大多数视频",
      "多语言字幕支持，可指定语言偏好",
      "字幕可用于视频内容摘要、翻译等后续处理",
    ],
  },
  "nano-banana-pro": {
    usage: "说「生成一张 xxx 的图片」或「编辑这张图片，把 xxx 改成 yyy」。",
    highlights: [
      "使用 Gemini 3 Pro 模型，高质量图片生成和编辑",
      "支持文本描述生成和基于原图的编辑修改",
      "支持多种尺寸和风格输出",
    ],
  },
  "weather": {
    usage: "说「今天天气怎么样」「北京明天会下雨吗」，无需任何配置直接可用。",
    highlights: [
      "零配置，无需 API Key，开箱即用",
      "支持全球城市当前天气和多日预报",
      "显示温度、湿度、风速、降水概率等详细信息",
    ],
  },
  "clawdhub": {
    usage: "说「搜索 xxx 技能」「安装 xxx」「更新技能」「发布我的技能」等。",
    highlights: [
      "ClawHub 技能市场的完整 CLI 接口",
      "支持搜索、安装、更新、卸载和发布技能",
      "技能版本管理和依赖检查",
    ],
  },
  "notion": {
    usage: "说「创建 Notion 页面」「搜索笔记 xxx」「更新数据库」等。需配置 Notion API Token。",
    highlights: [
      "完整 Notion API：页面、数据库、块的增删改查",
      "支持富文本、表格、看板等多种内容格式",
      "数据库查询支持复杂过滤和排序",
    ],
  },
  "obsidian": {
    usage: "说「创建笔记」「搜索笔记 xxx」「查看最近修改的笔记」等。需指定笔记库路径。",
    highlights: [
      "直接读写 Obsidian Markdown 文件，支持双向链接",
      "全文搜索和标签检索",
      "兼容 Obsidian 所有 Markdown 扩展语法",
    ],
  },
  "slack": {
    usage: "说「发消息到 #general」「搜索 Slack 消息 xxx」等。需配置 Slack Bot Token。",
    highlights: [
      "消息发送、搜索、反应和频道管理",
      "支持线程回复和文件上传",
      "Bot Token 权限可精细控制",
    ],
  },
  "model-usage": {
    usage: "说「查看今天的用量」「这个月花了多少钱」等。",
    highlights: [
      "按模型、时间段统计 Token 消耗和费用",
      "可视化趋势分析，发现用量异常",
      "支持多 Provider 汇总统计",
    ],
  },
  "mcporter": {
    usage: "说「连接 MCP 服务器」「调用 xxx 工具」等。支持管理多个 MCP 服务器连接。",
    highlights: [
      "MCP 服务器配置、连接和工具调用一站式管理",
      "支持 OAuth 认证和多种传输协议",
      "可扩展 Agent 能力到任意 MCP 兼容服务",
    ],
  },
  "skill-creator": {
    usage: "说「帮我创建一个新技能」或「我想开发一个 xxx 的技能」，向导式引导完成开发。",
    highlights: [
      "交互式向导：从需求描述到完整 SKILL.md 一步到位",
      "自动生成脚本模板、依赖声明和元数据",
      "支持直接发布到 ClawHub 市场",
    ],
  },
  "free-ride": {
    usage: "说「有哪些免费模型」「切换到免费模型」等。自动管理 OpenRouter 免费模型列表。",
    highlights: [
      "实时获取 OpenRouter 上所有免费可用的 AI 模型",
      "一键切换到免费模型，节省 API 费用",
      "自动过滤不稳定的模型，只推荐可靠选项",
    ],
  },
  "gemini": {
    usage: "说「用 Gemini 帮我 xxx」或「问一下 Gemini」，调用 Gemini CLI 处理。",
    highlights: [
      "利用 Gemini CLI 实现多模型协作",
      "支持问答、生成、摘要等多种任务",
      "可作为 Agent 的辅助大脑，分担复杂推理",
    ],
  },
  "video-frames": {
    usage: "说「提取视频的关键帧」或「截取第 30 秒的画面」。需安装 ffmpeg。",
    highlights: [
      "基于 ffmpeg 的视频帧提取和片段截取",
      "支持关键帧、等间隔、指定时间点等多种模式",
      "输出可直接用于图片分析或文档配图",
    ],
  },
  "feishu-doc": {
    usage: "说「读取飞书文档 xxx」「创建飞书文档」等。需配置飞书应用凭据。",
    highlights: [
      "飞书文档的创建、读取和编辑操作",
      "支持富文本格式和协作编辑",
      "API 权限粒度可控，安全可靠",
    ],
  },
  "feishu-drive": {
    usage: "说「上传文件到飞书」「搜索云盘」等。需配置飞书应用凭据。",
    highlights: [
      "飞书云盘文件上传、下载和管理",
      "支持文件夹操作和权限设置",
      "搜索文件名和内容",
    ],
  },
  "coding-agent": {
    usage: "说「开一个后台编程任务：xxx」，Agent 会启动子进程后台执行，完成后通知结果。",
    highlights: [
      "后台运行 Claude Code、Codex 等编程 Agent",
      "不阻塞当前对话，可同时处理多个任务",
      "自动收集执行结果并汇报",
    ],
  },
  "session-logs": {
    usage: "说「搜索之前的对话 xxx」「查看昨天的会话记录」等。",
    highlights: [
      "全文搜索历史会话记录和日志",
      "按时间、关键词、会话 ID 精确定位",
      "帮助回溯之前的讨论和决策",
    ],
  },
  "imsg": {
    usage: "说「给 xxx 发短信」「查看最近的消息」等。仅限 macOS。",
    highlights: [
      "iMessage 和 SMS 消息的读取和发送",
      "支持联系人搜索和历史消息查询",
      "基于系统 API，安全无需第三方桥接",
    ],
  },
  "discord": {
    usage: "说「发消息到 Discord #频道」「搜索消息 xxx」等。需配置 Discord Bot Token。",
    highlights: [
      "Discord 消息发送、搜索和频道管理",
      "支持嵌入式消息和反应操作",
      "Bot 权限精细可控",
    ],
  },
  "tmux": {
    usage: "说「列出终端会话」「在 tmux 里执行 xxx」「查看会话输出」等。",
    highlights: [
      "远程管理 tmux 终端会话",
      "支持创建、附加、分离和关闭会话",
      "可查看和发送命令到运行中的终端",
    ],
  },
  "trello": {
    usage: "说「查看看板」「创建卡片 xxx」「移动任务到完成列」等。需配置 Trello API Key。",
    highlights: [
      "Trello 看板、列表和卡片的完整管理",
      "支持标签、截止日期、成员分配等操作",
      "可自动化任务流转和进度跟踪",
    ],
  },
  "voice-call": {
    usage: "说「打电话给 xxx」或「接听来电」。需配置语音通话服务。",
    highlights: [
      "AI Agent 语音通话能力",
      "支持拨出和接听，实时语音交互",
      "通话内容可自动转写和记录",
    ],
  },
  "clawhub": {
    usage: "说「搜索技能 xxx」「安装 xxx 技能」「更新所有技能」等，通过 clawhub CLI 执行。",
    highlights: [
      "ClawHub 技能市场搜索、安装和版本管理",
      "支持一键发布自己开发的技能到市场",
      "自动处理依赖和配置",
    ],
  },
  "healthcheck": {
    usage: "说「检查系统安全」「运行安全扫描」等。自动检测主机配置风险。",
    highlights: [
      "全面的主机安全配置检查和加固建议",
      "检测 SSH、防火墙、权限等常见安全风险",
      "可配置风险容忍度级别",
    ],
  },
  "feishu-perm": {
    usage: "说「设置文档权限」「查看谁有访问权限」等。需配置飞书应用凭据。",
    highlights: [
      "飞书文档和文件的权限查询和管理",
      "支持批量设置协作者权限级别",
      "权限变更操作可审计追踪",
    ],
  },
  "feishu-wiki": {
    usage: "说「搜索知识库 xxx」「浏览知识库目录」等。需配置飞书应用凭据。",
    highlights: [
      "飞书知识库的导航和内容搜索",
      "支持知识空间浏览和文档定位",
      "可作为团队知识问答的后端数据源",
    ],
  },
};
