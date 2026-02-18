import { readdir, readFile } from "fs/promises";
import { homedir } from "os";
import { join } from "path";
import { readConfig, writeConfig } from "./config";

const SKILLS_DIRS = [
  join(homedir(), ".openclaw", "skills"),
  // Bundled skills path varies by install method
];

export interface Skill {
  name: string;
  description: string;
  enabled: boolean;
  source: string; // directory path
  userInvocable: boolean;
}

async function scanSkillDir(dir: string): Promise<Skill[]> {
  const skills: Skill[] = [];
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;
      const skillMd = join(dir, entry.name, "SKILL.md");
      try {
        const content = await readFile(skillMd, "utf-8");
        const frontmatter = parseFrontmatter(content);
        skills.push({
          name: String(frontmatter.name || entry.name),
          description: String(frontmatter.description || ""),
          enabled: true, // default, will be overridden by config
          source: join(dir, entry.name),
          userInvocable: frontmatter["user-invocable"] !== false,
        });
      } catch {
        // No SKILL.md, skip
      }
    }
  } catch {
    // dir doesn't exist
  }
  return skills;
}

function parseFrontmatter(content: string): Record<string, string | boolean> {
  const match = content.match(/^---\n([\s\S]*?)\n---/);
  if (!match) return {};
  const result: Record<string, string | boolean> = {};
  for (const line of match[1].split("\n")) {
    const [key, ...rest] = line.split(":");
    if (key && rest.length) {
      const val = rest.join(":").trim();
      result[key.trim()] =
        val === "true" ? true : val === "false" ? false : val;
    }
  }
  return result;
}

export async function listSkills(): Promise<Skill[]> {
  const config = await readConfig();
  const skillEntries =
    (config.skills as Record<string, unknown>)?.entries as Record<
      string,
      { enabled?: boolean }
    > || {};

  const allSkills: Skill[] = [];
  for (const dir of SKILLS_DIRS) {
    const skills = await scanSkillDir(dir);
    allSkills.push(...skills);
  }

  // Apply config overrides
  for (const skill of allSkills) {
    const entry = skillEntries[skill.name];
    if (entry && entry.enabled === false) {
      skill.enabled = false;
    }
  }

  return allSkills;
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
