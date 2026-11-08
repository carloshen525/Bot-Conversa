"use client";

import React, { useState } from "react";
import {
  Settings,
  Radio,
  Database,
  Copy,
  Check,
  Send,
  Sparkles,
  Server,
  Key,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { useToast } from "@/components/ui/toast";

export default function SettingsPage() {
  const { success, error, info } = useToast();
  const [copiedWebhook, setCopiedWebhook] = useState(false);
  const [copiedSql, setCopiedSql] = useState(false);

  // Test Webhook Tool
  const [testPhone, setTestPhone] = useState("5511988887777");
  const [testName, setTestName] = useState("Mariana Silva");
  const [testMessage, setTestMessage] = useState("oi");
  const [isSendingTest, setIsSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const webhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/evolution`
      : "http://localhost:3000/api/webhooks/evolution";

  const handleCopyWebhook = () => {
    navigator.clipboard.writeText(webhookUrl);
    setCopiedWebhook(true);
    success("Copiado!", "URL do Webhook copiada para a área de transferência.");
    setTimeout(() => setCopiedWebhook(false), 2000);
  };

  const handleSendTestWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSendingTest(true);
    setTestResult(null);

    try {
      const payload = {
        event: "messages.upsert",
        instance: "botconversa",
        data: {
          key: {
            remoteJid: `${testPhone}@s.whatsapp.net`,
            fromMe: false,
            id: `TEST_${Date.now()}`,
          },
          pushName: testName,
          message: {
            conversation: testMessage,
          },
          messageType: "conversation",
          messageTimestamp: Math.floor(Date.now() / 1000),
        },
      };

      const res = await fetch("/api/webhooks/evolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      setTestResult(json);

      if (json.success && json.result?.processed) {
        success("Webhook Processado!", "O fluxo executou com sucesso no motor independente.");
      } else {
        info("Webhook Recebido", json.result?.reason || "Mensagem processada.");
      }
    } catch (err: any) {
      error("Erro no teste", err.message);
    } finally {
      setIsSendingTest(false);
    }
  };

  return (
    <div className="flex-1 p-8 max-w-5xl mx-auto w-full space-y-8">
      {/* Header */}
      <div className="border-b border-border/80 pb-6">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Configurações</h1>
        <p className="text-xs text-muted-foreground mt-1">
          Gerencie integrações com Evolution API, banco de dados Supabase e endpoints de Webhook.
        </p>
      </div>

      {/* Webhook Configuration Card */}
      <Card className="bg-[#11131a] border-border/70">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Radio className="h-4 w-4 text-emerald-400" />
            <CardTitle>Webhook Evolution API</CardTitle>
          </div>
          <CardDescription>
            URL que você deve cadastrar na sua instância da Evolution API para receber mensagens recebidas do WhatsApp.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              type="text"
              readOnly
              value={webhookUrl}
              className="flex-1 rounded-lg bg-[#0c0d12] border border-border/70 px-3.5 py-2 text-xs font-mono text-emerald-400 focus:outline-none"
            />
            <Button size="sm" variant="secondary" onClick={handleCopyWebhook}>
              {copiedWebhook ? <Check className="h-4 w-4 text-emerald-400" /> : <Copy className="h-4 w-4" />}
              <span>{copiedWebhook ? "Copiado" : "Copiar URL"}</span>
            </Button>
          </div>

          <div className="rounded-lg bg-[#141721] p-3 text-xs text-muted-foreground space-y-1">
            <p className="font-semibold text-slate-300">Eventos recomendados na Evolution API:</p>
            <p className="font-mono text-[11px] text-indigo-300">MESSAGES_UPSERT, MESSAGES_UPDATE</p>
          </div>
        </CardContent>
      </Card>

      {/* Test Webhook Form */}
      <Card className="bg-[#11131a] border-border/70">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-indigo-400" />
            <CardTitle>Disparador de Teste do Webhook</CardTitle>
          </div>
          <CardDescription>
            Simule o recebimento de um evento de mensagem da Evolution API para verificar a resposta do motor de fluxo.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSendTestWebhook} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Telefone (WhatsApp)"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                placeholder="5511999999999"
                required
              />
              <Input
                label="Nome do Contato"
                value={testName}
                onChange={(e) => setTestName(e.target.value)}
                placeholder="Nome do cliente"
                required
              />
              <Input
                label="Mensagem Recebida"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
                placeholder="Ex: oi, cardápio, 1"
                required
              />
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button type="submit" size="sm" isLoading={isSendingTest}>
                <Send className="h-3.5 w-3.5" />
                <span>Enviar Webhook Simulado</span>
              </Button>
            </div>
          </form>

          {testResult && (
            <div className="mt-4 rounded-lg bg-[#0c0d12] border border-border/70 p-3 font-mono text-[11px] text-slate-300 overflow-x-auto">
              <p className="font-semibold text-indigo-400 mb-1">Resultado da Execução:</p>
              <pre>{JSON.stringify(testResult, null, 2)}</pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Supabase Schema Reference */}
      <Card className="bg-[#11131a] border-border/70">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Database className="h-4 w-4 text-cyan-400" />
            <CardTitle>Banco de Dados Supabase (Schema V1)</CardTitle>
          </div>
          <CardDescription>
            Tabelas configuradas: chatbots, chatbot_drafts, chatbot_versions, contacts, conversation_state, executions, variables, tags, contact_tags, logs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-xs text-muted-foreground">
            O arquivo SQL completo de migração está salvo em <code className="text-cyan-300 font-mono">supabase/schema.sql</code> no projeto. Ele inclui chaves estrangeiras, índices e restrições para suportar snapshots imutáveis.
          </p>
          <div className="flex items-center gap-2">
            <span className="rounded bg-emerald-500/10 text-emerald-400 px-2 py-1 text-xs font-medium">
              ✓ Schema Pronto para Produção
            </span>
            <span className="rounded bg-indigo-500/10 text-indigo-400 px-2 py-1 text-xs font-medium">
              ✓ Armazenamento Resiliente com Fallback Local Ativo
            </span>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
