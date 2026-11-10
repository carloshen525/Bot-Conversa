import { NextRequest, NextResponse } from "next/server";
import { contactsService } from "@/modules/contacts/contacts.service";

export async function POST(req: NextRequest) {
  try {
    let instanceName: string | undefined;
    try {
      const body = await req.json();
      instanceName = body?.instanceName;
    } catch {
      // Body may be empty
    }

    const result = await contactsService.syncFromEvolution(instanceName);
    return NextResponse.json({
      success: true,
      message: `Sincronização concluída com sucesso (${result.totalSynced} contatos).`,
      data: result,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Falha ao sincronizar contatos da Evolution API.",
      },
      { status: 500 }
    );
  }
}
