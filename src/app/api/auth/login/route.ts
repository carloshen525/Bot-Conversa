import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/modules/auth/supabase-server";
import { isPlaceholderSupabase } from "@/modules/auth/supabase-client";
import { UserProfile } from "@/modules/auth/types";

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "E-mail e senha são obrigatórios." },
        { status: 400 }
      );
    }

    const cleanEmail = String(email).trim().toLowerCase();

    // 1. Placeholder / Local Dev Fallback Mode
    if (isPlaceholderSupabase()) {
      const ADMIN_EMAIL = "carloshenrq1245@gmail.com";
      const ADMIN_PASS = "123357281tT$";

      if (cleanEmail !== ADMIN_EMAIL || password !== ADMIN_PASS) {
        return NextResponse.json(
          {
            success: false,
            error: "Credenciais inválidas. Verifique o e-mail e a senha informados.",
          },
          { status: 401 }
        );
      }

      const mockProfile: UserProfile = {
        id: "prof_carlos_admin",
        auth_user_id: "usr_carlos_admin_001",
        nome: "Carlos Henrique",
        email: cleanEmail,
        avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
        role: "admin",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const res = NextResponse.json({
        success: true,
        user: {
          id: mockProfile.auth_user_id,
          email: mockProfile.email,
        },
        profile: mockProfile,
        isPlaceholderMode: true,
      });

      // Set cookie for session persistence
      res.cookies.set("sb-placeholder-session", JSON.stringify(mockProfile), {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        path: "/",
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return res;
    }

    // 2. Production Supabase Auth Mode
    const supabase = createClient();
    const { data, error } = await supabase.auth.signInWithPassword({
      email: cleanEmail,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          success: false,
          error: error?.message || "E-mail ou senha incorretos.",
        },
        { status: 401 }
      );
    }

    // Fetch user profile from public.profiles table
    const { data: profileData } = await supabase
      .from("profiles")
      .select("*")
      .eq("auth_user_id", data.user.id)
      .single();

    const profile: UserProfile = profileData || {
      id: data.user.id,
      auth_user_id: data.user.id,
      nome: data.user.user_metadata?.nome || cleanEmail.split("@")[0],
      email: cleanEmail,
      avatar: data.user.user_metadata?.avatar || "",
      role: (data.user.user_metadata?.role as any) || "admin",
      created_at: data.user.created_at,
      updated_at: data.user.updated_at || data.user.created_at,
    };

    return NextResponse.json({
      success: true,
      user: data.user,
      profile,
      session: data.session,
    });
  } catch (err: any) {
    return NextResponse.json(
      { success: false, error: err.message || "Erro interno de autenticação." },
      { status: 500 }
    );
  }
}
