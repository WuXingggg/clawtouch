import { readFile, writeFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

const CONFIG_PATH =
  process.env.OPENCLAW_CONFIG || join(homedir(), ".openclaw", "openclaw.json");

export async function readConfig(): Promise<Record<string, unknown>> {
  try {
    const raw = await readFile(CONFIG_PATH, "utf-8");
    // Strip comments (JSON5 style) before parsing
    const cleaned = raw.replace(/\/\/.*$/gm, "").replace(/,\s*([\]}])/g, "$1");
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
