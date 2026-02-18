import { runOpenClaw } from "./openclaw";
import { execFile } from "child_process";
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

export async function installHubSkill(slug: string): Promise<{ ok: boolean; error?: string }> {
  const workdir = join(homedir(), ".openclaw");
  return new Promise((resolve) => {
    execFile(
      "clawhub",
      ["install", slug, "--no-input", "--force", "--workdir", workdir],
      { timeout: 60_000, maxBuffer: 10 * 1024 * 1024 },
      (error, _stdout, stderr) => {
        if (error) {
          resolve({ ok: false, error: stderr || error.message });
        } else {
          resolve({ ok: true });
        }
      }
    );
  });
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
