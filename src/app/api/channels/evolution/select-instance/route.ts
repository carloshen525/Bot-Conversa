import { NextRequest, NextResponse } from "next/server";
import { evolutionService } from "@/modules/evolution/evolution.service";

export async function POST(req: NextRequest) {
  try {
    const { instanceName } = await req.json();

    if (!instanceName) {
      return NextResponse.json(
        { success: false, error: "Nome da instância é obrigatório." },
        { status: 400 }
      );
    }

    const selected = await evolutionService.selectInstance(instanceName);
    return NextResponse.json({ success: true, selected });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
