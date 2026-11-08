import { NextRequest, NextResponse } from "next/server";
import { chatbotService } from "@/modules/chatbots/service";

export async function POST(req: NextRequest) {
  try {
    const { flowData, contact, messageText, variables, currentNodeId, status } = await req.json();

    if (!flowData || !flowData.nodes) {
      return NextResponse.json(
        { success: false, error: "Estrutura do fluxo inválida." },
        { status: 400 }
      );
    }

    const result = await chatbotService.simulateExecution(
      flowData,
      contact || { phone: "5511999999999", name: "Contato Teste" },
      messageText,
      variables || {},
      currentNodeId,
      status
    );

    return NextResponse.json({ success: true, data: result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
