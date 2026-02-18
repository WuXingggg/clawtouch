import { NextResponse } from "next/server";
import { gatewayHealth } from "@/lib/openclaw";

export async function GET() {
  const health = await gatewayHealth();
  return NextResponse.json(health);
}
