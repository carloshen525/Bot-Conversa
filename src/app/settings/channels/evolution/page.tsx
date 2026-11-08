"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Radio,
  Server,
  Key,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  Send,
  Sparkles,
  ArrowLeft,
  Phone,
  User,
  Clock,
  ShieldCheck,
  Globe,
  SlidersHorizontal,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Loading } from "@/components/ui/loading";
import { useToast } from "@/components/ui/toast";
import { formatRelativeTime } from "@/modules/shared/utils";

interface InstanceData {
  id: string;
  name: string;
  status: "open" | "close" | "connecting" | "unknown";
  number?: string;
  profileName?: string;
  profilePictureUrl?: string;
  updatedAt?: string;
  webhookUrl?: string;
  webhookEnabled?: boolean;
  isDefault?: boolean;
}

export default function EvolutionChannelPage() {
  const { success, error, info } = useToast();

  // Connection fields
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [lastTestedAt, setLastTestedAt] = useState<string | null>(null);
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(null);
  const [selectedInstanceName, setSelectedInstanceName] = useState<string | null>(null);

  // Instances list
  const [instances, setInstances] = useState<InstanceData[]>([]);

  // Loading states
  const [isPageLoading, setIsPageLoading] = useState(true);
  const [isTesting, setIsTesting] = useState(false);
  const [isFetchingInstances, setIsFetchingInstances] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [configuringWebhookFor, setConfiguringWebhookFor] = useState<string | null>(null);

  // Test connection result banner
  const [testResult, setTestResult] = useState<{
    success: boolean;
    message: string;
    latencyMs?: number;
  } | null>(null);

  // Default webhook URL
  const defaultWebhookUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/api/webhooks/evolution`
      : "http://localhost:3000/api/webhooks/evolution";

  const [webhookUrlInput, setWebhookUrlInput] = useState(defaultWebhookUrl);

  // 1. Initial Load: Load config & auto-sync instances
  const loadConfigAndSync = async () => {
    try {
      const res = await fetch("/api/channels/evolution");
      const json = await res.json();
      if (json.success && json.data) {
        setBaseUrl(json.data.baseUrl || "");
        setApiKey(json.data.apiKey || "");
        setIsConnected(Boolean(json.data.isConnected));
        setLastTestedAt(json.data.lastTestedAt);
        setLastSyncedAt(json.data.lastSyncedAt);

        const insts: InstanceData[] = json.data.instances || [];
        setInstances(insts);

        let sel = json.data.selectedInstanceName;
        if ((!sel || !insts.some((i) => i.name === sel)) && insts.length > 0) {
          const firstOpen = insts.find((i) => i.status === "open") || insts[0];
          sel = firstOpen.name;
        }
        setSelectedInstanceName(sel);
      }
    } catch (err: any) {
      console.warn("Error loading Evolution config", err);
    } finally {
      setIsPageLoading(false);
    }
  };

  useEffect(() => {
    loadConfigAndSync();
  }, []);

  // 2. Action: Test Connection
  const handleTestConnection = async () => {
    if (!baseUrl.trim()) {
      error("URL Obrigatória", "Por favor, informe a URL da Evolution API.");
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await fetch("/api/channels/evolution/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiKey }),
      });

      const json = await res.json();
      const result = json.result;

      setTestResult(result);
      setIsConnected(result.success);
      setLastTestedAt(new Date().toISOString());

      if (result.success) {
        success("Conexão Bem-Sucedida!", result.message);
        // Automatically fetch instances on successful connection
        handleFetchInstances();
      } else {
        error("Falha na Conexão", result.message);
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: "Não foi possível comunicar com o servidor da Evolution API.",
      });
      error("Erro", err.message);
    } finally {
      setIsTesting(false);
    }
  };

  // 3. Action: Fetch Instances
  const handleFetchInstances = async () => {
    setIsFetchingInstances(true);
    try {
      const res = await fetch("/api/channels/evolution/fetch-instances", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiKey }),
      });

      const json = await res.json();
      if (json.success && Array.isArray(json.instances)) {
        const insts: InstanceData[] = json.instances;
        setInstances(insts);
        setLastSyncedAt(new Date().toISOString());

        // Auto-select valid instance if current is not in the list
        const exists = insts.some((i) => i.name === selectedInstanceName);
        if (!exists && insts.length > 0) {
          const firstOpen = insts.find((i) => i.status === "open") || insts[0];
          setSelectedInstanceName(firstOpen.name);
          handleSelectInstance(firstOpen.name);
        }

        success("Instâncias Localizadas", `${insts.length} instância(s) encontrada(s) no servidor.`);
      } else {
        throw new Error(json.error || "Nenhuma instância retornada.");
      }
    } catch (err: any) {
      error("Erro ao Buscar Instâncias", err.message);
    } finally {
      setIsFetchingInstances(false);
    }
  };

  // 4. Action: Save Configuration
  const handleSaveConfig = async () => {
    setIsSaving(true);
    try {
      const res = await fetch("/api/channels/evolution", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          baseUrl,
          apiKey,
          selectedInstanceName,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Erro ao salvar configuração.");
      }

      success("Configuração Salva", "As credenciais e instância padrão foram gravadas com sucesso.");
    } catch (err: any) {
      error("Erro ao Salvar", err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // 5. Action: Select Active Instance
  const handleSelectInstance = async (instanceName: string) => {
    try {
      const res = await fetch("/api/channels/evolution/select-instance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instanceName }),
      });

      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.error);

      setSelectedInstanceName(instanceName);
      setInstances((prev) =>
        prev.map((i) => ({
          ...i,
          isDefault: i.name === instanceName,
        }))
      );

      success("Instância Selecionada", `A instância "${instanceName}" agora é a padrão utilizada pelos chatbots.`);
    } catch (err: any) {
      error("Erro ao Selecionar", err.message);
    }
  };

  // 6. Action: Configure Webhook on Instance
  const handleConfigureWebhook = async (instanceName: string) => {
    setConfiguringWebhookFor(instanceName);
    try {
      const res = await fetch("/api/channels/evolution/configure-webhook", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          instanceName,
          webhookUrl: webhookUrlInput,
        }),
      });

      const json = await res.json();
      if (!res.ok || !json.success || !json.result?.success) {
        throw new Error(json.result?.message || json.error || "Falha ao configurar webhook.");
      }

      // Update local state
      setInstances((prev) =>
        prev.map((i) =>
          i.name === instanceName
            ? { ...i, webhookUrl: webhookUrlInput, webhookEnabled: true }
            : i
        )
      );

      success("Webhook Ativado!", json.result.message);
    } catch (err: any) {
      error("Erro ao Configurar Webhook", err.message);
    } finally {
      setConfiguringWebhookFor(null);
    }
  };

  // 7. Action: Sync Now
  const handleSyncNow = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/channels/evolution/sync", { method: "POST" });
      const json = await res.json();
      if (json.success) {
        setInstances(json.instances || []);
        setIsConnected(Boolean(json.isConnected));
        setLastSyncedAt(new Date().toISOString());
        success("Sincronizado!", "Status das instâncias atualizado em tempo real.");
      }
    } catch (err: any) {
      error("Erro na Sincronização", err.message);
    } finally {
      setIsSyncing(false);
    }
  };

  if (isPageLoading) {
    return <Loading text="Carregando configurações da Evolution API..." size="lg" className="h-96" />;
  }

  return (
    <div className="flex-1 p-8 max-w-6xl mx-auto w-full space-y-8">
      {/* Breadcrumb & Navigation */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Link href="/settings" className="hover:text-foreground transition-colors">
            Configurações
          </Link>
          <span>/</span>
          <span>Canais de Comunicação</span>
          <span>/</span>
          <span className="text-foreground font-medium">Evolution API</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pt-1 border-b border-border/80 pb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground tracking-tight flex items-center gap-2.5">
              <span>Evolution API</span>
              <span
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium border ${
                  isConnected
                    ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                    : "bg-rose-500/10 text-rose-400 border-rose-500/30"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isConnected ? "bg-emerald-400" : "bg-rose-400"}`} />
                {isConnected ? "Conectado" : "Desconectado"}
              </span>
            </h1>
            <p className="text-xs text-muted-foreground mt-1">
              Conecte sua Evolution API, localize instâncias do WhatsApp e selecione a instância padrão para os chatbots.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleSyncNow}
              isLoading={isSyncing}
              className="gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Sincronizar Agora</span>
            </Button>
          </div>
        </div>
      </div>

      {/* Top Metric Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <Card className="bg-[#11131a] border-border/70 p-4">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
            Status da Conexão
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`h-2.5 w-2.5 rounded-full ${isConnected ? "bg-emerald-500" : "bg-rose-500"}`} />
            <p className="text-sm font-bold text-foreground">{isConnected ? "Online & Autenticado" : "Offline"}</p>
          </div>
        </Card>

        <Card className="bg-[#11131a] border-border/70 p-4">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
            Total de Instâncias
          </span>
          <p className="text-xl font-bold text-foreground mt-1">{instances.length}</p>
        </Card>

        <Card className="bg-[#11131a] border-border/70 p-4">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
            Instância Padrão Ativa
          </span>
          <p className="text-sm font-bold text-indigo-400 font-mono mt-1">
            {selectedInstanceName || "Nenhuma selecionada"}
          </p>
        </Card>

        <Card className="bg-[#11131a] border-border/70 p-4">
          <span className="text-[10px] font-semibold uppercase text-muted-foreground tracking-wider">
            Última Sincronização
          </span>
          <p className="text-xs text-muted-foreground mt-1">
            {lastSyncedAt ? formatRelativeTime(lastSyncedAt) : "Nunca"}
          </p>
        </Card>
      </div>

      {/* Test Result Alert Banner */}
      {testResult && (
        <div
          className={`rounded-xl border p-4 text-xs flex items-start gap-3 animate-in fade-in ${
            testResult.success
              ? "bg-emerald-950/20 border-emerald-500/30 text-emerald-200"
              : "bg-rose-950/20 border-rose-500/30 text-rose-200"
          }`}
        >
          {testResult.success ? (
            <CheckCircle2 className="h-5 w-5 text-emerald-400 shrink-0 mt-0.5" />
          ) : (
            <AlertCircle className="h-5 w-5 text-rose-400 shrink-0 mt-0.5" />
          )}
          <div className="flex-1">
            <p className="font-semibold text-sm">
              {testResult.success ? "Conexão Validada" : "Erro na Conexão"}
            </p>
            <p className="mt-0.5 leading-relaxed">{testResult.message}</p>
            {testResult.latencyMs && (
              <p className="mt-1 font-mono text-[10px] opacity-80">Latência: {testResult.latencyMs}ms</p>
            )}
          </div>
        </div>
      )}

      {/* Connection Credentials Form */}
      <Card className="bg-[#11131a] border-border/70">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Server className="h-4 w-4 text-indigo-400" />
            <CardTitle>Credenciais do Servidor</CardTitle>
          </div>
          <CardDescription>
            Informe o endereço do seu servidor da Evolution API e a chave global de autenticação (API Key).
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="URL da Evolution API"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder="https://api.meuservidor.com ou http://localhost:8080"
              helperText="Ex: https://evolution.seudominio.com"
              required
            />

            <Input
              label="API Key (Chave Global)"
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Insira sua chave global da Evolution API"
              helperText="Chave definida na variável AUTHENTICATION_API_KEY do seu .env"
              required
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-border/60">
            <div className="flex items-center gap-2">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleTestConnection}
                isLoading={isTesting}
                className="gap-1.5"
              >
                <Radio className="h-3.5 w-3.5 text-indigo-400" />
                <span>Testar Conexão</span>
              </Button>

              <Button
                variant="secondary"
                size="sm"
                onClick={handleFetchInstances}
                isLoading={isFetchingInstances}
                disabled={!baseUrl}
                className="gap-1.5"
              >
                <Search className="h-3.5 w-3.5" />
                <span>Buscar Instâncias</span>
              </Button>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={handleSaveConfig}
              isLoading={isSaving}
              className="gap-1.5 bg-indigo-600 hover:bg-indigo-500"
            >
              <Check className="h-3.5 w-3.5" />
              <span>Salvar Configuração</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Instances List Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-foreground tracking-tight">
              Instâncias Disponíveis no Servidor ({instances.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Localizadas automaticamente via Evolution API. Selecione a instância que atenderá os chatbots.
            </p>
          </div>

          <span className="text-[11px] text-muted-foreground">
            {selectedInstanceName ? `Ativa: ${selectedInstanceName}` : "Nenhuma ativa"}
          </span>
        </div>

        {instances.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border/80 bg-[#11131a]/50 p-12 text-center text-xs text-muted-foreground space-y-3">
            <Radio className="h-8 w-8 text-muted-foreground/60 mx-auto" />
            <p className="font-semibold text-foreground">Nenhuma instância localizada</p>
            <p className="max-w-sm mx-auto text-[11px]">
              Clique no botão <strong>Buscar Instâncias</strong> acima para que o sistema consulte sua Evolution API e liste todas as instâncias existentes.
            </p>
            <Button size="sm" variant="secondary" onClick={handleFetchInstances} isLoading={isFetchingInstances}>
              Buscar Instâncias Agora
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {instances.map((instance) => {
              const isSelected = instance.name === selectedInstanceName || instance.isDefault;
              const isOpen = instance.status === "open";
              const isConfiguringWebhook = configuringWebhookFor === instance.name;

              return (
                <div
                  key={instance.id}
                  className={`rounded-xl border p-5 bg-[#11131a] transition-all duration-150 space-y-4 ${
                    isSelected
                      ? "border-indigo-500 ring-2 ring-indigo-500/20 shadow-lg shadow-indigo-500/5"
                      : "border-border/70 hover:border-border"
                  }`}
                >
                  {/* Instance Header */}
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      {/* Avatar */}
                      <div className="relative">
                        {instance.profilePictureUrl ? (
                          <img
                            src={instance.profilePictureUrl}
                            alt={instance.name}
                            className="h-11 w-11 rounded-full object-cover border border-border"
                          />
                        ) : (
                          <div className="flex h-11 w-11 items-center justify-center rounded-full bg-secondary text-slate-300 font-semibold text-xs border border-border/80">
                            {instance.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <span
                          className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-[#11131a] ${
                            isOpen ? "bg-emerald-500" : "bg-rose-500"
                          }`}
                        />
                      </div>

                      {/* Name & Profile */}
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-bold text-sm text-foreground">{instance.name}</h3>
                          <span
                            className={`rounded px-1.5 py-0.2 text-[9px] font-semibold uppercase tracking-wider ${
                              isOpen
                                ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                                : "bg-rose-500/15 text-rose-400 border border-rose-500/30"
                            }`}
                          >
                            {isOpen ? "Conectado" : "Desconectado"}
                          </span>
                        </div>
                        <p className="text-xs text-slate-300 mt-0.5">
                          {instance.profileName || "Perfil sem nome configurado"}
                        </p>
                      </div>
                    </div>

                    {/* Selected Badge or Select Button */}
                    {isSelected ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 px-2.5 py-1 text-[11px] font-semibold">
                        <CheckCircle2 className="h-3.5 w-3.5 text-indigo-400" />
                        Padrão Ativa
                      </span>
                    ) : (
                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-xs h-7"
                        onClick={() => handleSelectInstance(instance.name)}
                      >
                        Selecionar
                      </Button>
                    )}
                  </div>

                  {/* Details strip: Phone & Last connection */}
                  <div className="rounded-lg bg-[#141722] p-3 text-xs space-y-1.5 border border-border/60">
                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Phone className="h-3 w-3" />
                        Número WhatsApp:
                      </span>
                      <span className="font-mono font-medium text-foreground">
                        {instance.number || "Não identificado"}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-slate-300">
                      <span className="flex items-center gap-1.5 text-muted-foreground text-[11px]">
                        <Clock className="h-3 w-3" />
                        Última Atualização:
                      </span>
                      <span className="text-[11px] text-muted-foreground">
                        {instance.updatedAt ? formatRelativeTime(instance.updatedAt) : "-"}
                      </span>
                    </div>
                  </div>

                  {/* Webhook Configuration for this instance */}
                  <div className="pt-2 border-t border-border/60 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-medium text-muted-foreground flex items-center gap-1">
                        <Globe className="h-3 w-3 text-indigo-400" />
                        Webhook da Instância:
                      </span>
                      {instance.webhookEnabled ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-400">
                          <Check className="h-3 w-3" />
                          Configurado e Ativo
                        </span>
                      ) : (
                        <span className="text-[10px] text-amber-400 italic">Não configurado</span>
                      )}
                    </div>

                    {instance.webhookUrl && (
                      <p className="font-mono text-[10px] text-muted-foreground truncate bg-[#0c0d12] p-1.5 rounded border border-border/40">
                        {instance.webhookUrl}
                      </p>
                    )}

                    <Button
                      size="sm"
                      variant="subtle"
                      className="w-full text-xs h-8 text-indigo-300 hover:text-white"
                      onClick={() => handleConfigureWebhook(instance.name)}
                      isLoading={isConfiguringWebhook}
                    >
                      <Sparkles className="h-3.5 w-3.5 mr-1 text-indigo-400" />
                      Configurar Webhook Automaticamente
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Global Webhook Registration Helper Card */}
      <Card className="bg-[#11131a] border-border/70">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-emerald-400" />
            <CardTitle>Configuração Automática de Webhook</CardTitle>
          </div>
          <CardDescription>
            O sistema registra o endpoint na Evolution API via requisição oficial, sem necessidade de acessar o painel externo.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            label="URL do Webhook deste Sistema"
            value={webhookUrlInput}
            onChange={(e) => setWebhookUrlInput(e.target.value)}
            helperText="Eventos registrados: MESSAGES_UPSERT, MESSAGES_UPDATE, CONNECTION_UPDATE"
          />

          <div className="flex items-center justify-between pt-2 border-t border-border/60">
            <p className="text-xs text-muted-foreground">
              {selectedInstanceName ? (
                <span>
                  Instância selecionada para ativação:{" "}
                  <strong className="text-indigo-400 font-mono">{selectedInstanceName}</strong>
                </span>
              ) : (
                <span className="text-amber-400">Selecione uma instância acima para aplicar o webhook.</span>
              )}
            </p>

            {selectedInstanceName && (
              <Button
                size="sm"
                variant="primary"
                onClick={() => handleConfigureWebhook(selectedInstanceName)}
                isLoading={configuringWebhookFor === selectedInstanceName}
                className="gap-1.5"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span>Aplicar na Instância {selectedInstanceName}</span>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
