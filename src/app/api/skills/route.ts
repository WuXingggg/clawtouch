import { NextRequest, NextResponse } from "next/server";
import { listSkills, toggleSkill } from "@/lib/skills";

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
