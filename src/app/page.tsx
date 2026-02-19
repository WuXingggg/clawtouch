"use client";

import { useState, useRef, useEffect, useCallback } from "react";
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
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { TokenPanel } from "@/components/panels/TokenPanel";
import { SkillsPanel } from "@/components/panels/SkillsPanel";
import { CronPanel } from "@/components/panels/CronPanel";
import { SettingsPanel } from "@/components/panels/SettingsPanel";
import { getSettings } from "@/lib/settings";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Message {
  role: "user" | "assistant";
  content: string;
  id?: string;
  msgType?: "text" | "tool";
  toolName?: string;
  images?: string[]; // image URLs for display
  status?: "sending" | "sent" | "error" | "queued"; // user message status
}

interface Attachment {
  name: string;
  url: string;
  mimeType?: string;
  base64?: string;
  isImage: boolean;
}

type PanelType = "tokens" | "skills" | "cron" | "settings" | null;

const DEBOUNCE_MS = 500;

let msgIdCounter = Date.now();
function nextMsgId() {
  return `msg-${++msgIdCounter}`;
}

// ── Tool indicator display ──
const TOOL_ZH: Record<string, string> = {
  web_search: "搜索中...",
  read: "读取文件...",
  write: "写入文件...",
  cron: "处理定时任务...",
  Bash: "执行命令...",
  list_files: "浏览文件...",
};

function toolLabel(name?: string): string {
  if (!name) return "处理中...";
  return TOOL_ZH[name] || `使用 ${name}...`;
}

/**
 * Message queue with debounce + serial execution.
 * - User can send messages at any time (input never locked)
 * - Messages within DEBOUNCE_MS are merged into one batch
 * - Only one API call runs at a time; next batch waits for current to finish
 */
// Read cached gateway status for instant render, update on each fetch
const GW_CACHE_KEY = "webclaw-gw-status";
function gwFetcher(url: string) {
  return fetch(url)
    .then((r) => r.json())
    .then((data) => {
      try {
        sessionStorage.setItem(GW_CACHE_KEY, JSON.stringify(data));
      } catch { /* ignore */ }
      return data;
    });
}
function getGwFallback() {
  if (typeof window === "undefined") return undefined;
  try {
    const cached = sessionStorage.getItem(GW_CACHE_KEY);
    return cached ? JSON.parse(cached) : undefined;
  } catch {
    return undefined;
  }
}

const FILE_UPLOAD_LIMIT_MB = 10;

