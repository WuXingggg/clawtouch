import { NextResponse } from "next/server";
import { gatewayHealth } from "@/lib/openclaw";

// Cache health result for 5s to avoid spawning CLI on every poll
let cached: { data: unknown; ts: number } | null = null;
const CACHE_TTL = 5000;

export async function GET() {
  const now = Date.now();
  if (cached && now - cached.ts < CACHE_TTL) {
    return NextResponse.json(cached.data);
  }
  const health = await gatewayHealth();
  cached = { data: health, ts: now };
  return NextResponse.json(health);
}
