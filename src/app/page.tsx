"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TokenPanel } from "@/components/panels/TokenPanel";
import { SkillsPanel } from "@/components/panels/SkillsPanel";
import { CronPanel } from "@/components/panels/CronPanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Message {
  role: "user" | "assistant";
  content: string;
  /** Unique id to track which placeholder to update */
  id?: string;
}

type PanelType = "tokens" | "skills" | "cron" | "settings" | null;

let msgIdCounter = 0;
function nextMsgId() {
  return `msg-${++msgIdCounter}`;
}

export default function HomePage() {
  // Gateway status
  const { data: gateway } = useSWR("/api/gateway", fetcher, {
    refreshInterval: 15000,
  });
  const isOnline = gateway?.online;

  // Chat state
  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("webclaw-chat");
      return saved ? JSON.parse(saved) : [];
    }
    return [];
  });
  const [input, setInput] = useState(() => {
    if (typeof window !== "undefined") {
      return sessionStorage.getItem("webclaw-input") || "";
    }
    return "";
  });
  // Track number of active streams (allows concurrent sends)
  const [activeStreams, setActiveStreams] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  // Track all active abort controllers
  const abortsRef = useRef<Set<AbortController>>(new Set());

  // Panel state
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  // Persist chat & input
  useEffect(() => {
    localStorage.setItem("webclaw-chat", JSON.stringify(messages));
  }, [messages]);

  // On mount: remove trailing empty assistant placeholders (from interrupted requests)
  useEffect(() => {
    setMessages((prev) => {
      const cleaned = prev.filter(
        (m, i) =>
          !(m.role === "assistant" && !m.content && i === prev.length - 1)
      );
      return cleaned.length !== prev.length ? cleaned : prev;
    });
  }, []);

  // Clean up on unmount
  useEffect(() => {
    return () => {
      for (const ac of abortsRef.current) ac.abort();
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem("webclaw-input", input);
  }, [input]);

  // Auto-scroll on new messages
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text) return;

    setInput("");

    // Create unique id for this assistant response placeholder
    const placeholderId = nextMsgId();

    // Add user message + assistant placeholder
    setMessages((prev) => [
      ...prev,
      { role: "user", content: text },
      { role: "assistant", content: "", id: placeholderId },
    ]);

    setActiveStreams((n) => n + 1);

    const abortController = new AbortController();
    abortsRef.current.add(abortController);

    // Helper: update only this placeholder by id
    const updatePlaceholder = (content: string) => {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === placeholderId ? { ...m, content } : m
        )
      );
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: text }],
        }),
        signal: abortController.signal,
      });

      // Validation errors return JSON, not SSE
      if (!res.ok) {
        let errMsg = `Error: ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch {
          /* use default */
        }
        throw new Error(errMsg);
      }

      // Read SSE stream
      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // Process complete SSE events (separated by \n\n)
        const parts = buffer.split("\n\n");
        buffer = parts.pop() || "";

        for (const part of parts) {
          const line = part.trim();
          if (!line.startsWith("data: ")) continue;

          let event: Record<string, unknown>;
          try {
            event = JSON.parse(line.slice(6));
          } catch {
            continue;
          }

          if (event.type === "delta" || event.type === "done") {
            updatePlaceholder((event.text as string) || "");
          } else if (event.type === "error") {
            throw new Error(event.error as string);
          }
        }
      }
    } catch (err) {
      if ((err as Error).name === "AbortError") return;
      const msg = (err as Error)?.message || String(err);
      console.error("[webclaw] chat error:", msg);
      updatePlaceholder(`连接失败: ${msg}`);
    } finally {
      setActiveStreams((n) => n - 1);
      abortsRef.current.delete(abortController);
    }
  }, [input]);

  const handleStopAll = useCallback(() => {
    for (const ac of abortsRef.current) ac.abort();
  }, []);

  const handleClear = () => {
    handleStopAll();
    setMessages([]);
    localStorage.removeItem("webclaw-chat");
  };

  const isStreaming = activeStreams > 0;

  const toolbarItems = [
    {
      key: "status" as const,
      icon: isOnline ? (
        <Wifi size={14} className="text-emerald-500" />
      ) : (
        <WifiOff size={14} className="text-red-400" />
      ),
      label: isOnline ? "在线" : "离线",
      panel: "settings" as PanelType,
    },
    {
      key: "skills",
      icon: <Puzzle size={14} />,
      label: "技能",
      panel: "skills" as PanelType,
    },
    {
      key: "tokens",
      icon: <BarChart3 size={14} />,
      label: "Token",
      panel: "tokens" as PanelType,
    },
    {
      key: "cron",
      icon: <Clock size={14} />,
      label: "定时任务",
      panel: "cron" as PanelType,
    },
    {
      key: "settings",
      icon: <Settings size={14} />,
      label: "设置",
      panel: "settings" as PanelType,
    },
  ];

  const panelTitles: Record<string, string> = {
    tokens: "Token 统计",
    skills: "Skills 管理",
    cron: "定时任务",
    settings: "设置",
  };

  return (
    <div className="flex flex-col h-dvh">
      {/* Header */}
      <header className="flex-shrink-0 flex items-center justify-between h-12 px-4 bg-card/80 backdrop-blur-md border-b border-border">
        <span className="text-base font-semibold">WebClaw</span>
        {messages.length > 0 && (
          <button
            onClick={handleClear}
            className="text-text-secondary p-1.5"
          >
            <Trash2 size={16} />
          </button>
        )}
      </header>

      {/* Chat Messages */}
      <div
        ref={listRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar"
      >
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-text-secondary">
            <p className="text-4xl mb-3">🦞</p>
            <p className="text-sm">向 OpenClaw 发送消息</p>
            <p className="text-xs mt-1 opacity-60">
              {isOnline ? "Gateway 已连接" : "Gateway 未连接"}
            </p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div
            key={msg.id || i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-md whitespace-pre-wrap"
                  : "bg-card text-text shadow-sm rounded-bl-md chat-md"
              }`}
            >
              {msg.content ? (
                msg.role === "assistant" ? (
                  <ReactMarkdown>{msg.content}</ReactMarkdown>
                ) : (
                  msg.content
                )
              ) : msg.role === "assistant" && msg.id ? (
                <span className="thinking-dots text-text-secondary">
                  <span>.</span>
                  <span>.</span>
                  <span>.</span>
                </span>
              ) : (
                ""
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Bottom: Toolbar + Input */}
      <div className="flex-shrink-0 border-t border-border bg-card">
        {/* Capsule Toolbar */}
        <div className="flex gap-2 px-4 pt-2 pb-1 overflow-x-auto no-scrollbar">
          {toolbarItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setActivePanel(item.panel)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                activePanel === item.panel
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-text-secondary"
              }`}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="flex items-end gap-2 px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="输入消息..."
            rows={1}
            className="flex-1 resize-none rounded-xl bg-surface border border-border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32"
          />
          <button
            onClick={isStreaming ? handleStopAll : sendMessage}
            disabled={!isStreaming && !input.trim()}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          >
            {isStreaming ? (
              <Square size={16} fill="currentColor" />
            ) : (
              <Send size={18} />
            )}
          </button>
        </div>
      </div>

      {/* Bottom Sheet Panels */}
      <BottomSheet
        open={activePanel !== null}
        onClose={() => setActivePanel(null)}
        title={activePanel ? panelTitles[activePanel] : ""}
      >
        {activePanel === "tokens" && <TokenPanel />}
        {activePanel === "skills" && <SkillsPanel />}
        {activePanel === "cron" && <CronPanel />}
        {activePanel === "settings" && <SettingsPanel />}
      </BottomSheet>
    </div>
  );
}
