import { NextRequest, NextResponse } from "next/server";
import { contactsService } from "@/modules/contacts/contacts.service";

interface RouteParams {
  params: { id: string };
}

export async function POST(_req: NextRequest, { params }: RouteParams) {
  try {
    const id = params?.id;
    const stopped = await contactsService.stopFlow(id);

    if (!stopped) {
      return NextResponse.json(
        { success: false, error: "Contato não encontrado ou não foi possível parar o fluxo." },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Fluxo interrompido com sucesso.",
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao parar fluxo do contato." },
      { status: 500 }
    );
  }
}
