import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/modules/chatbots/service";
import { flowDataSchema } from "@/modules/chatbots/validation";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const draft = await chatbotService.getDraft(params.id);
    if (!draft) {
      return NextResponse.json({ success: false, error: "Rascunho não encontrado" }, { status: 404 });
    }
    return NextResponse.json({ success: true, data: draft });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest, { params }: RouteParams) {
  try {
    const body = await req.json();
    const parsedFlow = flowDataSchema.parse(body.flow_data || body);
    const draft = await chatbotService.saveDraft(params.id, parsedFlow);
    return NextResponse.json({ success: true, data: draft });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
