import { NextResponse } from "next/server";
import { evolutionService } from "@/modules/evolution/evolution.service";

export async function POST() {
  try {
    const result = await evolutionService.sync();
    return NextResponse.json({ success: true, ...result });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
