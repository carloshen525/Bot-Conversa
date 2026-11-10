import { NextRequest, NextResponse } from "next/server";
import { contactsService } from "@/modules/contacts/contacts.service";

interface RouteParams {
  params: { id: string };
}

export async function GET(_req: NextRequest, { params }: RouteParams) {
  try {
    const id = params?.id;
    const history = await contactsService.getHistory(id);

    return NextResponse.json({
      success: true,
      data: history,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao carregar histórico do contato." },
      { status: 500 }
    );
  }
}
