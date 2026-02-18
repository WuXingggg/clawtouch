"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown, Star, Download, Search } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SkillMissing {
  bins: string[];
  env: string[];
  config: string[];
  os: string[];
}

interface Skill {
  name: string;
  description: string;
  enabled: boolean;
  eligible: boolean;
  disabled: boolean;
  userInvocable: boolean;
  missing: SkillMissing;
}

// ── 本地技能中文翻译 ──
const LOCAL_ZH: Record<string, string> = {
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

// ── ClawHub 热门技能 (stars ≥ 10, 2026-02-19 快照) ──
interface HubSkill {
  slug: string;
  name: string;
  desc: string;
  stars: number;
  installs: number;
}

const CLAWHUB_SKILLS: HubSkill[] = [
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

// ── 折叠区组件 ──
function Section({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full py-2 text-sm font-medium"
      >
        <div className="flex items-center gap-2">
          {title}
          {badge}
        </div>
        <ChevronDown
          size={16}
          className={`text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="space-y-2 pb-3">{children}</div>}
    </div>
  );
}

function zhDesc(name: string, fallback: string): string {
  return LOCAL_ZH[name] || fallback;
}

export function SkillsPanel() {
  const { data: skills, mutate } = useSWR<Skill[]>("/api/skills", fetcher);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const loading = skills === undefined;

  const allSkills = skills || [];
  const enabled = allSkills.filter((s) => s.enabled);
  // eligible but user-disabled → can toggle on
  // not eligible → missing deps, show as unavailable
  const canEnable = allSkills.filter((s) => !s.enabled && s.eligible);
  const unavailable = allSkills.filter((s) => !s.enabled && !s.eligible);
  const disabled = [...canEnable, ...unavailable];

  // Filter by search
  const match = (text: string) =>
    text.toLowerCase().includes(search.toLowerCase());
  const filteredEnabled = search
    ? enabled.filter((s) => match(s.name) || match(zhDesc(s.name, s.description)))
    : enabled;
  const filteredDisabled = search
    ? disabled.filter((s) => match(s.name) || match(zhDesc(s.name, s.description)))
    : disabled;

  // Filter ClawHub skills: exclude already installed + search
  const installedNames = new Set(allSkills.map((s) => s.name));
  const filteredHub = CLAWHUB_SKILLS.filter((h) => {
    if (installedNames.has(h.slug)) return false;
    if (search && !match(h.name) && !match(h.desc) && !match(h.slug)) return false;
    return true;
  });

  const handleToggle = async (name: string, newEnabled: boolean) => {
    setToggling(name);
    await fetch("/api/skills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, enabled: newEnabled }),
    });
    await mutate();
    setToggling(null);
  };

  const handleInstall = async (slug: string) => {
    setInstalling(slug);
    setInstallError(null);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const data = await res.json();
        setInstallError(data.error || "安装失败");
      } else {
        await mutate();
      }
    } catch {
      setInstallError("网络错误");
    }
    setInstalling(null);
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-text-secondary animate-pulse">
        加载技能列表...
      </div>
    );
  }

  return (
    <div className="space-y-1 py-3">
      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder="搜索技能..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-8 pr-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Enabled skills */}
      <Section
        title="已启用"
        badge={<Badge variant="success">{filteredEnabled.length}</Badge>}
      >
        {filteredEnabled.map((skill) => (
          <Card key={skill.name} className="!p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <span className="text-sm font-medium">{skill.name}</span>
                <p className="text-[11px] text-text-secondary truncate mt-0.5">
                  {zhDesc(skill.name, skill.description)}
                </p>
              </div>
              <Toggle
                checked
                onChange={() => handleToggle(skill.name, false)}
                disabled={toggling === skill.name}
              />
            </div>
          </Card>
        ))}
        {filteredEnabled.length === 0 && (
          <p className="text-xs text-text-secondary text-center py-2">无匹配</p>
        )}
      </Section>

      {/* Disabled skills */}
      <Section
        title="未启用"
        badge={<Badge variant="default">{filteredDisabled.length}</Badge>}
      >
        {filteredDisabled.map((skill) => {
          const m = skill.missing;
          const hasOsBlock = m.os.length > 0;
          const missingBins = m.bins;
          const missingEnv = m.env;
          const missingConfig = m.config;
          return (
            <Card key={skill.name} className="!p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <span className="text-sm font-medium">{skill.name}</span>
                  <p className="text-[11px] text-text-secondary truncate mt-0.5">
                    {zhDesc(skill.name, skill.description)}
                  </p>
                  {!skill.eligible && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hasOsBlock && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                          需 {m.os.join("/")}
                        </span>
                      )}
                      {missingBins.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          缺 {missingBins.join(", ")}
                        </span>
                      )}
                      {missingEnv.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                          需配置 {missingEnv.join(", ")}
                        </span>
                      )}
                      {missingConfig.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                          缺配置 {missingConfig.join(", ")}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {skill.eligible ? (
                  <Toggle
                    checked={false}
                    onChange={() => handleToggle(skill.name, true)}
                    disabled={toggling === skill.name}
                  />
                ) : (
                  <Badge variant="default">缺依赖</Badge>
                )}
              </div>
            </Card>
          );
        })}
        {filteredDisabled.length === 0 && (
          <p className="text-xs text-text-secondary text-center py-2">无匹配</p>
        )}
      </Section>

      {/* ClawHub marketplace */}
      <Section
        title="ClawHub 市场"
        badge={<Badge variant="warning">{filteredHub.length}</Badge>}
      >
        {installError && (
          <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-2">
            {installError}
          </div>
        )}
        {filteredHub.map((h) => (
          <Card key={h.slug} className="!p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{h.name}</span>
                  <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                    <span className="flex items-center gap-0.5">
                      <Star size={10} className="text-amber-400" fill="currentColor" />
                      {h.stars}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Download size={10} />
                      {h.installs}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5">{h.desc}</p>
              </div>
              <button
                onClick={() => handleInstall(h.slug)}
                disabled={installing !== null}
                className={`shrink-0 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  installing === h.slug
                    ? "bg-primary/20 text-primary animate-pulse"
                    : "bg-primary text-white active:bg-primary/80"
                } disabled:opacity-50`}
              >
                {installing === h.slug ? "安装中..." : "安装"}
              </button>
            </div>
          </Card>
        ))}
        {filteredHub.length === 0 && (
          <p className="text-xs text-text-secondary text-center py-2">无匹配</p>
        )}
      </Section>
    </div>
  );
}
