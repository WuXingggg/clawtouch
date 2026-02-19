"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { ChevronDown, Star, Download, Search, X } from "lucide-react";
import { useT } from "@/lib/i18n";
import { getSkillData } from "@/lib/i18n/skills";
import type { HubSkill, SkillDetail } from "@/lib/i18n/skills";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface SkillMissing {
  bins: string[];
  env: string[];
  config: string[];
  os: string[];
}

interface Skill {
  name: string;
  description: string;
  enabled: boolean;
  eligible: boolean;
  disabled: boolean;
  source: string;
  userInvocable: boolean;
  missing: SkillMissing;
}

// ── 折叠区组件 ──
function Section({
  title,
  badge,
  defaultOpen = false,
  children,
}: {
  title: string;
  badge?: React.ReactNode;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-between w-full py-2 text-sm font-medium"
      >
        <div className="flex items-center gap-2">
          {title}
          {badge}
        </div>
        <ChevronDown
          size={16}
          className={`text-text-secondary transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && <div className="space-y-2 pb-3">{children}</div>}
    </div>
  );
}

interface SkillsResponse {
  skills: Skill[];
  hubSlugs: string[];
  slugMap: Record<string, string>; // openclaw name → clawhub slug
}

// Detail modal for skill info
interface DetailTarget {
  name: string;      // display name
  desc: string;      // short description
  skillName?: string; // original openclaw name (for lookup)
  slug?: string;
  source?: string;
  enabled?: boolean;
  eligible?: boolean;
  missing?: SkillMissing;
}

export function SkillsPanel() {
  const { t, locale } = useT();
  const skillData = getSkillData(locale);
  const localNames = skillData.LOCAL_SKILL_NAMES;
  const hubSkills = skillData.CLAWHUB_SKILLS;
  const skillDetails = skillData.SKILL_DETAILS;

  // Build slug → {name, desc} lookup
  const hubLookup: Record<string, { name: string; desc: string }> = {};
  for (const h of hubSkills) {
    hubLookup[h.slug] = { name: h.name, desc: h.desc };
  }

  function displayName(skillName: string, slug?: string): string {
    if (slug && hubLookup[slug]) return hubLookup[slug].name;
    if (hubLookup[skillName]) return hubLookup[skillName].name;
    return skillName;
  }

  function displayDesc(name: string, fallback: string, slug?: string): string {
    if (slug && hubLookup[slug]) return hubLookup[slug].desc;
    if (localNames[name]) return localNames[name];
    if (hubLookup[name]) return hubLookup[name].desc;
    return fallback;
  }

  function getDetail(skillName?: string, slug?: string): SkillDetail | undefined {
    if (slug && skillDetails[slug]) return skillDetails[slug];
    if (skillName && skillDetails[skillName]) return skillDetails[skillName];
    return undefined;
  }

  const { data, mutate } = useSWR<SkillsResponse>("/api/skills", fetcher);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);
  const [installing, setInstalling] = useState<string | null>(null);
  const [installError, setInstallError] = useState<string | null>(null);
  const [justInstalled, setJustInstalled] = useState<Set<string>>(new Set());
  const [detail, setDetail] = useState<DetailTarget | null>(null);
  const loading = data === undefined;

  const allSkills = data?.skills || [];
  const serverHubSlugs = data?.hubSlugs || [];
  const slugMap = data?.slugMap || {};
  const enabled = allSkills.filter((s) => s.enabled);
  const canEnable = allSkills.filter((s) => !s.enabled && s.eligible);
  const unavailable = allSkills.filter((s) => !s.enabled && !s.eligible);
  const disabled = [...canEnable, ...unavailable];

  const getSlug = (name: string) => slugMap[name];

  // Filter by search
  const match = (text: string) =>
    text.toLowerCase().includes(search.toLowerCase());
  const filteredEnabled = search
    ? enabled.filter((s) => {
        const slug = getSlug(s.name);
        return match(s.name) || match(displayName(s.name, slug)) || match(displayDesc(s.name, s.description, slug));
      })
    : enabled;
  const filteredDisabled = search
    ? disabled.filter((s) => {
        const slug = getSlug(s.name);
        return match(s.name) || match(displayName(s.name, slug)) || match(displayDesc(s.name, s.description, slug));
      })
    : disabled;

  // Filter ClawHub skills: exclude already installed + search
  const installedSlugSet = new Set([...serverHubSlugs, ...justInstalled]);
  const filteredHub = hubSkills.filter((h: HubSkill) => {
    if (installedSlugSet.has(h.slug)) return false;
    if (search && !match(h.name) && !match(h.desc) && !match(h.slug)) return false;
    return true;
  });

  const handleToggle = async (name: string, newEnabled: boolean) => {
    setToggling(name);
    await fetch("/api/skills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, enabled: newEnabled }),
    });
    await mutate();
    setToggling(null);
  };

  const handleInstall = async (slug: string) => {
    setInstalling(slug);
    setInstallError(null);
    try {
      const res = await fetch("/api/skills", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug }),
      });
      if (!res.ok) {
        const data = await res.json();
        setInstallError(`${slug}: ${data.error || t("skills.installFailed")}`);
      } else {
        setJustInstalled((prev) => new Set(prev).add(slug));
        await mutate();
      }
    } catch {
      setInstallError(`${slug}: ${t("skills.networkTimeout")}`);
    }
    setInstalling(null);
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-text-secondary animate-pulse">
        {t("skills.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-1 py-3">
      {/* Search */}
      <div className="relative mb-3">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder={t("skills.search")}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-8 pr-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      {/* Enabled skills */}
      <Section
        title={t("skills.enabled")}
        badge={<Badge variant="success">{filteredEnabled.length}</Badge>}
      >
        {filteredEnabled.map((skill) => {
          const slug = getSlug(skill.name);
          const dName = displayName(skill.name, slug);
          const dDesc = displayDesc(skill.name, skill.description, slug);
          return (
            <Card key={skill.name} className="!p-3">
              <div className="flex items-center justify-between gap-2">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setDetail({ name: dName, desc: dDesc, skillName: skill.name, slug, source: skill.source, enabled: skill.enabled, eligible: skill.eligible, missing: skill.missing })}
                >
                  <span className="text-sm font-medium">{dName}</span>
                  <p className="text-[11px] text-text-secondary truncate mt-0.5">
                    {dDesc}
                  </p>
                </div>
                <Toggle
                  checked
                  onChange={() => handleToggle(skill.name, false)}
                  disabled={toggling === skill.name}
                />
              </div>
            </Card>
          );
        })}
        {filteredEnabled.length === 0 && (
          <p className="text-xs text-text-secondary text-center py-2">{t("skills.noMatch")}</p>
        )}
      </Section>

      {/* Disabled skills */}
      <Section
        title={t("skills.disabled")}
        badge={<Badge variant="default">{filteredDisabled.length}</Badge>}
      >
        {filteredDisabled.map((skill) => {
          const slug = getSlug(skill.name);
          const dName = displayName(skill.name, slug);
          const dDesc = displayDesc(skill.name, skill.description, slug);
          const m = skill.missing;
          const hasOsBlock = m.os.length > 0;
          const missingBins = m.bins;
          const missingEnv = m.env;
          const missingConfig = m.config;
          return (
            <Card key={skill.name} className="!p-3">
              <div className="flex items-center justify-between gap-2">
                <div
                  className="flex-1 min-w-0 cursor-pointer"
                  onClick={() => setDetail({ name: dName, desc: dDesc, skillName: skill.name, slug, source: skill.source, enabled: skill.enabled, eligible: skill.eligible, missing: skill.missing })}
                >
                  <span className="text-sm font-medium">{dName}</span>
                  <p className="text-[11px] text-text-secondary truncate mt-0.5">
                    {dDesc}
                  </p>
                  {!skill.eligible && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {hasOsBlock && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-red-100 text-red-600">
                          {t("skills.needsOs", { os: m.os.join("/") })}
                        </span>
                      )}
                      {missingBins.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                          {t("skills.missingBins", { bins: missingBins.join(", ") })}
                        </span>
                      )}
                      {missingEnv.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-100 text-blue-600">
                          {t("skills.needsEnv", { env: missingEnv.join(", ") })}
                        </span>
                      )}
                      {missingConfig.length > 0 && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-100 text-purple-600">
                          {t("skills.missingConfig", { config: missingConfig.join(", ") })}
                        </span>
                      )}
                    </div>
                  )}
                </div>
                {skill.eligible ? (
                  <Toggle
                    checked={false}
                    onChange={() => handleToggle(skill.name, true)}
                    disabled={toggling === skill.name}
                  />
                ) : (
                  <Badge variant="default">{t("skills.missingDeps")}</Badge>
                )}
              </div>
            </Card>
          );
        })}
        {filteredDisabled.length === 0 && (
          <p className="text-xs text-text-secondary text-center py-2">{t("skills.noMatch")}</p>
        )}
      </Section>

      {/* ClawHub marketplace */}
      <Section
        title={t("skills.market")}
        badge={<Badge variant="warning">{filteredHub.length}</Badge>}
      >
        {installError && (
          <div className="text-xs text-red-500 bg-red-50 rounded-lg px-3 py-2 mb-2">
            {installError}
          </div>
        )}
        {filteredHub.map((h: HubSkill) => (
          <Card key={h.slug} className="!p-3">
            <div className="flex items-start justify-between gap-2">
              <div
                className="flex-1 min-w-0 cursor-pointer"
                onClick={() => setDetail({ name: h.name, desc: h.desc, slug: h.slug, source: "clawhub" })}
              >
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">{h.name}</span>
                  <div className="flex items-center gap-2 text-[11px] text-text-secondary">
                    <span className="flex items-center gap-0.5">
                      <Star size={10} className="text-amber-400" fill="currentColor" />
                      {h.stars}
                    </span>
                    <span className="flex items-center gap-0.5">
                      <Download size={10} />
                      {h.installs}
                    </span>
                  </div>
                </div>
                <p className="text-[11px] text-text-secondary mt-0.5">{h.desc}</p>
              </div>
              <button
                onClick={() => handleInstall(h.slug)}
                disabled={installing !== null}
                className={`shrink-0 px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  installing === h.slug
                    ? "bg-primary/20 text-primary animate-pulse"
                    : "bg-primary text-white active:bg-primary/80"
                } disabled:opacity-50`}
              >
                {installing === h.slug ? t("skills.installing") : t("skills.install")}
              </button>
            </div>
          </Card>
        ))}
        {filteredHub.length === 0 && (
          <p className="text-xs text-text-secondary text-center py-2">{t("skills.noMatch")}</p>
        )}
      </Section>

      {/* Skill detail overlay */}
      {detail && (() => {
        const sd = getDetail(detail.skillName, detail.slug);
        const sourceLabel = detail.source === "openclaw-managed" ? t("skills.sourceMarket")
          : detail.source === "openclaw-bundled" ? t("skills.sourceBuiltin")
          : detail.source === "openclaw-extra" ? t("skills.sourceExtra")
          : detail.source === "clawhub" ? t("skills.sourceMarket")
          : detail.source === "user" ? t("skills.sourceUser")
          : detail.source || undefined;
        return (
          <div
            className="fixed inset-0 z-[60] flex items-end justify-center"
            onClick={() => setDetail(null)}
          >
            <div className="absolute inset-0 bg-black/30" />
            <div
              className="relative bg-surface rounded-t-2xl w-full max-h-[70vh] overflow-y-auto animate-slide-up"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-surface pt-3 pb-2 px-4 border-b border-border z-10">
                <div className="w-10 h-1 rounded-full bg-slate-300 mx-auto mb-3" />
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-semibold">{detail.name}</h3>
                  <button
                    onClick={() => setDetail(null)}
                    className="w-7 h-7 rounded-full bg-slate-100 flex items-center justify-center"
                  >
                    <X size={14} className="text-text-secondary" />
                  </button>
                </div>
                {/* Tags row */}
                <div className="flex flex-wrap items-center gap-1.5 mt-2">
                  {sourceLabel && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                      {sourceLabel}
                    </span>
                  )}
                  {detail.enabled !== undefined && (
                    <span className={`text-[10px] px-2 py-0.5 rounded-full ${detail.enabled ? "bg-emerald-100 text-emerald-700" : detail.eligible === false ? "bg-red-50 text-red-500" : "bg-slate-100 text-text-secondary"}`}>
                      {detail.enabled ? t("skills.enabled") : detail.eligible === false ? t("skills.missingDeps") : t("skills.disabled")}
                    </span>
                  )}
                  {detail.slug && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-100 text-text-secondary font-mono">
                      {detail.slug}
                    </span>
                  )}
                </div>
              </div>

              <div className="px-4 py-3 space-y-4">
                {/* Description */}
                <p className="text-sm text-text-primary leading-relaxed">{detail.desc}</p>

                {/* How to use */}
                {sd?.usage && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary mb-1.5">{t("skills.howToUse")}</h4>
                    <p className="text-[13px] text-text-secondary leading-relaxed bg-slate-50 rounded-lg px-3 py-2">
                      {sd.usage}
                    </p>
                  </div>
                )}

                {/* Core value points */}
                {sd?.highlights && sd.highlights.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary mb-1.5">{t("skills.highlights")}</h4>
                    <ul className="space-y-1.5">
                      {sd.highlights.map((h: string, i: number) => (
                        <li key={i} className="flex gap-2 text-[13px] text-text-secondary leading-relaxed">
                          <span className="shrink-0 w-5 h-5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold flex items-center justify-center mt-0.5">
                            {i + 1}
                          </span>
                          <span>{h}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Missing deps */}
                {detail.missing && detail.eligible === false && (
                  <div>
                    <h4 className="text-xs font-semibold text-text-primary mb-1.5">{t("skills.missingDepsTitle")}</h4>
                    <div className="space-y-1 bg-red-50/50 rounded-lg px-3 py-2">
                      {detail.missing.os.length > 0 && (
                        <p className="text-xs text-red-600">{t("skills.needsOsLong", { os: detail.missing.os.join(", ") })}</p>
                      )}
                      {detail.missing.bins.length > 0 && (
                        <p className="text-xs text-amber-700">{t("skills.needsInstall", { bins: detail.missing.bins.join(", ") })}</p>
                      )}
                      {detail.missing.env.length > 0 && (
                        <p className="text-xs text-blue-600">{t("skills.needsEnvLong", { env: detail.missing.env.join(", ") })}</p>
                      )}
                      {detail.missing.config.length > 0 && (
                        <p className="text-xs text-purple-600">{t("skills.needsConfigLong", { config: detail.missing.config.join(", ") })}</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
