import { NextRequest, NextResponse } from "next/server";
import { evolutionWebhookHandler } from "@/modules/evolution/webhook-handler";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const result = await evolutionWebhookHandler.handleWebhook(payload);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("[Webhook Error]", err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    status: "ok",
    service: "Evolution API Webhook Receiver",
    timestamp: new Date().toISOString(),
  });
}
