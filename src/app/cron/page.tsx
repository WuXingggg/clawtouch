"use client";

import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { Play, ChevronRight, Plus } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CronJob {
  id: string;
  name: string;
  schedule?: {
    kind: string;
    expr?: string;
    tz?: string;
  };
  enabled?: boolean;
  lastRun?: string;
  nextRun?: string;
  payload?: {
    kind: string;
    message?: string;
  };
}

export default function CronPage() {
  const { data, mutate } = useSWR("/api/cron", fetcher);
  const [running, setRunning] = useState<string | null>(null);

  const jobs: CronJob[] = Array.isArray(data)
    ? data
    : data?.jobs || [];

  const handleRun = async (id: string) => {
    setRunning(id);
    await fetch(`/api/cron`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run", id }),
    });
    await mutate();
    setRunning(null);
  };

  return (
    <div>
      <PageHeader title="定时任务" onRefresh={() => mutate()} />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Stats */}
        <div className="flex gap-2">
          <Badge variant="success">
            运行中 {jobs.filter((j) => j.enabled !== false).length}
          </Badge>
          <Badge variant="default">共 {jobs.length} 个</Badge>
        </div>

        {/* Job List */}
        {jobs.length === 0 ? (
          <Empty message="暂无定时任务" />
        ) : (
          <div className="space-y-3">
            {jobs.map((job) => (
              <Card key={job.id}>
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm">{job.name}</h3>
                    <Badge
                      variant={
                        job.enabled !== false ? "success" : "default"
                      }
                    >
                      {job.enabled !== false ? "启用" : "禁用"}
                    </Badge>
                  </div>
                  <ChevronRight size={16} className="text-text-secondary" />
                </div>

                {job.schedule && (
                  <p className="text-xs text-text-secondary mb-1">
                    ⏰ {job.schedule.kind === "cron" ? job.schedule.expr : job.schedule.kind}
                    {job.schedule.tz && ` (${job.schedule.tz})`}
                  </p>
                )}

                {job.payload?.message && (
                  <p className="text-xs text-text-secondary mb-2 truncate">
                    💬 {job.payload.message}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-border">
                  <div className="text-[10px] text-text-secondary">
                    {job.lastRun && (
                      <span>上次: {new Date(job.lastRun).toLocaleString("zh-CN")}</span>
                    )}
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRun(job.id);
                    }}
                    disabled={running === job.id}
                    className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium active:bg-primary/20"
                  >
                    <Play size={12} />
                    {running === job.id ? "运行中..." : "执行"}
                  </button>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* FAB */}
        <button className="fixed right-4 bottom-24 w-14 h-14 rounded-full bg-primary text-white shadow-lg flex items-center justify-center active:scale-95 transition-transform">
          <Plus size={24} />
        </button>
      </div>
    </div>
  );
}
