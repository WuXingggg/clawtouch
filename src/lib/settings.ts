const STORAGE_KEY = "webclaw-settings";

export interface Settings {
  contextTurns: number;
  chatHistoryLimit: number;
  selectedModel: string; // e.g. "openrouter/minimax/minimax-m2.5", "" = agent default
}

const DEFAULTS: Settings = {
  contextTurns: 20,
  chatHistoryLimit: 200,
  selectedModel: "",
};

export function getSettings(): Settings {
  if (typeof window === "undefined") return { ...DEFAULTS };
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return { ...DEFAULTS };
    const parsed = JSON.parse(raw);
    return {
      contextTurns: Number(parsed.contextTurns) || DEFAULTS.contextTurns,
      chatHistoryLimit: Number(parsed.chatHistoryLimit) || DEFAULTS.chatHistoryLimit,
      selectedModel: typeof parsed.selectedModel === "string" ? parsed.selectedModel : DEFAULTS.selectedModel,
    };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(settings: Partial<Settings>): Settings {
  const current = getSettings();
  const merged = { ...current, ...settings };
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch { /* storage full or unavailable */ }
  return merged;
}

export function getSettingsDefaults(): Settings {
  return { ...DEFAULTS };
}
