"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import useSWR from "swr";
import {
  Send,
  Loader2,
  Puzzle,
  BarChart3,
  Clock,
  Settings,
  Wifi,
  WifiOff,
  Trash2,
} from "lucide-react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TokenPanel } from "@/components/panels/TokenPanel";
import { SkillsPanel } from "@/components/panels/SkillsPanel";
import { CronPanel } from "@/components/panels/CronPanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Message {
  role: "user" | "assistant";
  content: string;
}

type PanelType = "tokens" | "skills" | "cron" | "settings" | null;

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
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  // Panel state
  const [activePanel, setActivePanel] = useState<PanelType>(null);

  // Persist & scroll
  useEffect(() => {
    localStorage.setItem("webclaw-chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || loading) return;

    const userMsg: Message = { role: "user", content: text };
    const newMessages = [...messages, userMsg];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });

      if (!res.ok) throw new Error(`Error: ${res.status}`);

      const reader = res.body?.getReader();
      if (!reader) throw new Error("No reader");

      const decoder = new TextDecoder();
      let assistantContent = "";
      setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split("\n");

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6);
          if (data === "[DONE]") break;

          try {
            const parsed = JSON.parse(data);
            const delta = parsed.choices?.[0]?.delta?.content;
            if (delta) {
              assistantContent += delta;
              setMessages((prev) => {
                const updated = [...prev];
                updated[updated.length - 1] = {
                  role: "assistant",
                  content: assistantContent,
                };
                return updated;
              });
            }
          } catch {
            // skip
          }
        }
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `连接失败: ${(err as Error).message}` },
      ]);
    } finally {
      setLoading(false);
    }
  }, [input, loading, messages]);

  const handleClear = () => {
    setMessages([]);
    localStorage.removeItem("webclaw-chat");
  };

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
    { key: "skills", icon: <Puzzle size={14} />, label: "技能", panel: "skills" as PanelType },
    { key: "tokens", icon: <BarChart3 size={14} />, label: "Token", panel: "tokens" as PanelType },
    { key: "cron", icon: <Clock size={14} />, label: "定时任务", panel: "cron" as PanelType },
    { key: "settings", icon: <Settings size={14} />, label: "设置", panel: "settings" as PanelType },
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
          <button onClick={handleClear} className="text-text-secondary p-1.5">
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
            key={i}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                msg.role === "user"
                  ? "bg-primary text-white rounded-br-md"
                  : "bg-card text-text shadow-sm rounded-bl-md"
              }`}
            >
              {msg.content ||
                (loading && i === messages.length - 1 ? (
                  <Loader2 size={14} className="animate-spin text-text-secondary" />
                ) : (
                  ""
                ))}
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
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
          >
            {loading ? (
              <Loader2 size={18} className="animate-spin" />
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
