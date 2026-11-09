import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/modules/auth/supabase-server";
import { isPlaceholderSupabase } from "@/modules/auth/supabase-client";
import { UserProfile } from "@/modules/auth/types";

export async function GET(req: NextRequest) {
  try {
    if (isPlaceholderSupabase()) {
      const sessionCookie = req.cookies.get("sb-placeholder-session")?.value;
      if (!sessionCookie) {
        return NextResponse.json({ success: false, user: null, profile: null });
      }

      try {
        const profile: UserProfile = JSON.parse(sessionCookie);
        return NextResponse.json({
          success: true,
          user: { id: profile.auth_user_id, email: profile.email },
          profile,
        });
      } catch {
        return NextResponse.json({ success: false, user: null, profile: null });
      }
    }

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ success: false, user: null, profile: null });
    }

    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", user.id)
      .single();

    const profile: UserProfile = profileData || {
      id: user.id,
      auth_user_id: user.id,
      nome: user.user_metadata?.nome || user.email?.split("@")[0] || "Administrador",
      email: user.email || "",
      avatar: user.user_metadata?.avatar || "",
      role: (user.user_metadata?.role as any) || "admin",
      created_at: user.created_at,
      updated_at: user.updated_at || user.created_at,
    };

    return NextResponse.json({
      success: true,
      user,
      profile,
    });
  } catch (err: any) {
    return NextResponse.json({ success: false, user: null, profile: null });
  }
}
