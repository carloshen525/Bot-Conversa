import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/modules/chatbots/service";
import { chatbotUpdateSchema } from "@/modules/chatbots/validation";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const bot = await chatbotService.getChatbot(params.id);
    if (!bot) {
      return NextResponse.json({ success: false, error: "Chatbot não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: bot });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const body = await req.json();
    const parsed = chatbotUpdateSchema.parse(body);
    const updated = await chatbotService.updateChatbot(params.id, parsed);
    if (!updated) {
      return NextResponse.json({ success: false, error: "Chatbot não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: updated });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest, { params }: RouteParams) {
  try {
    const deleted = await chatbotService.deleteChatbot(params.id);
    if (!deleted) {
      return NextResponse.json({ success: false, error: "Chatbot não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
