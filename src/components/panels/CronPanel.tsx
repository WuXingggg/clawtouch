"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { Play } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CronJob {
  id: string;
  name: string;
  schedule?: { kind: string; expr?: string; tz?: string };
  enabled?: boolean;
  lastRun?: string;
  payload?: { kind: string; message?: string };
}

export function CronPanel() {
  const { data, mutate } = useSWR("/api/cron", fetcher);
  const [running, setRunning] = useState<string | null>(null);

  const jobs: CronJob[] = Array.isArray(data) ? data : data?.jobs || [];

  const handleRun = async (id: string) => {
    setRunning(id);
    await fetch("/api/cron", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "run", id }),
    });
    await mutate();
    setRunning(null);
  };

  return (
    <div className="space-y-3 py-3">
      <div className="flex gap-2">
        <Badge variant="success">
          运行中 {jobs.filter((j) => j.enabled !== false).length}
        </Badge>
        <Badge variant="default">共 {jobs.length}</Badge>
      </div>

      {jobs.length === 0 ? (
        <Empty message="暂无定时任务" />
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <Card key={job.id} className="!p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{job.name}</span>
                <Badge variant={job.enabled !== false ? "success" : "default"}>
                  {job.enabled !== false ? "启用" : "禁用"}
                </Badge>
              </div>
              {job.schedule && (
                <p className="text-[11px] text-text-secondary mb-1">
                  ⏰ {job.schedule.kind === "cron" ? job.schedule.expr : job.schedule.kind}
                </p>
              )}
              {job.payload?.message && (
                <p className="text-[11px] text-text-secondary truncate mb-2">
                  💬 {job.payload.message}
                </p>
              )}
              <div className="flex justify-end">
                <button
                  onClick={() => handleRun(job.id)}
                  disabled={running === job.id}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  <Play size={10} />
                  {running === job.id ? "..." : "执行"}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
