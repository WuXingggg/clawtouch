import { NextRequest, NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

const UPLOAD_DIR = join(process.cwd(), "public", "uploads");

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    const mimeType = file.type || "";
    const isImage = mimeType.startsWith("image/");

    // 5MB limit for images (gateway constraint)
    if (isImage && file.size > 5 * 1024 * 1024) {
      return NextResponse.json(
        { error: `图片过大 (${(file.size / 1024 / 1024).toFixed(1)}MB，最大 5MB)` },
        { status: 400 },
      );
    }

    await mkdir(UPLOAD_DIR, { recursive: true });

    const ext = file.name.includes(".")
      ? "." + file.name.split(".").pop()
      : "";
    const filename = `${randomUUID()}${ext}`;
    const filepath = join(UPLOAD_DIR, filename);

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filepath, buffer);

    const result: Record<string, unknown> = {
      url: `/uploads/${filename}`,
      name: file.name,
      size: file.size,
      mimeType,
    };

    // Include base64 for images (needed for gateway attachment)
    if (isImage) {
      result.base64 = buffer.toString("base64");
    }

    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: (e as Error).message },
      { status: 500 }
    );
  }
}
