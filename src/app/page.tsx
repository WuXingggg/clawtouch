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
  Plus,
  Mic,
  MicOff,
  Image,
  File,
  Camera,
  X,
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
  id?: string;
}

type PanelType = "tokens" | "skills" | "cron" | "settings" | null;

const DEBOUNCE_MS = 1500;

let msgIdCounter = 0;
function nextMsgId() {
  return `msg-${++msgIdCounter}`;
}

/**
 * Message queue with debounce + serial execution.
 * - User can send messages at any time (input never locked)
 * - Messages within DEBOUNCE_MS are merged into one batch
 * - Only one API call runs at a time; next batch waits for current to finish
 */
export default function HomePage() {
  const { data: gateway } = useSWR("/api/gateway", fetcher, {
    refreshInterval: 15000,
  });
  const isOnline = gateway?.online;

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
  const [streaming, setStreaming] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Queue system
  const queueRef = useRef<string[]>([]); // pending texts to send
  const batchPlaceholderRef = useRef<string | null>(null); // current batch placeholder id
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false); // is an API call in progress?

  const [activePanel, setActivePanel] = useState<PanelType>(null);

  // Attachments
  const [attachments, setAttachments] = useState<{ name: string; url: string }[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Voice input
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Persist
  useEffect(() => {
    localStorage.setItem("webclaw-chat", JSON.stringify(messages));
  }, [messages]);

  useEffect(() => {
    setMessages((prev) => {
      if (prev.length > 0) {
        const last = prev[prev.length - 1];
        if (last.role === "assistant" && !last.content) {
          return prev.slice(0, -1);
        }
      }
      return prev;
    });
  }, []);

  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  useEffect(() => {
    sessionStorage.setItem("webclaw-input", input);
  }, [input]);

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [messages]);

  // Process one batch: merge queued texts, call API, stream response
  const processBatch = useCallback(async () => {
    if (runningRef.current) return; // already running, will be called again when done
    if (queueRef.current.length === 0) return;

    // Grab all pending texts and the placeholder
    const texts = [...queueRef.current];
    const placeholderId = batchPlaceholderRef.current;
    queueRef.current = [];
    batchPlaceholderRef.current = null;

    if (!placeholderId) return;

    const mergedText = texts.join("\n");
    runningRef.current = true;
    setStreaming(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    const updatePlaceholder = (content: string) => {
      setMessages((prev) =>
        prev.map((m) => (m.id === placeholderId ? { ...m, content } : m))
      );
    };

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: mergedText }],
        }),
        signal: abortController.signal,
      });

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

      const reader = res.body!.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let streamDone = false;

      while (!streamDone) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
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

          if (event.type === "delta") {
            updatePlaceholder((event.text as string) || "");
          } else if (event.type === "done") {
            updatePlaceholder((event.text as string) || "");
            streamDone = true;
            break;
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
      runningRef.current = false;
      abortRef.current = null;
      setStreaming(false);

      // If more messages queued while we were running, process next batch
      if (queueRef.current.length > 0) {
        processBatch();
      }
    }
  }, []);

  // Enqueue a message: show user bubble immediately, debounce before sending
  const enqueueMessage = useCallback(
    (text: string) => {
      // If no current batch placeholder, create one
      if (!batchPlaceholderRef.current) {
        const id = nextMsgId();
        batchPlaceholderRef.current = id;
        setMessages((prev) => [
          ...prev,
          { role: "user", content: text },
          { role: "assistant", content: "", id },
        ]);
      } else {
        // Insert user bubble before the placeholder
        const pid = batchPlaceholderRef.current;
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === pid);
          if (idx === -1) return [...prev, { role: "user", content: text }];
          return [
            ...prev.slice(0, idx),
            { role: "user", content: text },
            ...prev.slice(idx),
          ];
        });
      }

      queueRef.current.push(text);

      // Reset debounce timer
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        processBatch();
      }, DEBOUNCE_MS);
    },
    [processBatch]
  );

  // Send button: enqueue + flush immediately (no debounce wait)
  const handleSend = useCallback(() => {
    const text = input.trim();
    if (!text && attachments.length === 0) return;

    // Build message with attachments
    let message = text;
    if (attachments.length > 0) {
      const attachList = attachments
        .map((a) => `[附件: ${a.name}](${a.url})`)
        .join("\n");
      message = message ? `${message}\n\n${attachList}` : attachList;
      setAttachments([]);
    }

    if (!message) return;
    setInput("");
    enqueueMessage(message);

    // Flush immediately
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    // Small delay to let multiple rapid Enter-key presses accumulate
    setTimeout(() => processBatch(), 50);
  }, [input, attachments, enqueueMessage, processBatch]);

  // Send a message programmatically (used by panels)
  const sendMessage = useCallback(
    (text: string) => {
      if (!text.trim()) return;
      enqueueMessage(text.trim());
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
        debounceRef.current = null;
      }
      setTimeout(() => processBatch(), 50);
    },
    [enqueueMessage, processBatch]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleClear = () => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    queueRef.current = [];
    batchPlaceholderRef.current = null;
    runningRef.current = false;
    setStreaming(false);
    setMessages([]);
    localStorage.removeItem("webclaw-chat");
  };

  // Attachment handling
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setShowAttachMenu(false);
    for (const file of Array.from(files)) {
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) throw new Error("Upload failed");
        const data = await res.json();
        setAttachments((prev) => [...prev, { name: file.name, url: data.url }]);
      } catch {
        setAttachments((prev) => [...prev, { name: file.name, url: `[上传失败] ${file.name}` }]);
      }
    }
  }, []);

  const removeAttachment = useCallback((idx: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== idx));
  }, []);

  // Voice input
  const toggleVoice = useCallback(() => {
    if (isRecording) {
      recognitionRef.current?.stop();
      setIsRecording(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("此浏览器不支持语音识别");
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = "zh-CN";
    recognition.continuous = true;
    recognition.interimResults = true;

    let finalTranscript = "";
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interim = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          finalTranscript += transcript;
        } else {
          interim = transcript;
        }
      }
      setInput((prev) => {
        const base = prev.replace(/\u200B.*$/, ""); // remove previous interim
        return finalTranscript + (interim ? "\u200B" + interim : "");
      });
    };

    recognition.onerror = () => {
      setIsRecording(false);
    };

    recognition.onend = () => {
      setIsRecording(false);
      // Clean up zero-width spaces from interim results
      setInput((prev) => prev.replace(/\u200B/g, ""));
    };

    recognitionRef.current = recognition;
    recognition.start();
    setIsRecording(true);
  }, [isRecording]);

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
      <header className="flex-shrink-0 flex items-center justify-between h-12 px-4 bg-card/80 backdrop-blur-md border-b border-border">
        <span className="text-base font-semibold">WebClaw</span>
        {messages.length > 0 && (
          <button onClick={handleClear} className="text-text-secondary p-1.5">
            <Trash2 size={16} />
          </button>
        )}
      </header>

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

      <div className="flex-shrink-0 border-t border-border bg-card">
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

        {/* Attachment preview */}
        {attachments.length > 0 && (
          <div className="flex gap-2 px-4 pt-1 overflow-x-auto no-scrollbar">
            {attachments.map((att, i) => (
              <div
                key={i}
                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-xs text-primary shrink-0"
              >
                <span className="max-w-[120px] truncate">{att.name}</span>
                <button onClick={() => removeAttachment(i)} className="p-0.5">
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Attachment menu */}
        {showAttachMenu && (
          <div className="flex gap-3 px-4 py-2">
            <button
              onClick={() => galleryInputRef.current?.click()}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-100 text-text-secondary text-[10px] min-w-[56px]"
            >
              <Image size={20} />
              图库
            </button>
            <button
              onClick={() => cameraInputRef.current?.click()}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-100 text-text-secondary text-[10px] min-w-[56px]"
            >
              <Camera size={20} />
              拍照
            </button>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center gap-1 p-2 rounded-xl bg-slate-100 text-text-secondary text-[10px] min-w-[56px]"
            >
              <File size={20} />
              文件
            </button>
          </div>
        )}

        {/* Hidden file inputs */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={galleryInputRef}
          type="file"
          accept="image/*,video/*"
          multiple
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />

        <div className="flex items-end gap-2 px-4 py-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]">
          {/* Attach button */}
          <button
            onClick={() => setShowAttachMenu((v) => !v)}
            className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
              showAttachMenu
                ? "bg-primary text-white"
                : "bg-slate-100 text-text-secondary"
            }`}
          >
            <Plus size={20} className={`transition-transform ${showAttachMenu ? "rotate-45" : ""}`} />
          </button>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isRecording ? "正在听..." : "输入消息..."}
            rows={1}
            autoComplete="off"
            className={`flex-1 resize-none rounded-xl bg-surface border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 max-h-32 ${
              isRecording ? "border-red-400 ring-2 ring-red-400/30" : "border-border"
            }`}
          />

          {/* Voice / Send button */}
          {input.trim() || attachments.length > 0 || streaming ? (
            <button
              onClick={streaming ? handleStop : handleSend}
              disabled={!streaming && !input.trim() && attachments.length === 0}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            >
              {streaming ? (
                <Square size={16} fill="currentColor" />
              ) : (
                <Send size={18} />
              )}
            </button>
          ) : (
            <button
              onClick={toggleVoice}
              className={`flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center active:scale-95 transition-all ${
                isRecording
                  ? "bg-red-500 text-white animate-pulse"
                  : "bg-slate-100 text-text-secondary"
              }`}
            >
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
          <CronPanel
            onSendMessage={(text) => {
              setActivePanel(null);
              sendMessage(text);
            }}
          />
        )}
        {activePanel === "settings" && <SettingsPanel />}
      </BottomSheet>
    </div>
  );
}
