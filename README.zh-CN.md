<p align="center">
  <span style="font-size: 48px">🦞</span>
</p>

<h1 align="center">ClawTouch</h1>

<p align="center">
  <strong>一个移动优先的 <a href="https://github.com/nicepkg/openclaw">OpenClaw</a> AI 智能体控制面板。</strong>
  <br />
  聊天、管理技能、定时任务、用量监控 —— 一部手机搞定一切。
</p>

<p align="center">
  <a href="#特性">特性</a> •
  <a href="#快速开始">快速开始</a> •
  <a href="#项目架构">项目架构</a> •
  <a href="#配置项">配置项</a> •
  <a href="#许可证">许可证</a>
</p>

<p align="center">
  <a href="./README.md">English</a> | 简体中文
</p>

---

## 为什么选择 ClawTouch？

大多数 OpenClaw 界面都是为桌面端设计的。**ClawTouch** 反其道而行 —— 采用**移动优先的聊天式 UI**，借鉴微信的胶囊工具栏交互模式，让你在一个屏幕内完成对 AI 智能体的全部操控。

不同于纯聊天客户端，ClawTouch 内置了**运维管理面板**：技能管理、定时任务、Token 用量统计、模型配置 —— 让它成为你 AI 智能体的轻量级指挥中心。

## 特性

**聊天**
- 基于 Server-Sent Events 的实时流式响应
- 消息队列 + 防抖 —— 连续发送多条消息无需等待
- Agent 繁忙时自动重试，支持递增退避
- Markdown 渲染，支持 GFM 语法
- 图片附件，支持内联预览
- 语音输入（Web Speech API）
- 长按上下文菜单（复制 / 重新编辑 / 删除）

**智能体管理**
- 🧩 **技能面板** —— 从 ClawHub 浏览、安装和管理 OpenClaw 技能
- ⏰ **定时任务面板** —— 查看和控制智能体的定时任务
- 📊 **用量面板** —— Token 使用统计与趋势图表
- ⚙️ **设置面板** —— 模型选择、上下文窗口、历史记录限制

**体验**
- 移动优先的响应式设计（桌面端自适应居中布局）
- 下拉刷新 Gateway 状态
- PWA 就绪，支持离线 Manifest
- Gateway 连接复用（共享 WebSocket 单例）
- Ed25519 设备身份认证

## 快速开始

### 前置要求

- [Node.js](https://nodejs.org/) 20+
- 本地已安装并运行 [OpenClaw](https://github.com/nicepkg/openclaw)

### 安装

```bash
git clone https://github.com/WuXingggg/clawtouch.git
cd clawtouch

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env.local
# 编辑 .env.local，填入你的 Gateway Token

# 启动开发服务器
npm run dev
```

在浏览器中打开 [http://localhost:5173](http://localhost:5173)。

### 生产构建

```bash
npm run build
npm start
```

## 项目架构

```
src/
├── app/
│   ├── page.tsx              # 主聊天界面（渲染所有面板）
│   └── api/
│       ├── chat/route.ts     # 通过 Gateway WebSocket RPC 实现 SSE 流式传输
│       ├── gateway/route.ts  # 健康检查（5s 缓存）
│       ├── skills/route.ts   # ClawHub 技能管理
│       ├── cron/route.ts     # 定时任务 CRUD
│       ├── tokens/route.ts   # 用量统计
│       ├── models/route.ts   # 模型列表
│       └── upload/route.ts   # 文件上传处理
├── hooks/
│   ├── useChat.ts            # 消息队列、流式传输、重试逻辑
│   ├── useAttachments.ts     # 文件上传与预览
│   └── useVoiceInput.ts      # 语音识别
├── components/
│   ├── panels/               # TokenPanel, SkillsPanel, CronPanel, SettingsPanel
│   └── ui/                   # BottomSheet, Card, Badge 等
└── lib/
    ├── gateway-ws.ts         # WebSocket RPC 客户端（Ed25519 认证）
    ├── openclaw.ts           # OpenClaw CLI 封装
    ├── settings.ts           # 用户偏好设置（localStorage）
    └── ...
```

### 与 OpenClaw 的通信方式

ClawTouch 在服务端通过 **WebSocket RPC** 与 OpenClaw Gateway 通信：

```
浏览器 ←→ Next.js API Routes ←→ OpenClaw Gateway (WS 端口 18789)
```

1. 服务端建立与 Gateway 的共享 WebSocket 连接
2. 通过 `connect.challenge` → `connect` 流程完成 Ed25519 设备签名认证
3. 聊天消息通过 `chat.send` RPC 发送，响应以 SSE 流式回传至浏览器
4. 连接在请求间复用（无需每次重新连接）

## 配置项

| 变量 | 默认值 | 说明 |
|------|--------|------|
| `OPENCLAW_GATEWAY_WS_URL` | `ws://127.0.0.1:18789` | Gateway WebSocket 地址 |
| `OPENCLAW_GATEWAY_TOKEN` | — | Gateway 认证令牌 |
| `OPENCLAW_DEVICE_IDENTITY` | `~/.openclaw/identity/device.json` | Ed25519 设备密钥对路径 |
| `OPENCLAW_SESSION_KEY` | `agent:main:clawtouch` | 会话标识符 |
| `OPENCLAW_BIN` | `openclaw` | OpenClaw CLI 二进制路径 |

完整变量列表见 [`.env.example`](.env.example)。

## 技术栈

- **框架**: [Next.js 16](https://nextjs.org/) (App Router + Turbopack)
- **样式**: [Tailwind CSS 4](https://tailwindcss.com/)
- **数据请求**: [SWR](https://swr.vercel.app/)
- **图表**: [Recharts](https://recharts.org/)
- **图标**: [Lucide React](https://lucide.dev/)
- **Markdown**: [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm
- **WebSocket**: [ws](https://github.com/websockets/ws)（服务端 Gateway RPC）

## 许可证

[MIT](LICENSE) — Made with 🦞 by the ClawTouch contributors.
