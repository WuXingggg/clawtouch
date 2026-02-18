import { execFile } from "child_process";

const OPENCLAW_BIN = process.env.OPENCLAW_BIN || "openclaw";
const EXEC_TIMEOUT = 15_000;

export function runOpenClaw(
  args: string[]
): Promise<{ stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    execFile(
      OPENCLAW_BIN,
      args,
      { timeout: EXEC_TIMEOUT, maxBuffer: 10 * 1024 * 1024 },
      (error, stdout, stderr) => {
        if (error) {
          reject(new Error(`openclaw ${args.join(" ")} failed: ${stderr || error.message}`));
        } else {
          resolve({ stdout, stderr });
        }
      }
    );
  });
}

export async function runOpenClawJSON<T = unknown>(args: string[]): Promise<T> {
  const { stdout } = await runOpenClaw(args);
  // openclaw CLI may print warnings before JSON, find the first { or [
  const jsonStart = stdout.search(/[\[{]/);
  if (jsonStart === -1) throw new Error("No JSON in output");
  return JSON.parse(stdout.slice(jsonStart));
}

interface GatewayHealthResult {
  online: boolean;
  version?: string;
  uptime?: number;
  agents?: Array<{
    agentId: string;
    isDefault: boolean;
  }>;
  channels?: Record<string, { configured: boolean; running: boolean }>;
  defaultAgentId?: string;
}

export async function gatewayHealth(): Promise<GatewayHealthResult> {
  try {
    const result = await runOpenClawJSON<Record<string, unknown>>([
      "gateway",
      "health",
      "--json",
    ]);
    return {
      online: result.ok === true,
      version: result.version as string,
      uptime: result.durationMs as number,
      agents: result.agents as GatewayHealthResult["agents"],
      channels: result.channels as GatewayHealthResult["channels"],
      defaultAgentId: result.defaultAgentId as string,
    };
  } catch {
    return { online: false };
  }
}
