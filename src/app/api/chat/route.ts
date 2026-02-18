import { NextRequest, NextResponse } from "next/server";
import { connectToGateway } from "@/lib/gateway-ws";
import { randomUUID } from "crypto";

const SESSION_KEY = process.env.OPENCLAW_SESSION_KEY || "agent:main:main";

export async function POST(request: NextRequest) {
  const { messages } = await request.json();

  const lastUserMsg = [...messages]
    .reverse()
    .find((m: { role: string }) => m.role === "user");
  if (!lastUserMsg) {
    return NextResponse.json({ error: "No user message" }, { status: 400 });
  }

  try {
    const gw = await connectToGateway();
    const idempotencyKey = randomUUID();

    // Wait for the final response
    const result = await new Promise<string>((resolve, reject) => {
      let latestText = "";
      const timeout = setTimeout(() => {
        gw.close();
        reject(new Error("Timeout: 120s"));
      }, 120000);

      gw.onEvent((event, payload) => {
        if (event !== "chat") return;
        const p = payload as Record<string, unknown>;
        if (!p) return;

        if (p.state === "delta" && p.message) {
          const text = extractText(p.message);
          if (text) latestText = text;
        } else if (p.state === "final") {
          clearTimeout(timeout);
          gw.close();
          // final event may contain full message, or use accumulated delta
          const finalText = p.message ? extractText(p.message) : null;
          resolve(finalText || latestText || "(empty response)");
        } else if (p.state === "aborted") {
          clearTimeout(timeout);
          gw.close();
          resolve(latestText || "(aborted)");
        } else if (p.state === "error") {
          clearTimeout(timeout);
          gw.close();
          reject(new Error((p.errorMessage as string) || "Chat error"));
        }
      });

      gw.request("chat.send", {
        sessionKey: SESSION_KEY,
        message: lastUserMsg.content,
        deliver: false,
        idempotencyKey,
      }).catch((err) => {
        clearTimeout(timeout);
        gw.close();
        reject(err);
      });
    });

    return NextResponse.json({ content: result });
  } catch (err) {
    const errMsg = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: errMsg }, { status: 502 });
  }
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
