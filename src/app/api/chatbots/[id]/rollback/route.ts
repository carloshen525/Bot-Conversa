import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/modules/chatbots/service";

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    const { versionId } = await req.json();
    if (!versionId) {
      return NextResponse.json(
        { success: false, error: "ID da versão é obrigatório." },
        { status: 400 }
      );
    }

    const result = await chatbotService.rollbackVersion(params.id, versionId);
    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
