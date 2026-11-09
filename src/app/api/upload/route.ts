import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { generateId } from "@/modules/shared/utils";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json(
        { success: false, error: "Nenhum arquivo enviado." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Identify extension and media type
    const originalName = file.name;
    const ext = path.extname(originalName).toLowerCase();
    const rawMime = file.type || "";

    let mediaType: "image" | "video" | "audio" | "document" = "document";

    if (
      [".jpg", ".jpeg", ".png", ".webp", ".gif", ".svg"].includes(ext) ||
      rawMime.startsWith("image/")
    ) {
      mediaType = "image";
    } else if (
      [".mp4", ".mov", ".avi", ".webm", ".mkv"].includes(ext) ||
      rawMime.startsWith("video/")
    ) {
      mediaType = "video";
    } else if (
      [".ogg", ".mp3", ".wav", ".m4a", ".aac", ".opus"].includes(ext) ||
      rawMime.startsWith("audio/")
    ) {
      mediaType = "audio";
    }

    // Determine upload directory: public/uploads/media
    const uploadDir = path.join(process.cwd(), "public", "uploads", "media");
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    // Safe unique filename
    const safeBaseName = path
      .basename(originalName, ext)
      .replace(/[^a-zA-Z0-9_-]/g, "_")
      .slice(0, 30);
    const uniqueFileName = `${Date.now()}_${generateId()}_${safeBaseName}${ext || ""}`;
    const filePath = path.join(uploadDir, uniqueFileName);

    fs.writeFileSync(filePath, buffer);

    const relativeUrl = `/uploads/media/${uniqueFileName}`;

    return NextResponse.json({
      success: true,
      url: relativeUrl,
      fileName: originalName,
      fileSize: file.size,
      mimeType: rawMime || `application/octet-stream`,
      mediaType,
    });
  } catch (err: any) {
    console.error("[Upload Error]", err);
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao processar upload do arquivo." },
      { status: 500 }
    );
  }
}
