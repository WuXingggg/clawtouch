import { NextRequest, NextResponse } from "next/server";
import { runOpenClawJSON } from "@/lib/openclaw";

export async function GET() {
  try {
    const jobs = await runOpenClawJSON(["gateway", "call", "cron.list", "--json"]);
    return NextResponse.json(jobs);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message, jobs: [] },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, id, ...rest } = body;

    if (action === "run" && id) {
      const result = await runOpenClawJSON([
        "gateway",
        "call",
        "cron.run",
        "--json",
        "--params",
        JSON.stringify({ id }),
      ]);
      return NextResponse.json(result);
    }

    const result = await runOpenClawJSON([
      "gateway",
      "call",
      "cron.add",
      "--json",
      "--",
      JSON.stringify(rest),
    ]);
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
