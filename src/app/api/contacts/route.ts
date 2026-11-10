import { NextRequest, NextResponse } from "next/server";
import { contactsService } from "@/modules/contacts/contacts.service";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || undefined;
    const tag = searchParams.get("tag") || undefined;
    const status = searchParams.get("status") || undefined;
    const hasActiveFlowParam = searchParams.get("hasActiveFlow");
    const chatbotId = searchParams.get("chatbotId") || undefined;

    let hasActiveFlow: boolean | undefined = undefined;
    if (hasActiveFlowParam === "true") hasActiveFlow = true;
    if (hasActiveFlowParam === "false") hasActiveFlow = false;

    const contacts = await contactsService.listContacts({
      search,
      tag,
      status,
      hasActiveFlow,
      chatbotId,
    });

    return NextResponse.json({
      success: true,
      data: contacts,
      total: contacts.length,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao listar contatos." },
      { status: 500 }
    );
  }
}
