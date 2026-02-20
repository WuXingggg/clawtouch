"use client";

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from "react";
import useSWR, { useSWRConfig } from "swr";
import {
  Send,
  Square,
  Puzzle,
  BarChart3,
  Clock,
  Settings,
  Wifi,
  WifiOff,
  Trash2,
  Plus,
  Mic,
  MicOff,
  Image,
  File,
  Camera,
  X,
  RefreshCw,
  Loader2,
  AlertCircle,
  Copy,
  Trash,
  RotateCcw,
  ChevronDown,
  Brain,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TokenPanel } from "@/components/panels/TokenPanel";
import { SkillsPanel } from "@/components/panels/SkillsPanel";
import { CronPanel } from "@/components/panels/CronPanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { useChat } from "@/hooks/useChat";
import { useAttachments } from "@/hooks/useAttachments";
import { useVoiceInput } from "@/hooks/useVoiceInput";
import { I18nProvider, useT } from "@/lib/i18n";
import type { Message } from "@/hooks/useChat";

type PanelType = "tokens" | "skills" | "cron" | "settings" | null;

function ThinkingBlock({ thinking, msgId }: { thinking: string; msgId: string }) {
  const { t } = useT();
  const [expanded, setExpanded] = useState(false);
  return (
    <div className="mb-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1 text-xs text-text-secondary/70 hover:text-text-secondary transition-colors py-0.5"
      >
        <Brain size={12} className="text-purple-400" />
        <span>{t("thinking.label")}</span>
        <ChevronDown
          size={12}
          className={`transition-transform ${expanded ? "rotate-180" : ""}`}
        />
      </button>
      {expanded && (
        <div className="mt-1 pl-4 border-l-2 border-purple-300/30 text-xs text-text-secondary/80 whitespace-pre-wrap leading-relaxed max-h-[300px] overflow-y-auto">
          {thinking}
        </div>
      )}
    </div>
  );
}

const TOOL_KEYS: Record<string, string> = {
  web_search: "tool.web_search",
  read: "tool.read",
  write: "tool.write",
  cron: "tool.cron",
  Bash: "tool.Bash",
  list_files: "tool.list_files",
};

export default function HomePage() {
  return (
    <I18nProvider>
      <HomeContent />
    </I18nProvider>
  );
}

// ── Gateway status caching ──
const GW_CACHE_KEY = "clawtouch-gw-status";
function gwFetcher(url: string) {
  return fetch(url)
    .then((r) => r.json())
    .then((data) => {
      cacheGwStatus(data);
      return data;
    });
}
// Note: Not used as fallbackData to avoid hydration mismatch.
// Gateway status is fetched client-side only via SWR.
function cacheGwStatus(data: unknown) {
  try { sessionStorage.setItem(GW_CACHE_KEY, JSON.stringify(data)); } catch { /* ignore */ }
}

