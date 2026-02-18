import { NextRequest, NextResponse } from "next/server";
import { listSkills, toggleSkill, installHubSkill } from "@/lib/skills";

export async function GET() {
  const skills = await listSkills();
  return NextResponse.json(skills);
}

export async function PATCH(request: NextRequest) {
  const { name, enabled } = await request.json();
  if (!name || typeof enabled !== "boolean") {
    return NextResponse.json({ error: "Invalid params" }, { status: 400 });
  }
  await toggleSkill(name, enabled);
  return NextResponse.json({ ok: true });
}

export async function POST(request: NextRequest) {
  const { slug } = await request.json();
  if (!slug || typeof slug !== "string" || !/^[a-z0-9-]+$/.test(slug)) {
    return NextResponse.json({ error: "Invalid slug" }, { status: 400 });
  }
  const result = await installHubSkill(slug);
  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: 500 });
  }
  return NextResponse.json({ ok: true });
}
