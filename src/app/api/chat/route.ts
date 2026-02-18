import { NextRequest } from "next/server";
import { connectToGateway } from "@/lib/gateway-ws";
import { randomUUID } from "crypto";

const SESSION_KEY = process.env.OPENCLAW_SESSION_KEY || "agent:main:webclaw";

export async function POST(request: NextRequest) {
  // Validate request
  let body: { messages?: unknown[] };
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

  // SSE streaming response
  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let settled = false;

      const send = (data: Record<string, unknown>) => {
        try {
          controller.enqueue(
            encoder.encode(`data: ${JSON.stringify(data)}\n\n`)
          );
        } catch {
          /* controller already closed */
        }
      };

      const cleanup = () => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        gw?.close();
      };

      const close = () => {
        cleanup();
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      };

      // Handle client disconnect (page reload, navigation)
      request.signal.addEventListener("abort", () => {
        if (!settled) {
          close();
        }
      });

      // Connect to Gateway
      let gw: Awaited<ReturnType<typeof connectToGateway>> | null = null;
      try {
        gw = await connectToGateway();
      } catch (err) {
        send({
          type: "error",
          error: `Gateway 连接失败: ${err instanceof Error ? err.message : String(err)}`,
        });
        close();
        return;
      }

      const idempotencyKey = randomUUID();
      let latestText = "";
      let myRunId: string | null = null;
      let gotDelta = false;

      const timeout = setTimeout(() => {
        send({ type: "done", text: latestText || "(timeout)" });
        close();
      }, 120_000);

      // Send thinking indicator immediately
      send({ type: "thinking" });

      const earlyEvents: Array<Record<string, unknown>> = [];

      const processEvent = (p: Record<string, unknown>) => {
        if (settled) return;

        if (p.state === "delta" && p.message) {
          gotDelta = true;
          const text = extractText(p.message);
          if (text) {
            latestText = text;
            send({ type: "delta", text });
          }
        } else if (p.state === "final") {
          const finalText = p.message ? extractText(p.message) : null;
          // Detect agent-busy: final with no content and no prior deltas
          if (!finalText && !latestText && !gotDelta) {
            send({ type: "error", error: "Agent 正在忙，请稍后重试" });
          } else {
            send({
              type: "done",
              text: finalText || latestText || "(empty response)",
            });
          }
          close();
        } else if (p.state === "aborted") {
          send({ type: "done", text: latestText || "(aborted)" });
          close();
        } else if (p.state === "error") {
          send({
            type: "error",
            error: (p.errorMessage as string) || "Chat error",
          });
          close();
        }
      };

      gw.onEvent((event, payload) => {
        if (event !== "chat") return;
        const p = payload as Record<string, unknown>;
        if (!p) return;

        const eventRunId = p.runId as string | undefined;

        if (!myRunId) {
          if (
            (p.state === "final" || p.state === "aborted") &&
            !p.message
          ) {
            return; // skip stale events
          }
          earlyEvents.push(p);
          return;
        }

        if (eventRunId && eventRunId !== myRunId) return;
        processEvent(p);
      });

      // Send chat request
      try {
        const res = await gw.request("chat.send", {
          sessionKey: SESSION_KEY,
          message: lastUserMsg.content,
          deliver: false,
          idempotencyKey,
        });
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

function extractText(message: unknown): string | null {
  if (!message || typeof message !== "object") return null;
  const msg = message as Record<string, unknown>;

  if (typeof msg.content === "string") return msg.content;

  if (Array.isArray(msg.content)) {
    const textParts = msg.content
      .filter(
        (block: unknown) =>
          typeof block === "object" &&
          block !== null &&
          (block as Record<string, unknown>).type === "text"
      )
      .map((block: unknown) => (block as Record<string, string>).text)
      .filter(Boolean);
    return textParts.join("") || null;
  }

  if (typeof msg.text === "string") return msg.text;
  return null;
}
