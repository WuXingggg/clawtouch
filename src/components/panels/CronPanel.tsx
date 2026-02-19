"use client";

import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { Play, Pencil } from "lucide-react";
import { useT } from "@/lib/i18n";

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

export function CronPanel({ onSendMessage }: CronPanelProps) {
  const { t } = useT();
  const { data } = useSWR("/api/cron", fetcher);
  const loading = data === undefined;

  const jobs: CronJob[] = Array.isArray(data) ? data : data?.jobs || [];

  function formatSchedule(s?: CronJob["schedule"]): string {
    if (!s) return t("cron.notSet");
    if (s.kind === "cron") return `cron: ${s.expr}${s.tz ? ` (${s.tz})` : ""}`;
    if (s.kind === "at") return t("cron.once", { at: s.at || "" });
    if (s.kind === "every") return t("cron.everyMinutes", { min: Math.round((s.everyMs || 0) / 60000) });
    return s.kind;
  }

  const handleRun = (job: CronJob) => {
    const text = job.payload?.message || t("cron.runTask", { name: job.name });
    onSendMessage?.(text);
  };

  const handleEdit = (job: CronJob) => {
    const lines = [
      t("cron.editPrompt", { name: job.name, id: job.id }),
      `- ${t("cron.scheduleLabel")}: ${formatSchedule(job.schedule)}`,
      `- ${t("cron.statusLabel")}: ${job.enabled !== false ? t("cron.enabled") : t("cron.disabled")}`,
      `- ${t("cron.execMethod")}: ${job.sessionTarget || "unknown"}`,
    ];
    if (job.payload?.message) {
      const preview = job.payload.message.length > 100
        ? job.payload.message.slice(0, 100) + "..."
        : job.payload.message;
      lines.push(`- Prompt: ${preview}`);
    }
    if (job.delivery && job.delivery.mode !== "none") {
      lines.push(`- ${t("cron.delivery")}: ${job.delivery.channel || t("cron.defaultChannel")}${job.delivery.to ? ` → ${job.delivery.to}` : ""}`);
    }
    lines.push("", t("cron.editQuestion"));
    onSendMessage?.(lines.join("\n"));
  };

  if (loading) {
    return (
      <div className="py-8 text-center text-sm text-text-secondary animate-pulse">
        {t("cron.loading")}
      </div>
    );
  }

  return (
    <div className="space-y-3 py-3">
      <div className="flex gap-2">
        <Badge variant="success">
          {t("cron.running")} {jobs.filter((j) => j.enabled !== false).length}
        </Badge>
        <Badge variant="default">{t("cron.total")} {jobs.length}</Badge>
      </div>

      {jobs.length === 0 ? (
        <Empty message={t("cron.empty")} />
      ) : (
        <div className="space-y-2">
          {jobs.map((job) => (
            <Card key={job.id} className="!p-3">
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-sm font-medium">{job.name}</span>
                <Badge variant={job.enabled !== false ? "success" : "default"}>
                  {job.enabled !== false ? t("cron.enabled") : t("cron.disabled")}
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
                  {t("cron.edit")}
                </button>
                <button
                  onClick={() => handleRun(job)}
                  className="flex items-center gap-1 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium"
                >
                  <Play size={10} />
                  {t("cron.execute")}
                </button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
