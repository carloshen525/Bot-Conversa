import { NextResponse } from "next/server";
import { contactRepository } from "@/modules/database/repositories/contact.repository";

export async function GET() {
  try {
    const list = await contactRepository.listAll();
    return NextResponse.json({ success: true, data: list });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
