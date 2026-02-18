"use client";

import useSWR from "swr";
import { PageHeader } from "@/components/layout/PageHeader";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Empty } from "@/components/ui/Empty";
import { Pencil, Key, Check } from "lucide-react";

const fetcher = (url: string) => fetch(url).then((r) => r.json());

interface ModelEntry {
  id?: string;
  name?: string;
}

interface ProviderConfig {
  apiKey?: string;
  baseUrl?: string;
  models?: (string | ModelEntry)[];
  [key: string]: unknown;
}

export default function ModelsPage() {
  const { data, mutate } = useSWR("/api/models", fetcher);

  const providers = data?.providers || {};
  const configStatus = data?.configStatus;
  const providerEntries = Object.entries(providers) as [
    string,
    ProviderConfig,
  ][];

  return (
    <div>
      <PageHeader title="模型配置" showBack onRefresh={() => mutate()} />

      <div className="px-4 py-4 max-w-lg mx-auto space-y-4">
        {/* Config Status Card */}
        {configStatus && (
          <Card className="bg-slate-50">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-lg">📄</span>
              <span className="text-sm font-semibold">配置文件</span>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-text-secondary">状态：</span>
                <Badge variant={configStatus.loaded ? "success" : "danger"}>
                  {configStatus.loaded ? "已加载" : "未加载"}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">有效：</span>
                <span className="flex items-center gap-1">
                  {configStatus.valid ? (
                    <>
                      <Check size={14} className="text-emerald-500" /> 是
                    </>
                  ) : (
                    "否"
                  )}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">模式：</span>
                <Badge variant="success">{configStatus.mode}</Badge>
              </div>
            </div>
          </Card>
        )}

        {/* Provider Count */}
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2">
            <span className="text-lg">🏢</span>
            <span className="font-semibold">模型提供商</span>
          </div>
          <span className="text-sm text-text-secondary">
            {providerEntries.length} 个
          </span>
        </div>

        {/* Provider List */}
        {providerEntries.length === 0 ? (
          <Empty message="未配置任何模型提供商" />
        ) : (
          <div className="space-y-3">
            {providerEntries.map(([name, config]) => {
              const hasKey = !!config._hasKey || !!config.apiKey;
              const models = config.models || [];
              const baseUrl = config.baseUrl || getDefaultUrl(name);

              return (
                <Card key={name}>
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-base capitalize">
                      {name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <button className="text-accent p-1">
                        <Pencil size={16} />
                      </button>
                      <Badge variant={hasKey ? "success" : "warning"}>
                        <Key size={10} className="mr-1" />
                        {hasKey ? "已配置" : "未配置"}
                      </Badge>
                    </div>
                  </div>
                  {baseUrl && (
                    <p className="text-xs text-text-secondary flex items-center gap-1 mb-2">
                      🔗 {baseUrl}
                    </p>
                  )}
                  {models.length > 0 && (
                    <div>
                      <p className="text-xs text-accent font-medium mb-1">
                        🤖 {models.length} 个模型
                      </p>
                      <ul className="text-xs text-text-secondary space-y-0.5 ml-3">
                        {models.slice(0, 3).map((m, idx) => {
                          const label = typeof m === "string" ? m : m.name || m.id || "unknown";
                          return (
                            <li key={idx} className="list-disc">
                              {label}
                            </li>
                          );
                        })}
                        {models.length > 3 && (
                          <li className="text-text-secondary">
                            还有 {models.length - 3} 个模型...
                          </li>
                        )}
                      </ul>
                    </div>
                  )}
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function getDefaultUrl(provider: string): string {
  const urls: Record<string, string> = {
    anthropic: "https://api.anthropic.com/v1",
    openai: "https://api.openai.com/v1",
    openrouter: "https://openrouter.ai/api/v1",
    deepseek: "https://api.deepseek.com",
    google: "https://generativelanguage.googleapis.com",
  };
  return urls[provider.toLowerCase()] || "";
}