export default function HomePage() {
  const { mutate } = useSWRConfig();
  const { data: gateway } = useSWR("/api/gateway", gwFetcher, {
    refreshInterval: 10000,
    dedupingInterval: 5000,
    errorRetryCount: 3,
    errorRetryInterval: 3000,
    fallbackData: getGwFallback(),
  });
  const isOnline = gateway?.online;
  const gatewayLoading = gateway === undefined;

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("webclaw-chat");
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        const limit = getSettings().chatHistoryLimit;
        return parsed.length > limit ? parsed.slice(-limit) : parsed;
      }
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
  const queueRef = useRef<Array<{ text: string; attachments?: Attachment[]; userMsgIds: string[] }>>([]); // pending items
  const batchPlaceholderRef = useRef<string | null>(null); // current batch placeholder id
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false); // is an API call in progress?

  const [activePanel, setActivePanel] = useState<PanelType>(null);

  // Attachments
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [showAttachMenu, setShowAttachMenu] = useState(false);

  // Voice input
  const [isRecording, setIsRecording] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Clear confirmation
  const [confirmClear, setConfirmClear] = useState(false);
  const confirmClearTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Textarea auto-grow
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Context menu (long-press)
  const [contextMenu, setContextMenu] = useState<{
    msgId: string;
    msgRole: "user" | "assistant";
    x: number;
    y: number;
  } | null>(null);
  const longPressRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressMoved = useRef(false);

  // Hydration guard — suppress empty-state flash while client mounts
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);

  // Pull-to-refresh
  const [pullRefreshing, setPullRefreshing] = useState(false);
  const pullStartY = useRef<number | null>(null);
  const [pullDistance, setPullDistance] = useState(0);

  // Persist (with history limit, strip transient status field)
  useEffect(() => {
    const limit = getSettings().chatHistoryLimit;
    const trimmed = messages.length > limit ? messages.slice(-limit) : messages;
    const toSave = trimmed.map(({ status, ...rest }) => rest);
    localStorage.setItem("webclaw-chat", JSON.stringify(toSave));
  }, [messages]);

  useEffect(() => {
    setMessages((prev) => {
      // Remove trailing empty assistant messages and tool indicators from interrupted sessions
      let cleaned = [...prev];
      while (cleaned.length > 0) {
        const last = cleaned[cleaned.length - 1];
        if (last.role === "assistant" && (!last.content || last.msgType === "tool")) {
          cleaned.pop();
        } else {
          break;
        }
      }
      return cleaned.length !== prev.length ? cleaned : prev;
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
    if (runningRef.current) return;
    if (queueRef.current.length === 0) return;

    const items = [...queueRef.current];
    let curPlaceholder = batchPlaceholderRef.current;
    queueRef.current = [];
    batchPlaceholderRef.current = null;

    if (!curPlaceholder) return;

    const mergedText = items.map((i) => i.text).join("\n");
    const allAttachments = items.flatMap((i) => i.attachments || []);
    const batchUserMsgIds = items.flatMap((i) => i.userMsgIds);
    runningRef.current = true;
    setStreaming(true);

    const abortController = new AbortController();
    abortRef.current = abortController;

    // Helper to update user message statuses for this batch
    const updateUserMsgStatus = (status: "sending" | "sent" | "error" | "queued") => {
      if (batchUserMsgIds.length === 0) return;
      setMessages((prev) =>
        prev.map((m) =>
          m.role === "user" && m.id && batchUserMsgIds.includes(m.id)
            ? { ...m, status }
            : m
        )
      );
    };

    const updatePlaceholder = (content: string) => {
      const pid = curPlaceholder!;
      setMessages((prev) =>
        prev.map((m) => (m.id === pid ? { ...m, content } : m))
      );
    };

    // Finalize the current placeholder with text, then create a new empty placeholder
    const finalizeAndCreateNew = (stepText: string) => {
      const oldId = curPlaceholder!;
      const newId = nextMsgId();
      curPlaceholder = newId;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === oldId);
        if (idx === -1) return prev;
        const updated = [...prev];
        updated[idx] = { ...updated[idx], content: stepText };
        updated.splice(idx + 1, 0, {
          role: "assistant",
          content: "",
          id: newId,
        });
        return updated;
      });
    };

    // Insert a tool indicator message, then create a new placeholder after it
    const insertToolIndicator = (name: string) => {
      const oldId = curPlaceholder!;
      const toolId = nextMsgId();
      const newId = nextMsgId();
      curPlaceholder = newId;
      setMessages((prev) => {
        const idx = prev.findIndex((m) => m.id === oldId);
        if (idx === -1) return prev;
        const updated = [...prev];
        const oldMsg = updated[idx];
        if (!oldMsg.content) {
          // Empty placeholder → replace with tool indicator
          updated[idx] = {
            role: "assistant",
            content: "",
            id: toolId,
            msgType: "tool",
            toolName: name,
          };
          updated.splice(idx + 1, 0, {
            role: "assistant",
            content: "",
            id: newId,
          });
        } else {
          // Has content → keep it, insert tool + new placeholder after
          updated.splice(
            idx + 1,
            0,
            {
              role: "assistant",
              content: "",
              id: toolId,
              msgType: "tool",
              toolName: name,
            },
            {
              role: "assistant",
              content: "",
              id: newId,
            }
          );
        }
        return updated;
      });
    };

    const isRetryableError = (msg: string) =>
      /连接失败|Gateway|WebSocket|timeout|ECONNREFUSED|fetch failed|正在忙/i.test(msg);

    const MAX_CLIENT_RETRIES = 2;
    let clientRetry = 0;

    const doFetch = async (): Promise<void> => {
      const apiBody: Record<string, unknown> = {
        messages: [{ role: "user", content: mergedText }],
      };
      // Send image attachments as structured data for gateway
      const imageAtts = allAttachments.filter((a) => a.isImage && a.base64);
      if (imageAtts.length > 0) {
        apiBody.attachments = imageAtts.map((a) => ({
          mimeType: a.mimeType || "image/jpeg",
          fileName: a.name,
          content: a.base64,
        }));
      }

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(apiBody),
        signal: abortController.signal,
      });

      if (!res.ok) {
        let errMsg = `Error: ${res.status}`;
        try {
          const errData = await res.json();
          errMsg = errData.error || errMsg;
        } catch { /* use default */ }
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
          } else if (event.type === "step") {
            finalizeAndCreateNew((event.text as string) || "");
          } else if (event.type === "tool") {
            insertToolIndicator((event.name as string) || "");
          } else if (event.type === "image") {
            // Append image markdown to current message
            const url = event.url as string;
            if (url) {
              const pid = curPlaceholder!;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === pid
                    ? { ...m, content: (m.content ? m.content + "\n\n" : "") + `![](${url})` }
                    : m
                )
              );
            }
          } else if (event.type === "done") {
            updatePlaceholder((event.text as string) || "");
            streamDone = true;
            break;
          } else if (event.type === "error") {
            const err = new Error(event.error as string);
            if (event.retryable) (err as unknown as Record<string, boolean>).retryable = true;
            throw err;
          }
        }
      }
    };

    let batchSuccess = false;
    try {
      await doFetch();
      batchSuccess = true;
    } catch (err) {
      if ((err as Error).name === "AbortError") {
        updateUserMsgStatus("sent");
        return;
      }
      const msg = (err as Error)?.message || String(err);
      const isRetryable = (err as unknown as Record<string, boolean>)?.retryable;

      // Auto-retry for agent-busy (retryable) errors with escalating backoff
      if (isRetryable && clientRetry < MAX_CLIENT_RETRIES) {
        clientRetry++;
        const delay = 3000 * clientRetry;
        console.warn(`[webclaw] agent busy, requeue in ${delay}ms (${clientRetry}/${MAX_CLIENT_RETRIES})`);
        updatePlaceholder("排队中...");
        updateUserMsgStatus("queued");
        try {
          await new Promise((r) => setTimeout(r, delay));
          updatePlaceholder("");
          await doFetch();
          batchSuccess = true;
        } catch (retryErr) {
          if ((retryErr as Error).name === "AbortError") {
            updateUserMsgStatus("sent");
            return;
          }
          const retryMsg = (retryErr as Error)?.message || String(retryErr);
          console.error("[webclaw] agent busy requeue failed:", retryMsg);
          updatePlaceholder(`连接失败: ${retryMsg}`);
        }
      } else if (isRetryableError(msg) && clientRetry < MAX_CLIENT_RETRIES) {
        // Auto-retry for connection errors
        clientRetry++;
        console.warn(`[webclaw] retrying chat (${clientRetry}/${MAX_CLIENT_RETRIES})...`);
        try {
          await new Promise((r) => setTimeout(r, 2000));
          await doFetch();
          batchSuccess = true;
        } catch (retryErr) {
          if ((retryErr as Error).name === "AbortError") {
            updateUserMsgStatus("sent");
            return;
          }
          const retryMsg = (retryErr as Error)?.message || String(retryErr);
          console.error("[webclaw] chat retry failed:", retryMsg);
          updatePlaceholder(`连接失败: ${retryMsg}`);
        }
      } else {
        console.error("[webclaw] chat error:", msg);
        updatePlaceholder(`连接失败: ${msg}`);
      }
    } finally {
      updateUserMsgStatus(batchSuccess ? "sent" : "error");
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
    (text: string, imageAttachments?: Attachment[]) => {
      const userMsgId = nextMsgId();
      const userMsg: Message = { role: "user", content: text, id: userMsgId, status: "sending" };
      if (imageAttachments?.length) {
        userMsg.images = imageAttachments.map((a) => a.url);
      }

      // If no current batch placeholder, create one
      if (!batchPlaceholderRef.current) {
        const id = nextMsgId();
        batchPlaceholderRef.current = id;
        setMessages((prev) => [
          ...prev,
          userMsg,
          { role: "assistant", content: "", id },
        ]);
      } else {
        // Insert user bubble before the placeholder
        const pid = batchPlaceholderRef.current;
        setMessages((prev) => {
          const idx = prev.findIndex((m) => m.id === pid);
          if (idx === -1) return [...prev, userMsg];
          return [
            ...prev.slice(0, idx),
            userMsg,
            ...prev.slice(idx),
          ];
        });
      }

      queueRef.current.push({ text, attachments: imageAttachments, userMsgIds: [userMsgId] });

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

    // Separate image attachments from non-image attachments
    const imageAtts = attachments.filter((a) => a.isImage && a.base64);
    const otherAtts = attachments.filter((a) => !a.isImage || !a.base64);

    // Build message text (non-image attachments use markdown links)
    let message = text;
    if (otherAtts.length > 0) {
      const attachList = otherAtts
        .map((a) => `[附件: ${a.name}](${a.url})`)
        .join("\n");
      message = message ? `${message}\n\n${attachList}` : attachList;
    }

    // For image-only sends with no text
    if (!message && imageAtts.length > 0) {
      message = "请看图片";
    }

    if (attachments.length > 0) setAttachments([]);
    if (!message) return;
    setInput("");
    resetTextarea();
    enqueueMessage(message, imageAtts.length > 0 ? imageAtts : undefined);

    // Flush immediately
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    queueMicrotask(() => processBatch());
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
      queueMicrotask(() => processBatch());
    },
    [enqueueMessage, processBatch]
  );

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const handleClearClick = useCallback(() => {
    if (!confirmClear) {
      setConfirmClear(true);
      if (confirmClearTimerRef.current) clearTimeout(confirmClearTimerRef.current);
      confirmClearTimerRef.current = setTimeout(() => setConfirmClear(false), 3000);
      return;
    }
    // Confirmed — actually clear
    setConfirmClear(false);
    if (confirmClearTimerRef.current) clearTimeout(confirmClearTimerRef.current);
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
  }, [confirmClear]);

  // Attachment handling
  const handleFiles = useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setShowAttachMenu(false);
    for (const file of Array.from(files)) {
      const isImage = file.type.startsWith("image/");
      if (isImage && file.size > FILE_UPLOAD_LIMIT_MB * 1024 * 1024) {
        setAttachments((prev) => [...prev, {
          name: `[超过${FILE_UPLOAD_LIMIT_MB}MB] ${file.name}`, url: "", isImage: false,
        }]);
        continue;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const res = await fetch("/api/upload", { method: "POST", body: formData });
        if (!res.ok) {
          const err = await res.json().catch(() => null);
          throw new Error(err?.error || "Upload failed");
        }
        const data = await res.json();
        setAttachments((prev) => [...prev, {
          name: file.name,
          url: data.url,
          mimeType: data.mimeType,
          base64: data.base64,
          isImage: !!data.base64,
        }]);
      } catch {
        setAttachments((prev) => [...prev, {
          name: file.name, url: `[上传失败] ${file.name}`, isImage: false,
        }]);
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

  // Textarea auto-grow
  const autoGrowTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 144) + "px"; // max ~6 rows
  }, []);

  const resetTextarea = useCallback(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
  }, []);

  // Pull-to-refresh handlers
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
    if (dy > 0) {
      setPullDistance(Math.min(dy * 0.5, 80));
    }
  }, [pullRefreshing]);

  const handleTouchEnd = useCallback(() => {
    if (pullDistance > 50 && !pullRefreshing) {
      setPullRefreshing(true);
      setPullDistance(50);
      // Refresh gateway status
      mutate("/api/gateway").finally(() => {
        setPullRefreshing(false);
        setPullDistance(0);
      });
    } else {
      setPullDistance(0);
    }
    pullStartY.current = null;
  }, [pullDistance, pullRefreshing, mutate]);

  // Long-press context menu handlers
  const handleMsgTouchStart = useCallback((e: React.TouchEvent, msg: Message) => {
    if (!msg.id || !msg.content || msg.msgType === "tool") return;
    longPressMoved.current = false;
    const touch = e.touches[0];
    const x = touch.clientX;
    const y = touch.clientY;
    longPressRef.current = setTimeout(() => {
      if (!longPressMoved.current) {
        // Haptic feedback if available
        if (navigator.vibrate) navigator.vibrate(20);
        setContextMenu({ msgId: msg.id!, msgRole: msg.role, x, y });
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
        // Fallback for older browsers
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
    setMessages((prev) => prev.filter((m) => m.id !== contextMenu.msgId));
    setContextMenu(null);
  }, [contextMenu]);

  const handleResendMsg = useCallback(() => {
    if (!contextMenu) return;
    const msg = messages.find((m) => m.id === contextMenu.msgId);
    if (msg?.content && msg.role === "user") {
      setInput(msg.content);
    }
    setContextMenu(null);
  }, [contextMenu, messages]);

  // Dismiss context menu on scroll or outside tap
  useEffect(() => {
    if (!contextMenu) return;
    const dismiss = () => setContextMenu(null);
    const el = listRef.current;
    el?.addEventListener("scroll", dismiss, { passive: true });
    return () => el?.removeEventListener("scroll", dismiss);
  }, [contextMenu]);

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
      label: gatewayLoading ? "检测中" : isOnline ? "在线" : "离线",
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
    <div className="flex flex-col h-dvh w-full max-w-3xl mx-auto md:border-x md:border-border md:shadow-[0_0_40px_rgba(0,0,0,0.04)] md:bg-surface">
      <header className="flex-shrink-0 flex items-center justify-between h-12 px-4 bg-card/80 backdrop-blur-md border-b border-border">
        <span className="text-base font-semibold">WebClaw</span>
        {messages.length > 0 && (
          confirmClear ? (
            <button
              onClick={handleClearClick}
              className="text-xs px-2 py-1 rounded-lg bg-red-500 text-white animate-pulse"
            >
              确认清除?
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
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 no-scrollbar"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Pull-to-refresh indicator */}
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
            <p className="text-sm">向 OpenClaw 发送消息</p>
            <p className="text-xs mt-1 opacity-60">
              {gatewayLoading ? "正在检测 Gateway..." : isOnline ? "Gateway 已连接" : "Gateway 未连接"}
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
                <span>{toolLabel(msg.toolName)}</span>
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
                      <span>.</span>
                      <span>.</span>
                      <span>.</span>
                    </span>
                  ) : (
                    ""
                  )}
                </div>
                {msg.role === "user" && msg.status === "sending" && (
                  <Loader2 size={12} className="animate-spin text-primary/50 mr-1" />
                )}
                {msg.role === "user" && msg.status === "queued" && (
                  <span className="text-[10px] text-text-secondary mr-1">排队中</span>
                )}
                {msg.role === "user" && msg.status === "error" && (
                  <AlertCircle size={12} className="text-red-400 mr-1" />
                )}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Context menu overlay */}
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
            <button
              onClick={handleCopyMsg}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text hover:bg-slate-50 active:bg-slate-100"
            >
              <Copy size={16} className="text-text-secondary" />
              复制
            </button>
            {contextMenu.msgRole === "user" && (
              <button
                onClick={handleResendMsg}
                className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-text hover:bg-slate-50 active:bg-slate-100"
              >
                <RotateCcw size={16} className="text-text-secondary" />
                重新编辑
              </button>
            )}
            <button
              onClick={handleDeleteMsg}
              className="flex items-center gap-2.5 w-full px-4 py-2.5 text-sm text-red-500 hover:bg-slate-50 active:bg-slate-100"
            >
              <Trash size={16} />
              删除
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
              att.isImage ? (
                <div key={i} className="relative shrink-0 w-16 h-16 rounded-lg overflow-hidden border border-border">
                  <img src={att.url} alt={att.name} className="w-full h-full object-cover" />
                  <button
                    onClick={() => removeAttachment(i)}
                    className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center"
                  >
                    <X size={10} />
                  </button>
                </div>
              ) : (
                <div
                  key={i}
                  className="flex items-center gap-1 px-2 py-1 rounded-lg bg-primary/10 text-xs text-primary shrink-0"
                >
                  <span className="max-w-[120px] truncate">{att.name}</span>
                  <button onClick={() => removeAttachment(i)} className="p-0.5">
                    <X size={12} />
                  </button>
                </div>
              )
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
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              autoGrowTextarea();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSend();
              }
            }}
            placeholder={isRecording ? "正在听..." : "输入消息..."}
            rows={1}
            autoComplete="off"
            className={`flex-1 resize-none rounded-xl bg-surface border px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 ${
              isRecording ? "border-red-400 ring-2 ring-red-400/30" : "border-border"
            }`}
            style={{ maxHeight: 144 }}
          />

          {/* Stop button (shown during streaming) */}
          {streaming && (
            <button
              onClick={handleStop}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-red-500 text-white flex items-center justify-center active:scale-95 transition-transform"
            >
              <Square size={14} fill="currentColor" />
            </button>
          )}

          {/* Voice / Send button */}
          {input.trim() || attachments.length > 0 ? (
            <button
              onClick={handleSend}
              disabled={!input.trim() && attachments.length === 0}
              className="flex-shrink-0 w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center disabled:opacity-40 active:scale-95 transition-transform"
            >
              <Send size={18} />
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
