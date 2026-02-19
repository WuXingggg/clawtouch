"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { TrendChart } from "@/components/tokens/TrendChart";
import { estimateCost, formatCost } from "@/lib/pricing";
import { useT } from "@/lib/i18n";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function TokenPanel() {
  const { t } = useT();
  const [days, setDays] = useState(30);
  const { data } = useSWR(`/api/tokens?days=${days}`, fetcher);

  const periods = [
    { label: t("tokens.days7"), days: 7 },
    { label: t("tokens.days30"), days: 30 },
    { label: t("tokens.days90"), days: 90 },
  ];

  return (
    <div className="space-y-4 py-3">
      {/* Period pills */}
      <div className="flex gap-2">
        {periods.map((p) => (
          <button
            key={p.days}
            onClick={() => setDays(p.days)}
            className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
              days === p.days
                ? "bg-primary text-white"
                : "bg-slate-100 text-text-secondary"
            }`}
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Summary */}
      <Card>
        <p className="text-xs text-text-secondary mb-1">{t("tokens.total")}</p>
        <div className="flex items-baseline gap-2 mb-3">
          <p className="text-2xl font-bold text-primary">
            {fmt(data?.total?.all || 0)}
          </p>
          {data?.total && (
            <span className="text-xs text-text-secondary">
              {formatCost(estimateCost(data.total.input || 0, data.total.output || 0))}
            </span>
          )}
        </div>
        <div className="h-px bg-border mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-[11px] text-text-secondary">{t("tokens.input")}</span>
            </div>
            <p className="text-base font-bold">{fmt(data?.total?.input || 0)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-[11px] text-text-secondary">{t("tokens.output")}</span>
            </div>
            <p className="text-base font-bold">{fmt(data?.total?.output || 0)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-[11px] text-text-secondary">{t("tokens.cacheRead")}</span>
            </div>
            <p className="text-base font-bold">{fmt(data?.total?.cacheRead || 0)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span className="text-[11px] text-text-secondary">{t("tokens.cacheWrite")}</span>
            </div>
            <p className="text-base font-bold">{fmt(data?.total?.cacheWrite || 0)}</p>
          </div>
        </div>
      </Card>

      {/* Today */}
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">{t("tokens.today")}</span>
          <span className="text-xs text-text-secondary">{data?.today?.date}</span>
        </div>
        <div className="flex items-baseline gap-2 mt-1">
          <p className="text-2xl font-bold text-primary">
            {fmt(data?.today?.tokens || 0)}
            <span className="text-xs font-normal text-text-secondary ml-1">tokens</span>
          </p>
          {data?.daily && (() => {
            const todayKey = new Date().toISOString().slice(0, 10);
            const todayDaily = (data.daily as Array<Record<string, number | string>>).find(
              (d) => d.date === todayKey
            );
            if (!todayDaily) return null;
            return (
              <span className="text-xs text-text-secondary">
                {formatCost(estimateCost(
                  (todayDaily.inputTokens as number) || 0,
                  (todayDaily.outputTokens as number) || 0,
                ))}
              </span>
            );
          })()}
        </div>
      </Card>

      {/* Trend */}
      <Card>
        <p className="text-sm font-medium mb-3">{t("tokens.trend")}</p>
        <TrendChart data={data?.daily || []} />
      </Card>
    </div>
  );
}
