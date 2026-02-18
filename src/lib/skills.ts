import { runOpenClaw } from "./openclaw";

export interface Skill {
  name: string;
  description: string;
  enabled: boolean;    // eligible && !disabled
  eligible: boolean;   // has all dependencies
  disabled: boolean;   // user explicitly disabled
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
        eligible,
        disabled,
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
  if (enabled) {
    // Remove disabled entry (or set enabled: true)
    await runOpenClaw(["config", "set", `skills.entries.${name}.enabled`, "true"]);
  } else {
    await runOpenClaw(["config", "set", `skills.entries.${name}.enabled`, "false"]);
  }
}
