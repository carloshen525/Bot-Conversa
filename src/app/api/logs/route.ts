import { NextRequest, NextResponse } from "next/server";
import { logRepository } from "@/modules/database/repositories/log.repository";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const chatbotId = searchParams.get("chatbotId");

    const logs = chatbotId
      ? await logRepository.listByChatbot(chatbotId)
      : await logRepository.listRecent();

    return NextResponse.json({ success: true, data: logs });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
