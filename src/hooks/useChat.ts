"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { getSettings } from "@/lib/settings";
import { useT } from "@/lib/i18n";

export interface Message {
  role: "user" | "assistant";
  content: string;
  id?: string;
  msgType?: "text" | "tool";
  toolName?: string;
  images?: string[];
  status?: "sending" | "sent" | "error" | "queued";
}

export interface Attachment {
  name: string;
  url: string;
  mimeType?: string;
  base64?: string;
  isImage: boolean;
}

const DEBOUNCE_MS = 500;

let msgIdCounter = Date.now();
function nextMsgId() {
  return `msg-${++msgIdCounter}`;
}

const isRetryableError = (msg: string) =>
  /连接失败|connection failed|Gateway|WebSocket|timeout|ECONNREFUSED|fetch failed|正在忙|agent.+busy/i.test(msg);

const MAX_CLIENT_RETRIES = 2;

export function useChat() {
  const { t } = useT();
  const tRef = useRef(t);
  tRef.current = t;

  const [messages, setMessages] = useState<Message[]>(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("clawtouch-chat");
      if (saved) {
        const parsed = JSON.parse(saved) as Message[];
        const limit = getSettings().chatHistoryLimit;
        return parsed.length > limit ? parsed.slice(-limit) : parsed;
      }
    }
    return [];
  });

  const [streaming, setStreaming] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  // Queue system
  const queueRef = useRef<Array<{ text: string; attachments?: Attachment[]; userMsgIds: string[] }>>([]);
  const batchPlaceholderRef = useRef<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const runningRef = useRef(false);

  // Persist messages
  useEffect(() => {
    const limit = getSettings().chatHistoryLimit;
    const trimmed = messages.length > limit ? messages.slice(-limit) : messages;
    const toSave = trimmed.map(({ status, ...rest }) => rest);
    localStorage.setItem("clawtouch-chat", JSON.stringify(toSave));
  }, [messages]);

  // Clean up interrupted sessions on mount
  useEffect(() => {
    setMessages((prev) => {
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

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abortRef.current?.abort();
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

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

    const doFetch = async (): Promise<void> => {
      const apiBody: Record<string, unknown> = {
        messages: [{ role: "user", content: mergedText }],
      };
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

    let clientRetry = 0;
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

      if (isRetryable && clientRetry < MAX_CLIENT_RETRIES) {
        clientRetry++;
        const delay = 3000 * clientRetry;
        console.warn(`[clawtouch] agent busy, requeue in ${delay}ms (${clientRetry}/${MAX_CLIENT_RETRIES})`);
        updatePlaceholder(tRef.current("chat.queueing"));
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
          console.error("[clawtouch] agent busy requeue failed:", retryMsg);
          updatePlaceholder(tRef.current("chat.connectionFailed", { msg: retryMsg }));
        }
      } else if (isRetryableError(msg) && clientRetry < MAX_CLIENT_RETRIES) {
        clientRetry++;
        console.warn(`[clawtouch] retrying chat (${clientRetry}/${MAX_CLIENT_RETRIES})...`);
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
          console.error("[clawtouch] chat retry failed:", retryMsg);
          updatePlaceholder(tRef.current("chat.connectionFailed", { msg: retryMsg }));
        }
      } else {
        console.error("[clawtouch] chat error:", msg);
        updatePlaceholder(tRef.current("chat.connectionFailed", { msg }));
      }
    } finally {
      updateUserMsgStatus(batchSuccess ? "sent" : "error");
      runningRef.current = false;
      abortRef.current = null;
      setStreaming(false);

      if (queueRef.current.length > 0) {
        processBatch();
      }
    }
  }, []);

  const enqueueMessage = useCallback(
    (text: string, imageAttachments?: Attachment[]) => {
      const userMsgId = nextMsgId();
      const userMsg: Message = { role: "user", content: text, id: userMsgId, status: "sending" };
      if (imageAttachments?.length) {
        userMsg.images = imageAttachments.map((a) => a.url);
      }

      if (!batchPlaceholderRef.current) {
        const id = nextMsgId();
        batchPlaceholderRef.current = id;
        setMessages((prev) => [
          ...prev,
          userMsg,
          { role: "assistant", content: "", id },
        ]);
      } else {
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

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        debounceRef.current = null;
        processBatch();
      }, DEBOUNCE_MS);
    },
    [processBatch]
  );

  const flushQueue = useCallback(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
      debounceRef.current = null;
    }
    queueMicrotask(() => processBatch());
  }, [processBatch]);

  const handleStop = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const clearChat = useCallback(() => {
    abortRef.current?.abort();
    abortRef.current = null;
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = null;
    queueRef.current = [];
    batchPlaceholderRef.current = null;
    runningRef.current = false;
    setStreaming(false);
    setMessages([]);
    localStorage.removeItem("clawtouch-chat");
  }, []);

  const deleteMessage = useCallback((msgId: string) => {
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
  }, []);

  return {
    messages,
    streaming,
    enqueueMessage,
    flushQueue,
    handleStop,
    clearChat,
    deleteMessage,
  };
}
