import { NextRequest } from "next/server";
import { connectToGateway } from "@/lib/gateway-ws";
import { randomUUID } from "crypto";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";

const SESSION_KEY = process.env.OPENCLAW_SESSION_KEY || "agent:main:webclaw";
const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

// ── Content block parsing ──

interface TextBlock { type: "text"; text: string }
interface ToolCallBlock { type: "toolCall"; id: string; name: string }
interface ImageBlock { type: "image"; data: string; mimeType: string }
type ContentBlock = TextBlock | ToolCallBlock | ImageBlock;

function parseContentBlocks(message: unknown): ContentBlock[] {
  if (!message || typeof message !== "object") return [];
  const msg = message as Record<string, unknown>;

  if (typeof msg.content === "string") {
    return msg.content ? [{ type: "text", text: msg.content }] : [];
  }

  if (Array.isArray(msg.content)) {
    const blocks: ContentBlock[] = [];
    for (const raw of msg.content) {
      if (!raw || typeof raw !== "object") continue;
      const b = raw as Record<string, unknown>;
      if (b.type === "text" && typeof b.text === "string" && b.text) {
        blocks.push({ type: "text", text: b.text });
      } else if (b.type === "toolCall" && b.name) {
        blocks.push({
          type: "toolCall",
          id: String(b.id || b.name),
          name: String(b.name),
        });
      } else if (b.type === "image" && typeof b.data === "string" && b.data) {
        blocks.push({
          type: "image",
          data: b.data,
          mimeType: (b.mimeType as string) || "image/png",
        });
      }
    }
    return blocks;
  }

  if (typeof msg.text === "string" && msg.text) {
    return [{ type: "text", text: msg.text }];
  }
  return [];
}

// ── Main handler ──