function HomeContent() {
  const { t } = useT();
  const { mutate } = useSWRConfig();
  const { data: gateway } = useSWR("/api/gateway", gwFetcher, {
    refreshInterval: 10000,
    dedupingInterval: 5000,
    errorRetryCount: 3,
    errorRetryInterval: 3000,
  });
  const isOnline = gateway?.online;
  const gatewayLoading = gateway === undefined;

  // ── Core hooks ──
  const {
    messages,
    streaming,
    enqueueMessage,
    flushQueue,
    handleStop,
    clearChat,
    deleteMessage,
  } = useChat();

  const {
    attachments,
    showAttachMenu,
    fileInputRef,
    cameraInputRef,
    galleryInputRef,
    handleFiles,
    removeAttachment,
    clearAttachments,
    toggleAttachMenu,
  } = useAttachments();

  // Start empty to match SSR, restore from sessionStorage after hydration
  const [input, setInput] = useState("");
  const inputHydratedRef = useRef(false);

  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("clawtouch-input");
      if (saved) setInput(saved);
    } catch { /* ignore */ }
    inputHydratedRef.current = true;
  }, []);

  const { isRecording, toggleVoice } = useVoiceInput(setInput);

  // ── UI state ──
  const listRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [activePanel, setActivePanel] = useState<PanelType>(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [mounted, setMounted] = useState(false);

  // Context menu (long-press / right-click)
  const [contextMenu, setContextMenu] = useState<{
    msgId: string;
    msgRole: "user" | "assistant";
    x: number;
    y: number;
  } | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressMoved = useRef(false);

  // Pull-to-refresh
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  // ── Effects ──
  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!inputHydratedRef.current) return;
    sessionStorage.setItem("clawtouch-input", input);
  }, [input]);

  // Scroll to bottom on new messages — useLayoutEffect for immediate scroll,
  // plus a delayed scroll to handle mobile keyboard dismiss resizing viewport
  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "instant" });
  }, []);

  useLayoutEffect(() => {
    scrollToBottom();
    // Delayed scroll to handle viewport resize from keyboard dismiss
    const t = setTimeout(scrollToBottom, 300);
    return () => clearTimeout(t);
  }, [messages, scrollToBottom]);

  // ── Handlers ──
  const autoGrowTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 144) + "px";
  }, []);

  const resetTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
  }, []);

  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    const imageAtts = attachments.filter((a) => a.isImage && a.base64);
    const otherAtts = attachments.filter((a) => !a.isImage || !a.base64);

    let message = text;
    if (otherAtts.length > 0) {
      const attachList = otherAtts.map((a) => `[${t("app.attachment", { name: a.name })}](${a.url})`).join("\n");
      message = message ? `${message}\n\n${attachList}` : attachList;
    }
    if (!message && imageAtts.length > 0) {
      message = t("app.lookAtImage");
    }

    if (attachments.length > 0) clearAttachments();
    if (!message) return;
    setInput("");
    resetTextarea();
    enqueueMessage(message, imageAtts.length > 0 ? imageAtts : undefined);
    flushQueue();
  }, [input, attachments, enqueueMessage, flushQueue, clearAttachments, resetTextarea]);

  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      enqueueMessage(text.trim());
      flushQueue();
    },
    [enqueueMessage, flushQueue]
  );

  const handleClearClick = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true);
      if (confirmClearTimerRef.current) clearTimeout(confirmClearTimerRef.current);
      confirmClearTimerRef.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    setConfirmClear(false);
    if (confirmClearTimerRef.current) clearTimeout(confirmClearTimerRef.current);
    clearChat();
  }, [confirmClear, clearChat]);

  // ── Pull-to-refresh ──
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    const el = listRef.current;
    if (el && el.scrollTop <= 0) {
      pullStartY.current = e.touches[0].clientY;
    } else {
      pullStartY.current = null;
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (pullStartY.current === null || pullRefreshing) return;
    const dy = e.touches[0].clientY - pullStartY.current;
    if (dy > 0) setPullDistance(Math.min(dy * 0.5, 80));
  }, [pullRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 50 && !pullRefreshing) {
      setPullRefreshing(true);
      setPullDistance(50);
      mutate("/api/gateway").finally(() => {
        setPullRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
    pullStartY.current = null;
  }, [pullDistance, pullRefreshing, mutate]);

  // ── Context menu ──
  const handleMsgTouchStart = useCallback((e: React.TouchEvent, msg: Message) => {
    if (!msg.id || !msg.content || msg.msgType === "tool") return;
    longPressMoved.current = false;
    const touch = e.touches[0];
    longPressRef.current = setTimeout(() => {
      if (!longPressMoved.current) {
        if (navigator.vibrate) navigator.vibrate(20);
        setContextMenu({ msgId: msg.id!, msgRole: msg.role, x: touch.clientX, y: touch.clientY });
      }
    }, 500);
  }, []);

  const handleMsgTouchMove = useCallback(() => {
    longPressMoved.current = true;
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  const handleMsgTouchEnd = useCallback(() => {
    if (longPressRef.current) {
      clearTimeout(longPressRef.current);
      longPressRef.current = null;
    }
  }, []);

  const handleCopyMsg = useCallback(() => {
    if (!contextMenu) return;
    const msg = messages.find((m) => m.id === contextMenu.msgId);
    if (msg?.content) {
      navigator.clipboard.writeText(msg.content).catch(() => {
        const ta = document.createElement("textarea");
        ta.value = msg.content;
        ta.style.position = "fixed";
        ta.style.opacity = "0";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      });
    }
    setContextMenu(null);
  }, [contextMenu, messages]);

  const handleDeleteMsg = useCallback(() => {
    if (!contextMenu) return;
    deleteMessage(contextMenu.msgId);
    setContextMenu(null);
  }, [contextMenu, deleteMessage]);

  const handleResendMsg = useCallback(() => {
    if (!contextMenu) return;
    const msg = messages.find((m) => m.id === contextMenu.msgId);
    if (msg?.content && msg.role === "user") {
      setInput(msg.content);
    }
    setContextMenu(null);
  }, [contextMenu, messages]);

  useEffect(() => {
    if (!contextMenu) return;
    const dismiss = () => setContextMenu(null);
    const el = listRef.current;
    el?.addEventListener("scroll", dismiss, { passive: true });
    return () => el?.removeEventListener("scroll", dismiss);
  }, [contextMenu]);

  // ── Toolbar config ──
  const toolbarItems = [
    {
      key: "status" as const,
      icon: gatewayLoading ? (
        <Wifi size={14} className="text-slate-400 animate-pulse" />
      ) : isOnline ? (
        <Wifi size={14} className="text-emerald-500" />
      ) : (
        <WifiOff size={14} className="text-red-400" />
      ),
      label: gatewayLoading ? t("toolbar.detecting") : isOnline ? t("toolbar.online") : t("toolbar.offline"),
      panel: "settings" as PanelType,
    },
    { key: "skills", icon: <Puzzle size={14} />, label: t("toolbar.skills"), panel: "skills" as PanelType },
    { key: "tokens", icon: <BarChart3 size={14} />, label: t("toolbar.token"), panel: "tokens" as PanelType },
    { key: "cron", icon: <Clock size={14} />, label: t("toolbar.cron"), panel: "cron" as PanelType },
    { key: "settings", icon: <Settings size={14} />, label: t("toolbar.settings"), panel: "settings" as PanelType },
  ];

  const panelTitles: Record<string, string> = {
    tokens: t("panel.tokens"),
    skills: t("panel.skills"),
    cron: t("panel.cron"),
    settings: t("panel.settings"),
  };

  // ── Render ──
  return (
    <div className="flex flex-col h-dvh w-full max-w-3xl mx-auto md:border-x md:border-border md:shadow-[0_0_40px_rgba(0,0,0,0.04)] md:bg-surface">
      <header className="flex-shrink-0 flex items-center justify-between h-12 px-4 bg-card/80 backdrop-blur-md border-b border-border">
        <span className="text-base font-semibold">ClawTouch</span>
        {messages.length > 0 && (
          confirmClear ? (
            <button
              onClick={handleClearClick}
              className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white animate-pulse"
            >
              {t("app.confirmClear")}
            </button>
          ) : (
            <button onClick={handleClearClick} className="text-text-secondary p-1.5">
              <Trash2 size={16} />
            </button>
          )
        )}
      </header>

      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 pt-4 pb-2 space-y-3 no-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {pullDistance > 0 && (
          <div
            className="flex justify-center items-center transition-all"
            style={{ height: pullDistance, marginTop: -8 }}
          >
            <RefreshCw
              size={18}
              className={`text-text-secondary transition-transform ${pullRefreshing ? "animate-spin" : ""}`}
              style={{ transform: `rotate(${pullDistance * 3.6}deg)` }}
            />
          </div>
        )}

        {mounted && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <p className="text-4xl mb-3">🦞</p>
            <p className="text-sm">{t("app.sendMessage")}</p>
            <p className="text-xs mt-1 opacity-60">
              {gatewayLoading ? t("app.detectingGateway") : isOnline ? t("app.gatewayConnected") : t("app.gatewayDisconnected")}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {msg.msgType === "tool" ? (
              <div className="flex items-center gap-1.5 px-2 py-1 text-xs text-text-secondary animate-pulse">
                <span>{msg.toolName ? (TOOL_KEYS[msg.toolName] ? t(TOOL_KEYS[msg.toolName]) : t("tool.using", { name: msg.toolName })) : t("tool.default")}</span>
              </div>
            ) : (
              <div className={msg.role === "user" ? "flex flex-col items-end gap-0.5 w-full" : ""}>
                <div
                  className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed select-none ${
                    msg.role === "user"
                      ? "bg-primary text-white rounded-br-md whitespace-pre-wrap"
                      : "bg-card text-text shadow-sm rounded-bl-md chat-md"
                  }${contextMenu?.msgId === msg.id ? " ring-2 ring-primary/40" : ""}`}
                  onTouchStart={(e) => handleMsgTouchStart(e, msg)}
                  onTouchMove={handleMsgTouchMove}
                  onTouchEnd={handleMsgTouchEnd}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    if (msg.id && msg.content && msg.msgType !== "tool") {
                      setContextMenu({ msgId: msg.id, msgRole: msg.role, x: e.clientX, y: e.clientY });
                    }
                  }}
                >
                  {msg.images && msg.images.length > 0 && (
                    <div className="flex gap-1.5 mb-1.5 flex-wrap">
                      {msg.images.map((url, j) => (
                        <img
                          key={j}
                          src={url}
                          alt=""
                          className="rounded-lg max-w-[200px] max-h-[200px] object-cover cursor-pointer"
                          onClick={() => window.open(url, "_blank")}
                          loading="lazy"
                        />
                      ))}
                    </div>
                  )}
                  {msg.role === "assistant" && msg.thinking && (
                    <ThinkingBlock thinking={msg.thinking} msgId={msg.id || String(i)} />
                  )}
                  {msg.content ? (
                    msg.role === "assistant" ? (
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          img: ({ src, alt }) => (
                            <img
                              src={typeof src === "string" ? src : undefined}
                              alt={alt || ""}
                              className="max-w-full rounded-lg my-1 cursor-pointer"
                              onClick={() => typeof src === "string" && window.open(src, "_blank")}
                              loading="lazy"
                            />
                          ),
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : (
                      msg.content
                    )
                  ) : msg.role === "assistant" && msg.id ? (
                    <span className="thinking-dots text-text-secondary">
                      <span>.</span><span>.</span><span>.</span>
                    </span>
                  ) : (
                    ""
                  )}
                </div>
                {msg.role === "user" && msg.status === "sending" && (
                  <Loader2 size={12} className="animate-spin text-primary/50 mr-1" />
                )}
                {msg.role === "user" && msg.status === "queued" && (
                  <span className="text-[10px] text-text-secondary mr-1">{t("app.queued")}</span>
                )}
                {msg.role === "user" && msg.status === "error" && (
                  <AlertCircle size={12} className="text-red-400 mr-1" />
                )}
              </div>
            )}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Context menu */}
      {contextMenu && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setContextMenu(null)} />
          <div
            className="fixed z-50 bg-card rounded-xl shadow-lg border border-border py-1 min-w-[140px] animate-scale-in"
            style={{
              left: Math.min(contextMenu.x, window.innerWidth - 160),
              top: Math.max(8, Math.min(contextMenu.y - 60, window.innerHeight - 200)),
            }}
          >
            <button onClick={handleCopyMsg} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text hover:bg-slate-50 active:bg-slate-100">
              <Copy size={16} className="text-text-secondary" /> {t("ctx.copy")}
            </button>
            {contextMenu.msgRole === "user" && (
              <button onClick={handleResendMsg} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text hover:bg-slate-50 active:bg-slate-100">
                <RotateCcw size={16} className="text-text-secondary" /> {t("ctx.reedit")}
              </button>
            )}
            <button onClick={handleDeleteMsg} className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-slate-50 active:bg-slate-100">
              <Trash size={16} /> {t("ctx.delete")}
            </button>
          </div>
        </>
      )}

      <div className="flex-shrink-0 border-t border-border bg-card">
        <div className="flex gap-2 px-4 pt-2 pb-1 overflow-x-auto no-scrollbar">
          {toolbarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActivePanel(item.panel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activePanel === item.panel ? "bg-primary text-white" : "bg-slate-100 text-text-secondary"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {attachments.length > 0 && (
          <div className="flex gap-2 px-4 pt-1 overflow-x-auto no-scrollbar">
            {attachments.map((att, i) =>
              att.isImage ? (
                <div key={i} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                  <button onClick={() => removeAttachment(i)} className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center">
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div key={i} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-xs text-primary shrink-0">
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button onClick={() => removeAttachment(i)} className="p-0.5"><X size={12} /></button>
                </div>
              )
            )}
          </div>
        )}

        {showAttachMenu && (
          <div className="flex gap-3 px-4 py-2">
            <button onClick={() => galleryInputRef.current?.click()} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-100 text-text-secondary text-[10px] min-w-[56px]">
              <Image size={20} /> {t("app.gallery")}
            </button>
            <button onClick={() => cameraInputRef.current?.click()} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-100 text-text-secondary text-[10px] min-w-[56px]">
              <Camera size={20} /> {t("app.camera")}
            </button>
            <button onClick={() => fileInputRef.current?.click()} className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-100 text-text-secondary text-[10px] min-w-[56px]">
              <File size={20} /> {t("app.file")}
            </button>
          </div>
        )}

        <input ref={fileInputRef} type="file" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <input ref={galleryInputRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => handleFiles(e.target.files)} />
        <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => handleFiles(e.target.files)} />

        <div className="flex items-end gap-2 px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <button onClick={toggleAttachMenu} className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${showAttachMenu ? "bg-primary text-white" : "bg-slate-100 text-text-secondary"}`}>
            <Plus size={20} className={`transition-transform ${showAttachMenu ? "rotate-45" : ""}`} />
          </button>

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); autoGrowTextarea(); }}
            onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); handleSend(); } }}
            placeholder={isRecording ? t("app.listening") : t("app.inputPlaceholder")}
            rows={1}
            autoComplete="off"
            className={`flex-1 resize-none rounded-xl bg-surface border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${isRecording ? "border-red-400 ring-2 ring-red-400/30" : "border-border"}`}
            style={{ maxHeight: 144 }}
          />

          {streaming && (
            <button onClick={handleStop} className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center active:scale-95 transition-transform">
              <Square size={14} fill="currentColor" />
            </button>
          )}

          {input.trim() || attachments.length > 0 ? (
            <button onClick={handleSend} disabled={!input.trim() && attachments.length === 0} className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform">
              <Send size={18} />
            </button>
          ) : (
            <button onClick={toggleVoice} className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${isRecording ? "bg-red-500 text-white animate-pulse" : "bg-slate-100 text-text-secondary"}`}>
              {isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
          )}
        </div>
      </div>

      <BottomSheet
        open={activePanel !== null}
        onClose={() => setActivePanel(null)}
        title={activePanel ? panelTitles[activePanel] : ""}
      >
        {activePanel === "tokens" && <TokenPanel />}
        {activePanel === "skills" && <SkillsPanel />}
        {activePanel === "cron" && (
          <CronPanel onSendMessage={(text) => { setActivePanel(null); sendMessage(text); }} />
        )}
        {activePanel === "settings" && <SettingsPanel />}
      </BottomSheet>
    </div>
  );
}
