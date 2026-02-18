import { NextRequest } from "next/server";
import { connectToGateway } from "@/lib/gateway-ws";
import { randomUUID } from "crypto";

const SESSION_KEY = process.env.OPENCLAW_SESSION_KEY || "agent:main:main";

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  const lastUserMsg = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === "user");
  if (!lastUserMsg) {
    return new Response(JSON.stringify({ error: "No user message" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const idempotencyKey = randomUUID();

  const stream = new ReadableStream({
    async start(controller) {
      const encoder = new TextEncoder();
      let done = false;
      let lastText = "";

      const cleanup = () => {
        if (!done) {
          done = true;
          try {
            controller.enqueue(encoder.encode("data: [DONE]\n\n"));
            controller.close();
          } catch {
            // already closed
          }
        }
      };

      try {
        const gw = await connectToGateway();

        // Listen for chat stream events
        gw.onEvent((event, payload) => {
          if (done) return;
          if (event !== "chat") return;

          const p = payload as Record<string, unknown>;
          if (!p) return;

          if (p.state === "delta" && p.message) {
            const fullText = extractText(p.message);
            if (fullText && fullText.length > lastText.length) {
              const newContent = fullText.slice(lastText.length);
              lastText = fullText;
              const sseData = JSON.stringify({
                choices: [{ delta: { content: newContent } }],
              });
              controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
            }
          } else if (p.state === "final" || p.state === "aborted") {
            gw.close();
            cleanup();
          } else if (p.state === "error") {
            const errMsg = (p.errorMessage as string) || "Chat error";
            const sseData = JSON.stringify({
              choices: [{ delta: { content: `\n\nError: ${errMsg}` } }],
            });
            controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
            gw.close();
            cleanup();
          }
        });

        // Send the chat message
        await gw.request("chat.send", {
          sessionKey: SESSION_KEY,
          message: lastUserMsg.content,
          deliver: false,
          idempotencyKey,
        });

        // Timeout after 120s
        setTimeout(() => {
          if (!done) {
            gw.close();
            cleanup();
          }
        }, 120000);
      } catch (err) {
        const errMsg = err instanceof Error ? err.message : String(err);
        const sseData = JSON.stringify({
          choices: [{ delta: { content: `连接失败: ${errMsg}` } }],
        });
        controller.enqueue(encoder.encode(`data: ${sseData}\n\n`));
        cleanup();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
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
