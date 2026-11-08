import { NextRequest, NextResponse } from "next/server";
import { evolutionService } from "@/modules/evolution/evolution.service";

export async function POST(req: NextRequest) {
  try {
    const { instanceName, webhookUrl, events } = await req.json();

    if (!instanceName || !webhookUrl) {
      return NextResponse.json(
        { success: false, error: "Nome da instância e URL do webhook são obrigatórios." },
        { status: 400 }
      );
    }

    const result = await evolutionService.configureWebhook(instanceName, webhookUrl, events);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
