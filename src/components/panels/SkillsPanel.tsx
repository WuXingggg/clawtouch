"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { Search } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Skill {
  name: string;
  description: string;
  enabled: boolean;
  userInvocable: boolean;
}

export function SkillsPanel() {
  const { data: skills, mutate } = useSWR<Skill[]>("/api/skills", fetcher);
  const [search, setSearch] = useState("");
  const [toggling, setToggling] = useState<string | null>(null);

  const filtered = (skills || []).filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase())
  );

  const handleToggle = async (name: string, enabled: boolean) => {
    setToggling(name);
    await fetch("/api/skills", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, enabled }),
    });
    await mutate();
    setToggling(null);
  };

  return (
    <div className="space-y-3 py-3">
      {/* Search */}
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary" />
        <input
          type="text"
          placeholder="搜索..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full h-9 pl-8 pr-3 rounded-lg bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
        />
      </div>

      <div className="flex gap-2">
        <Badge variant="success">已启用 {filtered.filter((s) => s.enabled).length}</Badge>
        <Badge variant="default">共 {filtered.length}</Badge>
      </div>

      {/* List */}
      <div className="space-y-2">
        {filtered.map((skill) => (
          <Card key={skill.name} className="!p-3">
            <div className="flex items-center justify-between gap-2">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium truncate">{skill.name}</span>
                  {skill.userInvocable && (
                    <Badge variant="success">可调用</Badge>
                  )}
                </div>
                {skill.description && (
                  <p className="text-[11px] text-text-secondary truncate mt-0.5">
                    {skill.description}
                  </p>
                )}
              </div>
              <Toggle
                checked={skill.enabled}
                onChange={(v) => handleToggle(skill.name, v)}
                disabled={toggling === skill.name}
              />
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
