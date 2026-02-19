"use client";

import { useState, useEffect } from "react";
import useSWR from "swr";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Check, Wifi, WifiOff, ChevronDown } from "lucide-react";
import { getSettings, saveSettings, type Settings } from "@/lib/settings";
import { useT } from "@/lib/i18n";

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
  const { t, locale, setLocale } = useT();
  const { data: gateway } = useSWR("/api/gateway", fetcher);
  const { data: models, mutate: mutateModels } = useSWR("/api/models", fetcher);

  const isOnline = gateway?.online;
  const gatewayLoading = gateway === undefined;
  const configStatus = models?.configStatus;
  const providers = models?.providers || {};
  const providerEntries = Object.entries(providers) as [string, ProviderConfig][];
  const currentModel = models?.currentModel || "";

  // Settings state
  const [settings, setSettings] = useState<Settings>(getSettings);

  // Sync on mount
  useEffect(() => {
    setSettings(getSettings());
  }, []);

  const updateSetting = <K extends keyof Settings>(key: K, value: Settings[K]) => {
    const updated = saveSettings({ [key]: value });
    setSettings(updated);
  };

  // Collect all models from all providers for dropdown
  const allModels: Array<{ provider: string; id: string; label: string }> = [];
  for (const [provName, config] of providerEntries) {
    for (const m of config.models || []) {
      const id = typeof m === "string" ? m : m.id || "";
      const name = typeof m === "string" ? m : m.name || m.id || "";
      if (id) {
        allModels.push({
          provider: provName,
          id: `${provName}/${id}`,
          label: name,
        });
      }
    }
  }

  const handleModelChange = async (modelId: string) => {
    updateSetting("selectedModel", modelId);
    // Update openclaw.json config
    try {
      await fetch("/api/models", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ model: modelId }),
      });
      mutateModels();
    } catch { /* ignore */ }
  };

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
                {gatewayLoading ? t("settings.detecting") : isOnline ? t("settings.connected") : t("settings.disconnected")}
              </p>
            </div>
          </div>
          <Badge variant={gatewayLoading ? "warning" : isOnline ? "success" : "danger"}>
            {gatewayLoading ? t("settings.online") : isOnline ? t("settings.online") : t("settings.offline")}
          </Badge>
        </div>
      </Card>

      {/* Language */}
      <Card>
        <p className="text-sm font-medium mb-2">{t("settings.language")}</p>
        <div className="flex gap-2">
          <button
            onClick={() => setLocale("zh-CN")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              locale === "zh-CN" ? "bg-primary text-white" : "bg-slate-100 text-text-secondary"
            }`}
          >
            中文
          </button>
          <button
            onClick={() => setLocale("en")}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              locale === "en" ? "bg-primary text-white" : "bg-slate-100 text-text-secondary"
            }`}
          >
            English
          </button>
        </div>
        <p className="text-[11px] text-text-secondary mt-1">{t("settings.languageDesc")}</p>
      </Card>

      {/* Model Selection */}
      <Card>
        <p className="text-sm font-medium mb-2">{t("settings.currentModel")}</p>
        <div className="relative">
          <select
            value={settings.selectedModel || currentModel}
            onChange={(e) => handleModelChange(e.target.value)}
            className="w-full appearance-none bg-surface border border-border rounded-lg px-3 py-2 text-sm pr-8 focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            {!settings.selectedModel && currentModel && (
              <option value="">{currentModel.split("/").pop()} {t("settings.default")}</option>
            )}
            {allModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
          <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-text-secondary pointer-events-none" />
        </div>
        {currentModel && (
          <p className="text-[11px] text-text-secondary mt-1">
            {t("settings.configLabel", { model: currentModel })}
          </p>
        )}
      </Card>

      {/* Chat Settings */}
      <Card>
        <p className="text-sm font-medium mb-3">{t("settings.chatSettings")}</p>
        <div className="space-y-3">
          {/* Context turns */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px]">{t("settings.contextTurns")}</p>
              <p className="text-[11px] text-text-secondary">{t("settings.contextTurnsDesc")}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={5}
                max={50}
                step={5}
                value={settings.contextTurns}
                onChange={(e) => updateSetting("contextTurns", Number(e.target.value))}
                className="w-20 accent-primary"
              />
              <span className="text-sm font-mono w-8 text-right">{settings.contextTurns}</span>
            </div>
          </div>

          <div className="h-px bg-border" />

          {/* Chat history limit */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[13px]">{t("settings.chatHistoryLimit")}</p>
              <p className="text-[11px] text-text-secondary">{t("settings.chatHistoryLimitDesc")}</p>
            </div>
            <div className="flex items-center gap-2">
              <input
                type="range"
                min={50}
                max={1000}
                step={50}
                value={settings.chatHistoryLimit}
                onChange={(e) => updateSetting("chatHistoryLimit", Number(e.target.value))}
                className="w-20 accent-primary"
              />
              <span className="text-sm font-mono w-10 text-right">{settings.chatHistoryLimit}</span>
            </div>
          </div>
        </div>
      </Card>

      {/* Config Status */}
      {configStatus && (
        <Card>
          <p className="text-sm font-medium mb-2">{t("settings.configFile")}</p>
          <div className="space-y-1.5 text-[13px]">
            <div className="flex justify-between">
              <span className="text-text-secondary">{t("settings.status")}</span>
              <Badge variant={configStatus.loaded ? "success" : "danger"}>
                {configStatus.loaded ? t("settings.loaded") : t("settings.notLoaded")}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t("settings.valid")}</span>
              {configStatus.valid ? (
                <span className="flex items-center gap-1 text-emerald-600">
                  <Check size={12} /> {t("settings.yes")}
                </span>
              ) : (
                <span className="text-red-500">{t("settings.no")}</span>
              )}
            </div>
            <div className="flex justify-between">
              <span className="text-text-secondary">{t("settings.mode")}</span>
              <Badge variant="success">{configStatus.mode}</Badge>
            </div>
          </div>
        </Card>
      )}

      {/* Providers */}
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium">{t("settings.providers")}</p>
        <span className="text-xs text-text-secondary">{t("settings.providerCount", { count: providerEntries.length })}</span>
      </div>

      {providerEntries.map(([name, config]) => {
        const modelList = config.models || [];
        return (
          <Card key={name} className="!p-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-semibold capitalize">{name}</span>
              <Badge variant={config._hasKey ? "success" : "warning"}>
                {config._hasKey ? t("settings.configured") : t("settings.notConfigured")}
              </Badge>
            </div>
            {config.baseUrl && (
              <p className="text-[11px] text-text-secondary truncate mb-1">
                {config.baseUrl}
              </p>
            )}
            {modelList.length > 0 && (
              <p className="text-[11px] text-accent">
                {t("settings.modelCount", { count: modelList.length })}
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
