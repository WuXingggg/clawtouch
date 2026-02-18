import { NextRequest, NextResponse } from "next/server";
import { connectToGateway } from "@/lib/gateway-ws";
import { randomUUID } from "crypto";

const SESSION_KEY = process.env.OPENCLAW_SESSION_KEY || "agent:main:main";
const MAX_RETRIES = 10;
const RETRY_DELAYS = [2000, 3000, 5000, 5000, 5000, 5000, 5000, 5000, 5000, 5000]; // ms, ~45s total

export async function POST(request: NextRequest) {
  let body: { messages?: unknown[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid request body" },
      { status: 400 }
    );
  }

  const messages = body.messages;
  if (!Array.isArray(messages)) {
    return NextResponse.json(
      { error: "Missing messages array" },
      { status: 400 }
    );
  }

  const lastUserMsg = [...messages]
    .reverse()
    .find((m: unknown) => (m as Record<string, unknown>)?.role === "user") as
    | { role: string; content: string }
    | undefined;
  if (!lastUserMsg?.content) {
    return NextResponse.json({ error: "No user message" }, { status: 400 });
  }

  // Retry loop: agent may be busy processing another request
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const result = await sendChat(lastUserMsg.content);

      if (result.busy && attempt < MAX_RETRIES) {
        const delay = RETRY_DELAYS[attempt] || 8000;
        console.log(
          `[chat] agent busy, retry ${attempt + 1}/${MAX_RETRIES} in ${delay}ms`
        );
        await sleep(delay);
        continue;
      }

      if (result.busy) {
        return NextResponse.json(
          { error: "Agent 正在处理其他请求，请稍后再试" },
          { status: 503 }
        );
      }

      return NextResponse.json({ content: result.text });
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return NextResponse.json({ error: errMsg }, { status: 502 });
    }
  }

  return NextResponse.json(
    { error: "Agent 正在处理其他请求，请稍后再试" },
    { status: 503 }
  );
}

interface ChatResult {
  text: string;
  busy: boolean;
}

async function sendChat(message: string): Promise<ChatResult> {
  const gw = await connectToGateway();
  const idempotencyKey = randomUUID();

  try {
    return await new Promise<ChatResult>((resolve, reject) => {
      let latestText = "";
      let myRunId: string | null = null;
      let settled = false;
      let gotDelta = false;

      const finish = (text: string, busy = false) => {
        if (settled) return;
        settled = true;
        clearTimeout(timeout);
        gw.close();
        resolve({ text, busy });
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

      const earlyEvents: Array<Record<string, unknown>> = [];

      const processEvent = (p: Record<string, unknown>) => {
        if (p.state === "delta" && p.message) {
          gotDelta = true;
          const text = extractText(p.message);
          if (text) latestText = text;
        } else if (p.state === "final") {
          const finalText = p.message ? extractText(p.message) : null;

          // Detect agent-busy: final with no message and no prior deltas
          if (!finalText && !latestText && !gotDelta) {
            console.log("[chat] agent busy: final with no content, no deltas");
            finish("", true);
            return;
          }

          finish(finalText || latestText || "(empty response)");
        } else if (p.state === "aborted") {
          // Aborted with no content also likely means busy
          if (!latestText && !gotDelta) {
            finish("", true);
            return;
          }
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
          // Skip stale finals/aborts without message before we know our runId
          if (
            (p.state === "final" || p.state === "aborted") &&
            !p.message
          ) {
            return;
          }
          earlyEvents.push(p);
          return;
        }

        // Only process events matching our runId
        if (eventRunId && eventRunId !== myRunId) return;
        processEvent(p);
      });

      gw.request("chat.send", {
        sessionKey: SESSION_KEY,
        message,
        deliver: false,
        idempotencyKey,
      })
        .then((res) => {
          const r = res as Record<string, unknown> | undefined;
          if (r?.runId) {
            myRunId = r.runId as string;
            for (const evt of earlyEvents) {
              const rid = evt.runId as string | undefined;
              if (!rid || rid === myRunId) processEvent(evt);
            }
            earlyEvents.length = 0;
          }
        })
        .catch(fail);
    });
  } catch (err) {
    gw.close();
    throw err;
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

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
