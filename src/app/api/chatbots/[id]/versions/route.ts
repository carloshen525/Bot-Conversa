import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/modules/chatbots/service";

interface RouteParams {
  params: { id: string };
}

export async function GET(req: NextRequest, { params }: RouteParams) {
  try {
    const versions = await chatbotService.getVersions(params.id);
    return NextResponse.json({ success: true, data: versions });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
