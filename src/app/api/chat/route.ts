import { NextRequest, NextResponse } from "next/server";
import { connectToGateway } from "@/lib/gateway-ws";
import { randomUUID } from "crypto";

const SESSION_KEY = process.env.OPENCLAW_SESSION_KEY || "agent:main:main";

export async function POST(request: NextRequest) {
  let body: { messages?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const messages = body.messages;
  if (!Array.isArray(messages)) {
    return NextResponse.json({ error: "Missing messages array" }, { status: 400 });
  }

  const lastUserMsg = [...messages]
    .reverse()
    .find((m: unknown) => (m as Record<string, unknown>)?.role === "user") as
    | { role: string; content: string }
    | undefined;
  if (!lastUserMsg?.content) {
    return NextResponse.json({ error: "No user message" }, { status: 400 });
  }

  try {
    const gw = await connectToGateway();
    const idempotencyKey = randomUUID();

    const result = await new Promise<string>((resolve, reject) => {
      let latestText = "";
      let myRunId: string | null = null;
      let settled = false;

      const finish = (text: string) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        gw.close();
        resolve(text);
      };

      const fail = (err: Error) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        gw.close();
        reject(err);
      };

      const timeout = setTimeout(() => {
        finish(latestText || "(timeout)");
      }, 120000);

      // Buffer events received before we know our runId
      const earlyEvents: Array<Record<string, unknown>> = [];

      const processEvent = (p: Record<string, unknown>) => {
        if (p.state === "delta" && p.message) {
          const text = extractText(p.message);
          if (text) latestText = text;
        } else if (p.state === "final") {
          const finalText = p.message ? extractText(p.message) : null;
          finish(finalText || latestText || "(empty response)");
        } else if (p.state === "aborted") {
          finish(latestText || "(aborted)");
        } else if (p.state === "error") {
          fail(new Error((p.errorMessage as string) || "Chat error"));
        }
      };

      gw.onEvent((event, payload) => {
        if (event !== "chat") return;
        const p = payload as Record<string, unknown>;
        if (!p) return;

        const eventRunId = p.runId as string | undefined;

        if (!myRunId) {
          // Don't know our runId yet — buffer events (skip stale finals)
          if ((p.state === "final" || p.state === "aborted") && !p.message) return;
          earlyEvents.push(p);
          return;
        }

        // Only process events matching our runId
        if (eventRunId && eventRunId !== myRunId) return;
        processEvent(p);
      });

      gw.request("chat.send", {
        sessionKey: SESSION_KEY,
        message: lastUserMsg.content,
        deliver: false,
        idempotencyKey,
      }).then((res) => {
        const r = res as Record<string, unknown> | undefined;
        if (r?.runId) {
          myRunId = r.runId as string;
          // Replay buffered events that match our runId
          for (const evt of earlyEvents) {
            const rid = evt.runId as string | undefined;
            if (!rid || rid === myRunId) processEvent(evt);
          }
          earlyEvents.length = 0;
        }
      }).catch(fail);
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
