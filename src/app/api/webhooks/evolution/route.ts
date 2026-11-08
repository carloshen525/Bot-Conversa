import { NextRequest, NextResponse } from "next/server";
import { evolutionWebhookHandler } from "@/modules/evolution/webhook-handler";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json();
    const dataObj = Array.isArray(payload.data) ? payload.data[0] : payload.data;
    const actualData = dataObj?.key ? dataObj : dataObj?.data || dataObj;
    
    console.log("[Webhook Received]", {
      event: payload?.event,
      fromMe: actualData?.key?.fromMe,
      remoteJid: actualData?.key?.remoteJid,
      pushName: actualData?.pushName,
      text:
        actualData?.message?.conversation ||
        actualData?.message?.extendedTextMessage?.text ||
        actualData?.body,
    });

    const result = await evolutionWebhookHandler.handleWebhook(payload);
    console.log("[Webhook Result]", result);

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
