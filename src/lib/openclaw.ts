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
  return JSON.parse(stdout);
}

export async function gatewayHealth(): Promise<{
  online: boolean;
  version?: string;
  uptime?: number;
}> {
  try {
    const result = await runOpenClawJSON<Record<string, unknown>>([
      "gateway",
      "health",
      "--json",
    ]);
    return {
      online: true,
      version: result.version as string,
      uptime: result.uptime as number,
    };
  } catch {
    return { online: false };
  }
}
