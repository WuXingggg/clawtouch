import type { Locale } from "../index";
import * as zhSkills from "./zh-CN";
import * as enSkills from "./en";

export type { HubSkill, SkillDetail } from "./zh-CN";

export function getSkillData(locale: Locale) {
  return locale === "en" ? enSkills : zhSkills;
}
