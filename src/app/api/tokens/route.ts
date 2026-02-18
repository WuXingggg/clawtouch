import { NextRequest, NextResponse } from "next/server";
import { getTokenStats } from "@/lib/sessions";

export async function GET(request: NextRequest) {
  const days = Number(request.nextUrl.searchParams.get("days") || "30");
  const stats = await getTokenStats(days);
  return NextResponse.json(stats);
}
