import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/modules/chatbots/service";

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const duplicated = await chatbotService.duplicateChatbot(params.id);
    if (!duplicated) {
      return NextResponse.json({ success: false, error: "Chatbot não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: duplicated }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
