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

  return NextResponse.json({
    configStatus: {
      loaded: exists,
      valid: exists && Object.keys(config).length > 0,
      mode: (config.gateway as Record<string, unknown>)?.mode || "local",
      path: configPath,
    },
    providers,
  });
}

export async function PATCH(request: NextRequest) {
  try {
    const { providers } = await request.json();
    const config = await readConfig();
    config.providers = providers;
    await writeConfig(config);
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
