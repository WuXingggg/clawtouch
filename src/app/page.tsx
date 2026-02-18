"use client";

import useSWR from "swr";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { StatCard } from "@/components/ui/StatCard";
import { Badge } from "@/components/ui/Badge";
import { Settings, Wifi, WifiOff } from "lucide-react";
import Link from "next/link";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export default function HomePage() {
  const { data: gateway, mutate: refreshGateway } = useSWR(
    "/api/gateway",
    fetcher,
    { refreshInterval: 10000 }
  );
  const { data: tokens } = useSWR("/api/tokens?days=1", fetcher);
  const { data: skills } = useSWR("/api/skills", fetcher);
  const { data: crons } = useSWR("/api/cron", fetcher);

  const isOnline = gateway?.online;

  return (
    <div>
      <PageHeader
        title="WebClaw"
        onRefresh={() => refreshGateway()}
        right={
          <Link href="/models" className="text-text-secondary p-1">
            <Settings size={18} />
          </Link>
        }
      />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Gateway Status */}
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {isOnline ? (
                <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                  <Wifi size={20} className="text-emerald-600" />
                </div>
              ) : (
                <div className="w-10 h-10 rounded-full bg-red-100 flex items-center justify-center">
                  <WifiOff size={20} className="text-red-500" />
                </div>
              )}
              <div>
                <p className="font-semibold">Gateway</p>
                <p className="text-xs text-text-secondary">
                  {gateway?.version || "未连接"}
                </p>
              </div>
            </div>
            <Badge variant={isOnline ? "success" : "danger"}>
              {isOnline ? "在线" : "离线"}
            </Badge>
          </div>
        </Card>

        {/* Quick Stats */}
        <div className="grid grid-cols-3 gap-3">
          <StatCard
            label="今日 Token"
            value={formatNumber(tokens?.today?.tokens || 0)}
            color="text-primary"
          />
          <StatCard
            label="Skills"
            value={Array.isArray(skills) ? skills.length : 0}
            color="text-accent"
          />
          <StatCard
            label="定时任务"
            value={Array.isArray(crons) ? crons.length : crons?.jobs?.length || 0}
            color="text-amber-500"
          />
        </div>

        {/* Quick Links */}
        <div className="grid grid-cols-2 gap-3">
          <Link href="/tokens">
            <Card className="text-center">
              <p className="text-2xl mb-1">📊</p>
              <p className="text-sm font-medium">Token 统计</p>
            </Card>
          </Link>
          <Link href="/models">
            <Card className="text-center">
              <p className="text-2xl mb-1">🤖</p>
              <p className="text-sm font-medium">模型配置</p>
            </Card>
          </Link>
          <Link href="/skills">
            <Card className="text-center">
              <p className="text-2xl mb-1">🧩</p>
              <p className="text-sm font-medium">Skills 管理</p>
            </Card>
          </Link>
          <Link href="/cron">
            <Card className="text-center">
              <p className="text-2xl mb-1">⏰</p>
              <p className="text-sm font-medium">定时任务</p>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}

function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return String(n);
}
