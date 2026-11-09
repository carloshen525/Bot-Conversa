"use client";

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { createClient, isPlaceholderSupabase } from "./supabase-client";
import { AuthContextType, UserProfile, UserRole, ROLE_PERMISSIONS } from "./types";

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<any | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Helper to load profile
  const loadSession = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me");
      const json = await res.json();
      if (json.success && json.user) {
        setUser(json.user);
        setProfile(json.profile);
      } else {
        setUser(null);
        setProfile(null);
      }
    } catch (err) {
      console.warn("Failed to load user session", err);
      setUser(null);
      setProfile(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Listen for Supabase Auth state changes when connected to real Supabase
  useEffect(() => {
    loadSession();

    if (!isPlaceholderSupabase()) {
      const supabase = createClient();
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
          await loadSession();
        } else if (event === "SIGNED_OUT") {
          setUser(null);
          setProfile(null);
          router.push("/login");
        }
      });

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [loadSession, router]);

  // Sign In function
  const signIn = useCallback(
    async (email: string, password: string): Promise<{ success: boolean; error?: string }> => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const json = await res.json();
        if (!res.ok || !json.success) {
          return { success: false, error: json.error || "Falha na autenticação" };
        }

        setUser(json.user);
        setProfile(json.profile);
        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message || "Erro de conexão ao autenticar." };
      }
    },
    []
  );

  // Sign Out function
  const signOut = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } catch (err) {
      console.warn("Error signing out", err);
    } finally {
      setUser(null);
      setProfile(null);
      router.push("/login");
      router.refresh();
    }
  }, [router]);

  // Update profile
  const updateProfile = useCallback(
    async (data: Partial<Pick<UserProfile, "nome" | "avatar">>): Promise<boolean> => {
      if (!profile) return false;
      const updated = { ...profile, ...data, updated_at: new Date().toISOString() };
      setProfile(updated);
      return true;
    },
    [profile]
  );

  const role: UserRole = profile?.role || "admin";
  const isAdmin = role === "admin";
  const permissions = useMemo(() => ROLE_PERMISSIONS[role] || ROLE_PERMISSIONS.admin, [role]);

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isLoading,
        role,
        isAdmin,
        permissions,
        signIn,
        signOut,
        updateProfile,
        refreshSession: loadSession,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
