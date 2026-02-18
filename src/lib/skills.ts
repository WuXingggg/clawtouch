import { runOpenClaw } from "./openclaw";
import { execFile } from "child_process";
import { readdir, readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";

export interface SkillMissing {
  bins: string[];
  env: string[];
  config: string[];
  os: string[];
}

export interface Skill {
  name: string;
  description: string;
  enabled: boolean;    // eligible && !disabled
  eligible: boolean;   // has all dependencies
  disabled: boolean;   // user explicitly disabled
  source: string;
  slug?: string;       // ClawHub slug (for managed/installed skills)
  userInvocable: boolean;
  missing: SkillMissing;
}

export async function listSkills(): Promise<Skill[]> {
  try {
    const { stdout } = await runOpenClaw(["skills", "list", "--json"]);
    const jsonStart = stdout.search(/[\[{]/);
    if (jsonStart === -1) return [];
    const data = JSON.parse(stdout.slice(jsonStart));
    const skills: unknown[] = data.skills || data;

    return skills.map((s: unknown) => {
      const sk = s as Record<string, unknown>;
      const eligible = sk.eligible === true;
      const disabled = sk.disabled === true;
      const m = (sk.missing || {}) as Record<string, unknown>;
      return {
        name: String(sk.name || ""),
        description: String(sk.description || ""),
        enabled: eligible && !disabled,
        eligible,
        disabled,
        source: String(sk.source || ""),
        userInvocable: true,
        missing: {
          bins: Array.isArray(m.bins) ? m.bins.map(String) : [],
          env: Array.isArray(m.env) ? m.env.map(String) : [],
          config: Array.isArray(m.config) ? m.config.map(String) : [],
          os: Array.isArray(m.os) ? m.os.map(String) : [],
        },
      };
    });
  } catch {
    return [];
  }
}

function runClawHub(slug: string, workdir: string): Promise<{ ok: boolean; error?: string }> {
  return new Promise((resolve) => {
    execFile(
      "clawhub",
      ["install", slug, "--no-input", "--force", "--workdir", workdir],
      { timeout: 60_000, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          // Combine stderr + stdout for full error context
          const msg = (stderr + "\n" + stdout).trim() || error.message;
          resolve({ ok: false, error: msg });
        } else {
          resolve({ ok: true });
        }
      }
    );
  });
}

export async function installHubSkill(slug: string): Promise<{ ok: boolean; error?: string }> {
  const workdir = join(homedir(), ".openclaw");
  const delays = [0, 5_000, 10_000];
  for (let i = 0; i < delays.length; i++) {
    if (delays[i] > 0) await new Promise((r) => setTimeout(r, delays[i]));
    const result = await runClawHub(slug, workdir);
    if (result.ok) return result;
    const isRateLimit = result.error?.toLowerCase().includes("rate limit");
    if (!isRateLimit || i === delays.length - 1) {
      return {
        ok: false,
        error: isRateLimit
          ? "ClawHub 请求频率限制，请稍后再试"
          : result.error,
      };
    }
  }
  return { ok: false, error: "安装失败" };
}

/** Scan ~/.openclaw/skills/ to get installed ClawHub slugs (dir names) */
export async function installedHubSlugs(): Promise<string[]> {
  try {
    const dir = join(homedir(), ".openclaw", "skills");
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter((e) => e.isDirectory()).map((e) => e.name);
  } catch {
    return [];
  }
}

/** Build mapping: openclaw skill name → ClawHub slug by reading SKILL.md name: field */
export async function buildNameToSlugMap(): Promise<Record<string, string>> {
  const map: Record<string, string> = {};
  try {
    const dir = join(homedir(), ".openclaw", "skills");
    const entries = await readdir(dir, { withFileTypes: true });
    await Promise.all(
      entries.filter((e) => e.isDirectory()).map(async (e) => {
        const slug = e.name;
        try {
          const skillMd = await readFile(join(dir, slug, "SKILL.md"), "utf-8");
          const nameMatch = skillMd.match(/^name:\s*(.+)/m);
          if (nameMatch) {
            map[nameMatch[1].trim()] = slug;
          }
        } catch { /* no SKILL.md, skip */ }
      })
    );
  } catch { /* skills dir doesn't exist */ }
  return map;
}

export async function toggleSkill(
  name: string,
  enabled: boolean
): Promise<void> {
  if (enabled) {
    // Remove disabled entry (or set enabled: true)
    await runOpenClaw(["config", "set", `skills.entries.${name}.enabled`, "true"]);
  } else {
    await runOpenClaw(["config", "set", `skills.entries.${name}.enabled`, "false"]);
  }
}
