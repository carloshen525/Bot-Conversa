"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import {
  Bot,
  Layers,
  Users,
  Activity,
  ArrowRight,
  Plus,
  Radio,
  CheckCircle2,
  Clock,
  Sparkles,
  GitBranch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { formatRelativeTime } from "@/modules/shared/utils";

interface DashboardStats {
  totalChatbots: number;
  publishedChatbots: number;
  totalContacts: number;
  totalExecutions: number;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    totalChatbots: 0,
    publishedChatbots: 0,
    totalContacts: 0,
    totalExecutions: 0,
  });
  const [recentLogs, setRecentLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [botsRes, contactsRes, logsRes] = await Promise.all([
          fetch("/api/chatbots"),
          fetch("/api/contacts"),
          fetch("/api/logs"),
        ]);

        const botsJson = await botsRes.json();
        const contactsJson = await contactsRes.json();
        const logsJson = await logsRes.json();

        const bots = botsJson.data || [];
        const contacts = contactsJson.data || [];
        const logs = logsJson.data || [];

        setStats({
          totalChatbots: bots.length,
          publishedChatbots: bots.filter((b: any) => b.status === "published").length,
          totalContacts: contacts.length,
          totalExecutions: logs.length,
        });

        setRecentLogs(logs.slice(0, 8));
      } catch (err) {
        console.error("Dashboard data load error", err);
      } finally {
        setIsLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Dashboard</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Visão geral da plataforma de chatbots visuais e motor de automação WhatsApp.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/chatbots">
            <Button size="sm" variant="secondary">
              <Bot className="h-4 w-4" />
              <span>Ver Chatbots</span>
            </Button>
          </Link>
          <Link href="/chatbots?action=new">
            <Button size="sm" variant="primary">
              <Plus className="h-4 w-4" />
              <span>Novo Chatbot</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-[#11131a] border-border/70">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Total de Chatbots</span>
            <Bot className="h-4 w-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.totalChatbots}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Fluxos criados na plataforma</p>
        </Card>

        <Card className="bg-[#11131a] border-border/70">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Publicados & Ativos</span>
            <Layers className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400">{stats.publishedChatbots}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Snapshots imutáveis em execução</p>
        </Card>

        <Card className="bg-[#11131a] border-border/70">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Contatos Interagidos</span>
            <Users className="h-4 w-4 text-purple-400" />
          </div>
          <div className="text-2xl font-bold text-foreground">{stats.totalContacts}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Atendidos via WhatsApp</p>
        </Card>

        <Card className="bg-[#11131a] border-border/70">
          <div className="flex items-center justify-between pb-2">
            <span className="text-xs font-medium text-muted-foreground">Execuções Registradas</span>
            <Activity className="h-4 w-4 text-cyan-400" />
          </div>
          <div className="text-2xl font-bold text-cyan-400">{stats.totalExecutions}</div>
          <p className="text-[11px] text-muted-foreground mt-1">Passos no Motor de Execução</p>
        </Card>
      </div>

      {/* Architecture Highlights & Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Architecture Info (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <Card className="bg-gradient-to-br from-[#12141c] to-[#0e1017] border-border/80">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <CardTitle>Arquitetura V1 Bot Conversa</CardTitle>
              </div>
              <CardDescription>
                Separação rigorosa entre Editor Visual e Motor de Execução
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 text-xs text-slate-300">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="rounded-lg border border-border/60 bg-[#151822] p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-indigo-400 font-semibold">
                    <GitBranch className="h-3.5 w-3.5" />
                    <span>Versionamento Imutável</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Você pode editar livremente o <strong>Rascunho (Draft)</strong>. As conversas ativas utilizam exclusivamente o <strong>Snapshot Publicado</strong> com o qual iniciaram, garantindo 100% de estabilidade.
                  </p>
                </div>

                <div className="rounded-lg border border-border/60 bg-[#151822] p-3.5 space-y-1.5">
                  <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                    <Radio className="h-3.5 w-3.5" />
                    <span>Motor Desacoplado</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    O <strong>Flow Engine</strong> é um módulo puramente TypeScript independente do React. Ele interpreta o JSON, avalia condições e despacha ações para a <strong>Evolution API</strong>.
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-border/60">
                <span className="text-[11px] text-muted-foreground">
                  Pronto para escalar com CRM, IA, Disparos e Campanhas no futuro.
                </span>
                <Link
                  href="/chatbots"
                  className="inline-flex items-center gap-1 text-xs text-indigo-400 hover:text-indigo-300 font-medium"
                >
                  <span>Acessar editor</span>
                  <ArrowRight className="h-3 w-3" />
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* System Services Status */}
          <Card className="bg-[#11131a] border-border/70">
            <CardHeader>
              <CardTitle>Serviços e Conexões</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141721] border border-border/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-semibold text-foreground">Evolution API</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      Webhook endpoint: /api/webhooks/evolution
                    </p>
                  </div>
                </div>
                <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
                  Pronto
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded-lg bg-[#141721] border border-border/60 text-xs">
                <div className="flex items-center gap-2.5">
                  <div className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  <div>
                    <p className="font-semibold text-foreground">Supabase & Schema SQL</p>
                    <p className="text-[10px] text-muted-foreground font-mono">
                      10 tabelas e relacionamentos definidos
                    </p>
                  </div>
                </div>
                <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-0.5 text-[10px] font-medium">
                  Configurado
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Live Logs / Activity (1 col) */}
        <Card className="bg-[#11131a] border-border/70 flex flex-col h-full">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>Atividade Recente</CardTitle>
              <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            </div>
            <CardDescription>Logs de execução do motor</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto space-y-2.5 pr-1 max-h-[420px] custom-scrollbar">
            {recentLogs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-8">
                Nenhum log registrado ainda. Envie uma mensagem pelo WhatsApp ou teste um fluxo no simulador.
              </p>
            ) : (
              recentLogs.map((log) => (
                <div
                  key={log.id}
                  className="rounded-lg border border-border/60 bg-[#141721] p-2.5 text-xs space-y-1"
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-[9px] font-semibold uppercase px-1.5 py-0.2 rounded font-mono ${
                        log.level === "error"
                          ? "bg-rose-500/20 text-rose-300"
                          : log.level === "warn"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-indigo-500/20 text-indigo-300"
                      }`}
                    >
                      {log.level}
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {formatRelativeTime(log.created_at)}
                    </span>
                  </div>
                  <p className="text-slate-300 font-medium leading-snug">{log.message}</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
