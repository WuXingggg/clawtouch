import { NextRequest, NextResponse } from "next/server";
import { readConfig, writeConfig, getConfigPath } from "@/lib/config";
import { existsSync } from "fs";

export async function GET() {
  const config = await readConfig();
  const configPath = getConfigPath();
  const exists = existsSync(configPath);

  // Providers are under models.providers in openclaw.json
  const modelsConfig = (config.models as Record<string, unknown>) || {};
  const rawProviders =
    (modelsConfig.providers as Record<string, Record<string, unknown>>) || {};

  // Mask API keys before sending to frontend
  const providers: Record<string, Record<string, unknown>> = {};
  for (const [name, provConfig] of Object.entries(rawProviders)) {
    providers[name] = { ...provConfig };
    if (providers[name].apiKey) {
      const key = String(providers[name].apiKey);
      providers[name].apiKey = key.slice(0, 8) + "..." + key.slice(-4);
      providers[name]._hasKey = true;
    }
  }

  // Read current model from agents.defaults.model.primary
  const agents = (config.agents as Record<string, unknown>) || {};
  const defaults = (agents.defaults as Record<string, unknown>) || {};
  const modelConfig = (defaults.model as Record<string, unknown>) || {};
  const currentModel = (modelConfig.primary as string) || "";

  // Build flat model list for dropdown
  const allModels: Array<{ provider: string; id: string; name: string; fullId: string }> = [];
  for (const [provName, provConfig] of Object.entries(rawProviders)) {
    const models = (provConfig.models as Array<Record<string, unknown>>) || [];
    for (const m of models) {
      const id = String(m.id || m.name || "");
      const name = String(m.name || m.id || "");
      allModels.push({ provider: provName, id, name, fullId: `${provName}/${id}` });
    }
  }

  return NextResponse.json({
    configStatus: {
      loaded: exists,
      valid: exists && Object.keys(config).length > 0,
      mode: (config.gateway as Record<string, unknown>)?.mode || "local",
      path: configPath,
    },
    providers,
    currentModel,
    allModels,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const body = await request.json();
    const config = await readConfig();

    // Support model switching: { model: "openrouter/minimax/minimax-m2.5" }
    if (body.model !== undefined) {
      const agents = (config.agents as Record<string, unknown>) || {};
      const defaults = (agents.defaults as Record<string, unknown>) || {};
      const modelConfig = (defaults.model as Record<string, unknown>) || {};
      modelConfig.primary = body.model;
      defaults.model = modelConfig;
      agents.defaults = defaults;
      config.agents = agents;
    }

    // Support provider updates: { providers: {...} }
    if (body.providers) {
      config.providers = body.providers;
    }

    await writeConfig(config);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
