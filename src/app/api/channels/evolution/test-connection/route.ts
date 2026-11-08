import { NextRequest, NextResponse } from "next/server";
import { evolutionService } from "@/modules/evolution/evolution.service";

export async function POST(req: NextRequest) {
  try {
    const { baseUrl, apiKey } = await req.json();

    const result = await evolutionService.testConnection(baseUrl, apiKey);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        result: {
          success: false,
          message: err.message || "Erro inesperado ao testar conexão.",
        },
      },
      { status: 500 }
    );
  }
}
