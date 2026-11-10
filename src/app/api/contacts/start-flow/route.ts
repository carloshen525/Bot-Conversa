import { NextRequest, NextResponse } from "next/server";
import { contactsService } from "@/modules/contacts/contacts.service";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { contactIds, chatbotId, policy } = body;

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { success: false, error: "Nenhum contato selecionado." },
        { status: 400 }
      );
    }

    if (!chatbotId) {
      return NextResponse.json(
        { success: false, error: "Nenhum chatbot selecionado." },
        { status: 400 }
      );
    }

    const result = await contactsService.startFlow({
      contactIds,
      chatbotId,
      policy: policy === "keep" ? "keep" : "replace",
    });

    return NextResponse.json({
      success: result.success,
      data: result,
      message: `Fluxo iniciado para ${result.dispatchedCount} contato(s).`,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao iniciar fluxo para os contatos." },
      { status: 500 }
    );
  }
}
