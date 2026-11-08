import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/modules/chatbots/service";
import { publishSnapshotSchema } from "@/modules/chatbots/validation";

interface RouteParams {
  params: { id: string };
}

export async function POST(req: NextRequest, { params }: RouteParams) {
  try {
    let changelog = "";
    try {
      const body = await req.json();
      const parsed = publishSnapshotSchema.parse(body);
      changelog = parsed.changelog || "";
    } catch {
      // Empty body is allowed
    }

    const version = await chatbotService.publishChatbot(params.id, changelog);
    return NextResponse.json({ success: true, data: version }, { status: 201 });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 400 });
  }
}
