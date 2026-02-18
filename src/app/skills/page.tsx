"use client";

import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Toggle } from "@/components/ui/Toggle";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { Search } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface Skill {
  name: string;
  description: string;
  enabled: boolean;
  source: string;
  userInvocable: boolean;
}

export default function SkillsPage() {
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
    <div>
      <PageHeader title="Skills 管理" onRefresh={() => mutate()} />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Search */}
        <div className="relative">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-secondary"
          />
          <input
            type="text"
            placeholder="搜索 Skills..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full h-10 pl-9 pr-4 rounded-xl bg-card border border-border text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
          />
        </div>

        {/* Stats */}
        <div className="flex gap-2">
          <Badge variant="success">
            已启用 {filtered.filter((s) => s.enabled).length}
          </Badge>
          <Badge variant="default">
            共 {filtered.length} 个
          </Badge>
        </div>

        {/* Skills List */}
        {filtered.length === 0 ? (
          <Empty message={search ? "未找到匹配的 Skill" : "暂无 Skills"} />
        ) : (
          <div className="space-y-3">
            {filtered.map((skill) => (
              <Card key={skill.name}>
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-sm truncate">
                        {skill.name}
                      </h3>
                      {skill.userInvocable && (
                        <Badge variant="success">可调用</Badge>
                      )}
                    </div>
                    {skill.description && (
                      <p className="text-xs text-text-secondary line-clamp-2">
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
        )}
      </div>
    </div>
  );
}
