import { NextResponse } from "next/server";
import { createClient } from "@/modules/auth/supabase-server";
import { isPlaceholderSupabase } from "@/modules/auth/supabase-client";

export async function POST() {
  try {
    const res = NextResponse.json({ success: true, message: "Sessão encerrada com sucesso." });

    if (isPlaceholderSupabase()) {
      res.cookies.delete("sb-placeholder-session");
      return res;
    }

    const supabase = createClient();
    await supabase.auth.signOut();

    return res;
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro ao encerrar sessão." },
      { status: 500 }
    );
  }
}
