import { NextRequest, NextResponse } from "next/server";
import { evolutionService } from "@/modules/evolution/evolution.service";

export async function GET() {
  try {
    const config = await evolutionService.getConfig();
    // Mask API Key for security in the frontend
    const maskedKey = config.apiKey
      ? config.apiKey.length > 8
        ? `${config.apiKey.slice(0, 4)}••••••••${config.apiKey.slice(-4)}`
        : "••••••••"
      : "";

    return NextResponse.json({
      success: true,
      data: {
        baseUrl: config.baseUrl,
        apiKey: config.apiKey, // Sent for editing convenience
        maskedApiKey: maskedKey,
        selectedInstanceName: config.selectedInstanceName,
        isConnected: config.isConnected,
        lastTestedAt: config.lastTestedAt,
        lastSyncedAt: config.lastSyncedAt,
        instances: config.instances,
      },
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { baseUrl, apiKey, selectedInstanceName } = await req.json();

    if (!baseUrl) {
      return NextResponse.json(
        { success: false, error: "A URL da Evolution API é obrigatória." },
        { status: 400 }
      );
    }

    const updated = await evolutionService.saveConfig(baseUrl, apiKey || "", selectedInstanceName);
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
