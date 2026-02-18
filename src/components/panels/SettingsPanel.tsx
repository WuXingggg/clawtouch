"use client";

import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Check, Wifi, WifiOff } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ModelEntry {
  id?: string;
  name?: string;
}

interface ProviderConfig {
  baseUrl?: string;
  models?: (string | ModelEntry)[];
  _hasKey?: boolean;
  [key: string]: unknown;
}

export function SettingsPanel() {
  const { data: gateway } = useSWR("/api/gateway", fetcher);
  const { data: models } = useSWR("/api/models", fetcher);

  const isOnline = gateway?.online;
  const gatewayLoading = gateway === undefined;
  const configStatus = models?.configStatus;
  const providers = models?.providers || {};
  const providerEntries = Object.entries(providers) as [string, ProviderConfig][];

  return (
    <div className="space-y-4 py-3">
      {/* Gateway Status */}
      <Card>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {gatewayLoading ? (
              <Wifi size={18} className="text-slate-400 animate-pulse" />
            ) : isOnline ? (
              <Wifi size={18} className="text-emerald-500" />
            ) : (
              <WifiOff size={18} className="text-red-400" />
            )}
            <div>
              <p className="text-sm font-medium">Gateway</p>
              <p className="text-[11px] text-text-secondary">
                {gatewayLoading ? "检测中..." : isOnline ? "已连接" : "未连接"}
              </p>
            </div>
          </div>
          <Badge variant={gatewayLoading ? "warning" : isOnline ? "success" : "danger"}>
            {gatewayLoading ? "检测中" : isOnline ? "在线" : "离线"}
          </Badge>
        </div>
      </Card>

      {/* Config Status */}
      {configStatus && (
        <Card>
          <p className="text-sm font-medium mb-2">配置文件</p>
          <div className="space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-text-secondary">状态</span>
              <Badge variant={configStatus.loaded ? "success" : "danger"}>
                {configStatus.loaded ? "已加载" : "未加载"}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">有效</span>
              {configStatus.valid ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Check size={12} /> 是
                </span>
              ) : (
                <span className="text-red-500">否</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">模式</span>
              <Badge variant="success">{configStatus.mode}</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Providers */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">模型提供商</p>
        <span className="text-xs text-text-secondary">{providerEntries.length} 个</span>
      </div>

      {providerEntries.map(([name, config]) => {
        const modelList = config.models || [];
        return (
          <Card key={name} className="!p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold capitalize">{name}</span>
              <Badge variant={config._hasKey ? "success" : "warning"}>
                {config._hasKey ? "已配置" : "未配置"}
              </Badge>
            </div>
            {config.baseUrl && (
              <p className="text-[11px] text-text-secondary truncate mb-1">
                🔗 {config.baseUrl}
              </p>
            )}
            {modelList.length > 0 && (
              <p className="text-[11px] text-accent">
                🤖 {modelList.length} 个模型：
                {modelList
                  .slice(0, 3)
                  .map((m) => (typeof m === "string" ? m : m.name || m.id))
                  .join(", ")}
                {modelList.length > 3 && ` ...`}
              </p>
            )}
          </Card>
        );
      })}
    </div>
  );
}
