import { readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

const CONFIG_PATH =
  process.env.OPENCLAW_CONFIG || join(homedir(), ".openclaw", "openclaw.json");

export async function readConfig(): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    // Strip JSON5 line comments (only outside strings) and trailing commas
    let cleaned = "";
    let inString = false;
    let escape = false;
    for (let i = 0; i < raw.length; i++) {
      const ch = raw[i];
      if (escape) {
        cleaned += ch;
        escape = false;
        continue;
      }
      if (ch === "\\" && inString) {
        cleaned += ch;
        escape = true;
        continue;
      }
      if (ch === '"') {
        inString = !inString;
        cleaned += ch;
        continue;
      }
      if (!inString && ch === "/" && raw[i + 1] === "/") {
        // Skip to end of line
        while (i < raw.length && raw[i] !== "\n") i++;
        cleaned += "\n";
        continue;
      }
      cleaned += ch;
    }
    // Remove trailing commas before } or ]
    cleaned = cleaned.replace(/,\s*([\]}])/g, "$1");
    return JSON.parse(cleaned);
  } catch {
    return {};
  }
}

export async function writeConfig(
  config: Record<string, unknown>
): Promise<void> {
  await writeFile(CONFIG_PATH, JSON.stringify(config, null, 2), "utf-8");
}

export function getConfigPath(): string {
  return CONFIG_PATH;
}