export async function POST(request: NextRequest) {
  let body: {
    messages?: unknown[];
    attachments?: Array<{ mimeType: string; fileName: string; content: string }>;
  };
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const messages = body.messages;
  if (!Array.isArray(messages)) {
    return jsonError("Missing messages array", 400);
  }

  const lastUserMsg = [...messages]
    .reverse()
    .find((m: unknown) => (m as Record<string, unknown>)?.role === "user") as
    | { role: string; content: string }
    | undefined;
  if (!lastUserMsg?.content) {
    return jsonError("No user message", 400);
  }

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let settled = false;

      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch { /* controller already closed */ }
      };

      // Handler refs for cleanup (set after gw connect)
      let eventHandler: ((event: string, payload: unknown) => void) | null = null;
      let closeHandler: (() => void) | null = null;

      const cleanup = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        // Remove our handlers from the shared connection (don't close it!)
        if (gw && eventHandler) gw.offEvent(eventHandler);
        if (gw && closeHandler) gw.offClose(closeHandler);
      };

      const close = () => {
        cleanup();
        try { controller.close(); } catch { /* already closed */ }
      };

      request.signal.addEventListener("abort", () => {
        if (!settled) close();
      });

      // Connect to Gateway with retry
      let gw!: Awaited<ReturnType<typeof connectToGateway>>;
      const GW_RETRIES = 3;
      const GW_RETRY_DELAYS = [0, 1000, 2000];
      for (let attempt = 0; attempt < GW_RETRIES; attempt++) {
        try {
          if (attempt > 0) {
            await new Promise((r) => setTimeout(r, GW_RETRY_DELAYS[attempt]));
          }
          gw = await connectToGateway();
          break;
        } catch (err) {
          if (attempt === GW_RETRIES - 1) {
            send({
              type: "error",
              error: `Gateway 连接失败: ${err instanceof Error ? err.message : String(err)}`,
            });
            close();
            return;
          }
        }
      }

      let idempotencyKey = randomUUID();
      let myRunId: string | null = null;
      let gotDelta = false;
      let agentBusyRetries = 0;
      const AGENT_BUSY_MAX_RETRIES = 3;
      const AGENT_BUSY_DELAYS = [2000, 3000, 5000];

      // Step detection state
      const seenToolIds = new Set<string>();
      const seenImageHashes = new Set<string>();
      let emittedStepCount = 0; // how many text blocks have been finalized as "step"
      let currentStepText = ""; // text of the step currently streaming
      let latestFullText = "";  // all text concatenated (fallback for done)

      // Save response image to disk, return URL
      const saveImage = async (img: ImageBlock): Promise<string | null> => {
        try {
          // Dedup by first 64 chars of base64
          const hash = img.data.slice(0, 64);
          if (seenImageHashes.has(hash)) return null;
          seenImageHashes.add(hash);
          await mkdir(UPLOAD_DIR, { recursive: true });
          const ext = img.mimeType === "image/png" ? ".png" : img.mimeType === "image/gif" ? ".gif" : ".jpg";
          const filename = `${randomUUID()}${ext}`;
          await writeFile(join(UPLOAD_DIR, filename), Buffer.from(img.data, "base64"));
          return `/uploads/${filename}`;
        } catch {
          return null;
        }
      };

      const timeout = setTimeout(() => {
        send({ type: "done", text: currentStepText || latestFullText || "(timeout)" });
        close();
      }, 300_000);

      send({ type: "thinking" });

      const earlyEvents: Array<Record<string, unknown>> = [];

      const processEvent = (p: Record<string, unknown>) => {
        if (settled) return;

        if (p.state === "delta" && p.message) {
          gotDelta = true;
          const blocks = parseContentBlocks(p.message);
          const textBlocks = blocks.filter((b): b is TextBlock => b.type === "text");
          const toolBlocks = blocks.filter((b): b is ToolCallBlock => b.type === "toolCall");

          // Detect new tool calls → emit step boundary
          for (const tc of toolBlocks) {
            if (seenToolIds.has(tc.id)) continue;
            seenToolIds.add(tc.id);

            // Find the text block index just before this tool in the original block order
            const tcIdx = blocks.indexOf(tc);
            let precedingTextIdx = -1;
            for (let i = tcIdx - 1; i >= 0; i--) {
              if (blocks[i].type === "text") {
                precedingTextIdx = textBlocks.indexOf(blocks[i] as TextBlock);
                break;
              }
            }

            // Finalize preceding text as a completed step (if not already emitted)
            if (precedingTextIdx >= emittedStepCount) {
              const stepText = textBlocks[precedingTextIdx].text;
              if (stepText) {
                send({ type: "step", text: stepText });
              }
              emittedStepCount = precedingTextIdx + 1;
              currentStepText = "";
            }

            send({ type: "tool", name: tc.name });
          }

          // Stream the last text block (current step)
          const lastText = textBlocks.length > 0 ? textBlocks[textBlocks.length - 1] : null;
          if (lastText) {
            const lastTextIdx = textBlocks.indexOf(lastText);
            if (lastTextIdx >= emittedStepCount) {
              // This text block hasn't been emitted as a step yet → stream it
              currentStepText = lastText.text;
              send({ type: "delta", text: currentStepText });
            }
          }

          // Emit any new image blocks
          const imageBlocks = blocks.filter((b): b is ImageBlock => b.type === "image");
          for (const img of imageBlocks) {
            saveImage(img).then((url) => {
              if (url) send({ type: "image", url });
            });
          }

          latestFullText = textBlocks.map((b) => b.text).join("\n\n");

        } else if (p.state === "final") {
          const blocks = p.message ? parseContentBlocks(p.message) : [];
          const textBlocks = blocks.filter((b): b is TextBlock => b.type === "text");
          const finalText = textBlocks.length > 0
            ? textBlocks[textBlocks.length - 1].text
            : null;

          if (!finalText && !latestFullText && !gotDelta && seenToolIds.size === 0 && seenImageHashes.size === 0) {
            // Agent busy — auto-retry
            if (agentBusyRetries < AGENT_BUSY_MAX_RETRIES) {
              agentBusyRetries++;
              const delay = AGENT_BUSY_DELAYS[agentBusyRetries - 1] || 5000;
              console.log(`[chat] agent busy, retry ${agentBusyRetries}/${AGENT_BUSY_MAX_RETRIES} in ${delay}ms`);
              send({ type: "thinking" }); // keep client waiting
              setTimeout(async () => {
                try {
                  // Abort any lingering run before retrying
                  try {
                    await gw.request("chat.abort", { sessionKey: SESSION_KEY }, 5000);
                  } catch { /* ignore abort errors */ }

                  // Reset state for retry
                  gotDelta = false;
                  myRunId = null;
                  earlyEvents.length = 0;
                  seenToolIds.clear();
                  seenImageHashes.clear();
                  emittedStepCount = 0;
                  currentStepText = "";
                  latestFullText = "";
                  idempotencyKey = randomUUID();
                  const retryParams: Record<string, unknown> = {
                    sessionKey: SESSION_KEY,
                    message: lastUserMsg.content,
                    deliver: false,
                    idempotencyKey,
                  };
                  if (body.attachments?.length) {
                    retryParams.attachments = body.attachments;
                  }
                  const res = await gw.request("chat.send", retryParams, 30000);
                  const r = res as Record<string, unknown> | undefined;
                  if (r?.runId) {
                    myRunId = r.runId as string;
                    for (const evt of earlyEvents) {
                      const rid = evt.runId as string | undefined;
                      if (!rid || rid === myRunId) processEvent(evt);
                    }
                    earlyEvents.length = 0;
                  }
                } catch (err) {
                  send({ type: "error", error: err instanceof Error ? err.message : String(err) });
                  close();
                }
              }, delay);
              return; // don't close, wait for retry
            }
            send({ type: "error", error: "Agent 正在忙，请稍后重试", retryable: true });
            close();
          } else {
            // If there are un-emitted text blocks before the last one, emit them as steps
            for (let i = emittedStepCount; i < textBlocks.length - 1; i++) {
              send({ type: "step", text: textBlocks[i].text });
            }

            // Save any final image blocks before closing
            const finalImages = blocks.filter((b): b is ImageBlock => b.type === "image");
            const saveAll = finalImages.map((img) => saveImage(img));
            Promise.all(saveAll).then((urls) => {
              for (const url of urls) {
                if (url) send({ type: "image", url });
              }
              send({
                type: "done",
                text: finalText || currentStepText || latestFullText || "(empty response)",
              });
              close();
            });
            return; // close() called in the promise
          }
        } else if (p.state === "aborted") {
          send({ type: "done", text: currentStepText || latestFullText || "(aborted)" });
          close();
        } else if (p.state === "error") {
          send({
            type: "error",
            error: (p.errorMessage as string) || "Chat error",
          });
          close();
        }
      };

      closeHandler = () => {
        if (!settled) {
          send({ type: "done", text: currentStepText || latestFullText || "(连接断开)" });
          close();
        }
      };
      gw.onClose(closeHandler);

      eventHandler = (event: string, payload: unknown) => {
        if (event !== "chat") return;
        const p = payload as Record<string, unknown>;
        if (!p) return;

        const eventRunId = p.runId as string | undefined;

        if (!myRunId) {
          if (
            (p.state === "final" || p.state === "aborted") &&
            !p.message
          ) {
            return;
          }
          earlyEvents.push(p);
          return;
        }

        if (eventRunId && eventRunId !== myRunId) return;
        processEvent(p);
      };
      gw.onEvent(eventHandler);

      try {
        const sendParams: Record<string, unknown> = {
          sessionKey: SESSION_KEY,
          message: lastUserMsg.content,
          deliver: false,
          idempotencyKey,
        };
        if (body.attachments?.length) {
          sendParams.attachments = body.attachments;
        }
        const res = await gw.request("chat.send", sendParams, 30000);
        const r = res as Record<string, unknown> | undefined;
        if (r?.runId) {
          myRunId = r.runId as string;
          for (const evt of earlyEvents) {
            const rid = evt.runId as string | undefined;
            if (!rid || rid === myRunId) processEvent(evt);
          }
          earlyEvents.length = 0;
        }
      } catch (err) {
        send({
          type: "error",
          error: err instanceof Error ? err.message : String(err),
        });
        close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
