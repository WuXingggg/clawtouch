"use client";

import { useState } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { TrendChart } from "@/components/tokens/TrendChart";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const periods = [
  { label: "7天", days: 7 },
  { label: "30天", days: 30 },
  { label: "90天", days: 90 },
];

function fmt(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}

export function TokenPanel() {
  const [days, setDays] = useState(30);
  const { data } = useSWR(`/api/tokens?days=${days}`, fetcher);

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
        <p className="text-xs text-text-secondary mb-1">总 Tokens</p>
        <p className="text-2xl font-bold text-primary mb-3">
          {fmt(data?.total?.all || 0)}
        </p>
        <div className="h-px bg-border mb-3" />
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-[11px] text-text-secondary">输入</span>
            </div>
            <p className="text-base font-bold">{fmt(data?.total?.input || 0)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-orange-400" />
              <span className="text-[11px] text-text-secondary">输出</span>
            </div>
            <p className="text-base font-bold">{fmt(data?.total?.output || 0)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400" />
              <span className="text-[11px] text-text-secondary">缓存读</span>
            </div>
            <p className="text-base font-bold">{fmt(data?.total?.cacheRead || 0)}</p>
          </div>
          <div>
            <div className="flex items-center gap-1.5 mb-0.5">
              <span className="w-2 h-2 rounded-full bg-pink-400" />
              <span className="text-[11px] text-text-secondary">缓存写</span>
            </div>
            <p className="text-base font-bold">{fmt(data?.total?.cacheWrite || 0)}</p>
          </div>
        </div>
      </Card>

      {/* Today */}
      <Card>
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">今日使用</span>
          <span className="text-xs text-text-secondary">{data?.today?.date}</span>
        </div>
        <p className="text-2xl font-bold text-primary mt-1">
          {fmt(data?.today?.tokens || 0)}{" "}
          <span className="text-xs font-normal text-text-secondary">tokens</span>
        </p>
      </Card>

      {/* Trend */}
      <Card>
        <p className="text-sm font-medium mb-3">使用趋势</p>
        <TrendChart data={data?.daily || []} />
      </Card>
    </div>
  );
}
