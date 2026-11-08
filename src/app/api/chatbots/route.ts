import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/modules/chatbots/service";
import { chatbotCreateSchema } from "@/modules/chatbots/validation";

export async function GET() {
  try {
    const list = await chatbotService.listChatbots();
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = chatbotCreateSchema.parse(body);
    const created = await chatbotService.createChatbot(parsed.name, parsed.description);
    return NextResponse.json({ success: true, data: created }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
