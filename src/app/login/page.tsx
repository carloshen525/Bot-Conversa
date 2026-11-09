"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Bot, Lock, Mail, ArrowRight, ShieldCheck, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/modules/auth/AuthContext";
import { isPlaceholderSupabase } from "@/modules/auth/supabase-client";

export default function LoginPage() {
  const router = useRouter();
  const { signIn } = useAuth();

  const [email, setEmail] = useState("carloshenrq1245@gmail.com");
  const [password, setPassword] = useState("123357281tT$");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMessage(null);

    try {
      const res = await signIn(email, password);
      if (res.success) {
        router.push("/");
        router.refresh();
      } else {
        setErrorMessage(res.error || "Não foi possível realizar o login.");
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Erro inesperado ao conectar.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-[#07080b] p-4 relative overflow-hidden select-none">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[300px] bg-indigo-600/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-10 right-1/4 w-[400px] h-[250px] bg-emerald-600/5 rounded-full blur-[100px] pointer-events-none" />

      {/* Login Card */}
      <div className="w-full max-w-[420px] rounded-2xl border border-border/80 bg-[#0f1118]/90 backdrop-blur-xl p-8 shadow-2xl relative z-10 space-y-6">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 mb-1 shadow-lg shadow-indigo-500/10">
            <Bot className="h-6 w-6" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            Bot Conversa
          </h1>
          <p className="text-xs text-muted-foreground">
            Acesse a plataforma de chatbots visuais e automação WhatsApp
          </p>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="rounded-lg bg-rose-500/10 border border-rose-500/30 p-3.5 text-xs text-rose-300 flex items-start gap-2.5">
            <AlertCircle className="h-4 w-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="space-y-0.5">
              <p className="font-semibold text-rose-200">Falha no Login</p>
              <p className="text-[11px] text-rose-300/90 leading-relaxed">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-muted-foreground" />
              E-mail
            </label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu-email@dominio.com"
              required
              autoFocus
              className="bg-[#141722] border-border/70 text-foreground text-xs"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5 text-muted-foreground" />
              Senha
            </label>
            <Input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              required
              className="bg-[#141722] border-border/70 text-foreground text-xs"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            className="w-full h-10 mt-2 bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold shadow-lg shadow-indigo-600/20"
            isLoading={isLoading}
          >
            <span>Entrar</span>
            <ArrowRight className="h-4 w-4 ml-1.5" />
          </Button>
        </form>

        {/* Notice: No Public Signup */}
        <div className="pt-2 border-t border-border/60 text-center space-y-2">
          <div className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
            <span>Acesso restrito a administradores cadastrados</span>
          </div>
          <p className="text-[10px] text-muted-foreground/60">
            Cadastros públicos desabilitados. Contas são criadas exclusivamente via Supabase Auth.
          </p>
        </div>
      </div>
    </div>
  );
}
