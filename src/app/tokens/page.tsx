"use client";

import { useState } from "react";
import useSWR from "swr";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { TrendChart } from "@/components/tokens/TrendChart";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

const periods = [
  { label: "7天", days: 7 },
  { label: "30天", days: 30 },
  { label: "90天", days: 90 },
];

export default function TokensPage() {
  const [days, setDays] = useState(30);
  const { data, mutate } = useSWR(`/api/tokens?days=${days}`, fetcher);

  return (
    <div>
      <PageHeader title="Token 统计" showBack onRefresh={() => mutate()} />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Period Selector */}
        <div className="flex gap-2">
          {periods.map((p) => (
            <button
              key={p.days}
              onClick={() => setDays(p.days)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${
                days === p.days
                  ? "bg-primary text-white"
                  : "bg-slate-100 text-text-secondary"
              }`}
            >
              最近 {p.label}
            </button>
          ))}
        </div>

        {/* Total Stats */}
        <Card>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-lg">📊</span>
            <span className="text-sm font-medium text-text-secondary">
              总计统计
            </span>
            <span className="ml-auto text-xs text-text-secondary">
              最近 {days} 天
            </span>
          </div>
          <p className="text-xs text-text-secondary">总 Tokens</p>
          <p className="text-3xl font-bold text-primary mb-3">
            {formatNumber(data?.total?.all || 0)}
          </p>
          <div className="h-px bg-border mb-3" />
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-purple-400" />
                <span className="text-xs text-text-secondary">输入</span>
              </div>
              <p className="text-lg font-bold">
                {formatNumber(data?.total?.input || 0)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-orange-400" />
                <span className="text-xs text-text-secondary">输出</span>
              </div>
              <p className="text-lg font-bold">
                {formatNumber(data?.total?.output || 0)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-cyan-400" />
                <span className="text-xs text-text-secondary">缓存读</span>
              </div>
              <p className="text-lg font-bold">
                {formatNumber(data?.total?.cacheRead || 0)}
              </p>
            </div>
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <span className="w-2 h-2 rounded-full bg-pink-400" />
                <span className="text-xs text-text-secondary">缓存写</span>
              </div>
              <p className="text-lg font-bold">
                {formatNumber(data?.total?.cacheWrite || 0)}
              </p>
            </div>
          </div>
        </Card>

        {/* Today */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-lg">📅</span>
              <span className="text-sm font-medium">今日使用</span>
            </div>
            <span className="text-xs text-text-secondary">
              {data?.today?.date || ""}
            </span>
          </div>
          <p className="text-3xl font-bold text-primary mt-1">
            {formatNumber(data?.today?.tokens || 0)}{" "}
            <span className="text-sm font-normal text-text-secondary">
              tokens
            </span>
          </p>
        </Card>

        {/* Trend Chart */}
        <Card>
          <div className="flex items-center gap-2 mb-4">
            <span className="text-lg">📈</span>
            <span className="text-sm font-medium">使用趋势</span>
          </div>
          <TrendChart data={data?.daily || []} />
        </Card>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
