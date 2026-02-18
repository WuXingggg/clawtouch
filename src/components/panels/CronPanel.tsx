"use client";

import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { Play, Pencil } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface CronJob {
  id: string;
  name: string;
  schedule?: { kind: string; expr?: string; tz?: string; at?: string; everyMs?: number };
  enabled?: boolean;
  lastRun?: string;
  payload?: { kind: string; message?: string };
  sessionTarget?: string;
  wakeMode?: string;
  delivery?: { mode?: string; channel?: string; to?: string };
}

interface CronPanelProps {
  onSendMessage?: (text: string) => void;
}

function formatSchedule(s?: CronJob["schedule"]): string {
  if (!s) return "未设置";
  if (s.kind === "cron") return `cron: ${s.expr}${s.tz ? ` (${s.tz})` : ""}`;
  if (s.kind === "at") return `一次性: ${s.at}`;
  if (s.kind === "every") return `每 ${Math.round((s.everyMs || 0) / 60000)} 分钟`;
  return s.kind;
}

export function CronPanel({ onSendMessage }: CronPanelProps) {
  const { data } = useSWR("/api/cron", fetcher);
  const loading = data === undefined;

  const jobs: CronJob[] = Array.isArray(data) ? data : data?.jobs || [];

  const handleRun = (job: CronJob) => {
    const text = job.payload?.message || `执行定时任务: ${job.name}`;
    onSendMessage?.(text);
  };

  const handleEdit = (job: CronJob) => {
    const lines = [
      `我想编辑定时任务「${job.name}」(ID: ${job.id})，当前配置：`,
      `- 定时: ${formatSchedule(job.schedule)}`,
      `- 状态: ${job.enabled !== false ? "启用" : "禁用"}`,
      `- 执行方式: ${job.sessionTarget || "未知"}`,
    ];
    if (job.payload?.message) {
      const preview = job.payload.message.length > 100
        ? job.payload.message.slice(0, 100) + "..."
        : job.payload.message;
      lines.push(`- Prompt: ${preview}`);
    }
    if (job.delivery && job.delivery.mode !== "none") {
      lines.push(`- 投递: ${job.delivery.channel || "默认"}${job.delivery.to ? ` → ${job.delivery.to}` : ""}`);
    }
    lines.push("", "请问你想修改哪些内容？");
    onSendMessage?.(lines.join("\n"));
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-text-secondary animate-pulse">
        加载定时任务...
      </div>
    );
  }

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
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => handleEdit(job)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-slate-100 text-text-secondary text-xs font-medium"
                >
                  <Pencil size={10} />
                  编辑
                </button>
                <button
                  onClick={() => handleRun(job)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  <Play size={10} />
                  执行
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
