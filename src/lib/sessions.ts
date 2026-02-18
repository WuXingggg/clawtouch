import { readdir, readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

// Real path: ~/.openclaw/agents/<agentId>/sessions/
const AGENTS_DIR =
  process.env.OPENCLAW_AGENTS || join(homedir(), ".openclaw", "agents");

interface TokenEntry {
  date: string;
  inputTokens: number;
  outputTokens: number;
  cacheReadTokens: number;
  cacheWriteTokens: number;
}

interface TokenStats {
  total: {
    input: number;
    output: number;
    cacheRead: number;
    cacheWrite: number;
    all: number;
  };
  today: { tokens: number; date: string };
  daily: TokenEntry[];
}

export async function getTokenStats(days: number = 30): Promise<TokenStats> {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const dailyMap = new Map<string, TokenEntry>();
  let totalInput = 0;
  let totalOutput = 0;
  let totalCacheRead = 0;
  let totalCacheWrite = 0;

  try {
    // Scan all agent directories
    const agentDirs = await readdir(AGENTS_DIR, { withFileTypes: true });

    for (const agentDir of agentDirs) {
      if (!agentDir.isDirectory()) continue;
      const sessionsDir = join(AGENTS_DIR, agentDir.name, "sessions");

      let files: string[];
      try {
        files = (await readdir(sessionsDir)).filter((f) => f.endsWith(".jsonl"));
      } catch {
        continue;
      }

      for (const file of files) {
        const content = await readFile(join(sessionsDir, file), "utf-8");
        const lines = content.split("\n").filter(Boolean);

        for (const line of lines) {
          try {
            const event = JSON.parse(line);
            if (!event.timestamp) continue;

            const eventDate = new Date(event.timestamp);
            if (eventDate < cutoff) continue;

            // Usage is nested in message.usage for openclaw
            const usage = event.message?.usage;
            if (!usage) continue;

            const input = usage.input || 0;
            const output = usage.output || 0;
            const cacheRead = usage.cacheRead || 0;
            const cacheWrite = usage.cacheWrite || 0;

            if (input === 0 && output === 0) continue;

            const dateKey = eventDate.toISOString().slice(0, 10);
            totalInput += input;
            totalOutput += output;
            totalCacheRead += cacheRead;
            totalCacheWrite += cacheWrite;

            const existing = dailyMap.get(dateKey) || {
              date: dateKey,
              inputTokens: 0,
              outputTokens: 0,
              cacheReadTokens: 0,
              cacheWriteTokens: 0,
            };
            existing.inputTokens += input;
            existing.outputTokens += output;
            existing.cacheReadTokens += cacheRead;
            existing.cacheWriteTokens += cacheWrite;
            dailyMap.set(dateKey, existing);
          } catch {
            // skip malformed lines
          }
        }
      }
    }
  } catch {
    // agents dir may not exist
  }

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayEntry = dailyMap.get(todayKey);

  const daily = Array.from(dailyMap.values()).sort((a, b) =>
    a.date.localeCompare(b.date)
  );

  return {
    total: {
      input: totalInput,
      output: totalOutput,
      cacheRead: totalCacheRead,
      cacheWrite: totalCacheWrite,
      all: totalInput + totalOutput + totalCacheRead + totalCacheWrite,
    },
    today: {
      tokens: todayEntry
        ? todayEntry.inputTokens +
          todayEntry.outputTokens +
          todayEntry.cacheReadTokens +
          todayEntry.cacheWriteTokens
        : 0,
      date: todayKey,
    },
    daily,
  };
}
