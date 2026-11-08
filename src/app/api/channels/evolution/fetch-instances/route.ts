import { NextRequest, NextResponse } from "next/server";
import { evolutionService } from "@/modules/evolution/evolution.service";

export async function POST(req: NextRequest) {
  try {
    const { baseUrl, apiKey } = await req.json();

    const instances = await evolutionService.listInstances(baseUrl, apiKey);
    return NextResponse.json({ success: true, instances });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Erro ao consultar instâncias na Evolution API.",
      },
      { status: 500 }
    );
  }
}
