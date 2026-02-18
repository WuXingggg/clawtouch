import { readdir, readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

const SESSIONS_DIR =
  process.env.OPENCLAW_SESSIONS || join(homedir(), ".openclaw", "sessions");

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
    const files = await readdir(SESSIONS_DIR);
    const jsonlFiles = files.filter((f) => f.endsWith(".jsonl"));

    for (const file of jsonlFiles) {
      const content = await readFile(join(SESSIONS_DIR, file), "utf-8");
      const lines = content.split("\n").filter(Boolean);

      for (const line of lines) {
        try {
          const event = JSON.parse(line);
          if (!event.timestamp) continue;

          const eventDate = new Date(event.timestamp);
          if (eventDate < cutoff) continue;

          const dateKey = eventDate.toISOString().slice(0, 10);
          const input = event.inputTokens || event.usage?.input_tokens || 0;
          const output = event.outputTokens || event.usage?.output_tokens || 0;
          const cacheRead =
            event.cacheReadTokens ||
            event.usage?.cache_read_input_tokens ||
            0;
          const cacheWrite =
            event.cacheWriteTokens ||
            event.usage?.cache_creation_input_tokens ||
            0;

          if (input === 0 && output === 0) continue;

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
  } catch {
    // sessions dir may not exist
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
