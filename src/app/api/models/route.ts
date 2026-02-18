import { NextRequest, NextResponse } from "next/server";
import { readConfig, writeConfig, getConfigPath } from "@/lib/config";
import { existsSync } from "fs";

export async function GET() {
  const config = await readConfig();
  const configPath = getConfigPath();
  const exists = existsSync(configPath);

  // Extract providers from config
  const providers =
    (config.providers as Record<string, unknown>) || {};

  return NextResponse.json({
    configStatus: {
      loaded: exists,
      valid: exists && Object.keys(config).length > 0,
      mode: config.mode || "merge",
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
