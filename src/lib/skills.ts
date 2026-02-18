import { readConfig, writeConfig } from "./config";
import { runOpenClaw } from "./openclaw";

export interface Skill {
  name: string;
  description: string;
  enabled: boolean;
  source: string;
  userInvocable: boolean;
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
      return {
        name: String(sk.name || ""),
        description: String(sk.description || ""),
        enabled: eligible && !disabled,
        source: String(sk.source || ""),
        userInvocable: true,
      };
    });
  } catch {
    return [];
  }
}

export async function toggleSkill(
  name: string,
  enabled: boolean
): Promise<void> {
  const config = await readConfig();
  if (!config.skills) config.skills = {};
  const skills = config.skills as Record<string, unknown>;
  if (!skills.entries) skills.entries = {};
  const entries = skills.entries as Record<string, { enabled: boolean }>;
  entries[name] = { ...entries[name], enabled };
  await writeConfig(config);
}
