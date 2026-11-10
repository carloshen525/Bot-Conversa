"use client";

import React, { useEffect, useState, use } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Phone,
  Calendar,
  Tag as TagIcon,
  Bot,
  Play,
  Square,
  MessageSquare,
  CheckCircle2,
  Clock,
  Plus,
  Trash2,
  Save,
  RefreshCw,
  ExternalLink,
  Variable,
  AlertCircle,
  X,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { formatDate, formatRelativeTime } from "@/modules/shared/utils";

interface Contact {
  id: string;
  name: string;
  phone: string;
  profile_pic_url?: string;
  last_message?: string;
  last_message_at: string;
  last_message_from_me?: boolean;
  instance_name?: string;
  tags: string[];
  variables: Record<string, string>;
  active_flow?: {
    chatbot_id: string;
    chatbot_name: string;
    version_id: string;
    current_node_id?: string;
    status: string;
    started_at: string;
  };
  status: "active" | "waiting" | "idle";
  created_at: string;
  updated_at: string;
}

interface PublishedBot {
  id: string;
  name: string;
  status: string;
  current_published_version_id?: string;
}

export default function ContactDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = use(params);
  const contactId = resolvedParams.id;

  const [contact, setContact] = useState<Contact | null>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [executions, setExecutions] = useState<any[]>([]);
  const [chatbots, setChatbots] = useState<PublishedBot[]>([]);
  const [activeTab, setActiveTab] = useState<"messages" | "executions" | "variables">("messages");
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Tags & Variables state
  const [tags, setTags] = useState<string[]>([]);
  const [newTagInput, setNewTagInput] = useState("");
  const [variables, setVariables] = useState<{ key: string; value: string }[]>([]);
  const [isSavingAttributes, setIsSavingAttributes] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Start Flow Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<string>("");
  const [isStartingFlow, setIsStartingFlow] = useState(false);

  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    else setIsRefreshing(true);

    try {
      const [historyRes, botsRes] = await Promise.all([
        fetch(`/api/contacts/${contactId}/history`),
        fetch("/api/chatbots"),
      ]);

      const historyJson = await historyRes.json();
      const botsJson = await botsRes.json();

      if (historyJson.success) {
        const c: Contact = historyJson.data.contact;
        setContact(c);
        setMessages(historyJson.data.messages || []);
        setExecutions(historyJson.data.executions || []);
        setTags(c.tags || []);
        const varList = Object.entries(c.variables || {}).map(([key, value]) => ({
          key,
          value: String(value),
        }));
        setVariables(varList);
      }

      if (botsJson.success) {
        const published = (botsJson.data || []).filter(
          (b: any) => b.status === "published" && b.current_published_version_id
        );
        setChatbots(published);
        if (published.length > 0 && !selectedBotId) {
          setSelectedBotId(published[0].id);
        }
      }
    } catch (err: any) {
      console.error("Erro ao carregar detalhes do contato:", err);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [contactId]);

  // Add tag
  const handleAddTag = () => {
    const val = newTagInput.trim();
    if (!val || tags.includes(val)) return;
    setTags([...tags, val]);
    setNewTagInput("");
  };

  // Remove tag
  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Add variable row
  const handleAddVariableRow = () => {
    setVariables([...variables, { key: "", value: "" }]);
  };

  // Update variable row
  const handleUpdateVariableRow = (index: number, key: string, value: string) => {
    const copy = [...variables];
    copy[index] = { key, value };
    setVariables(copy);
  };

  // Remove variable row
  const handleRemoveVariableRow = (index: number) => {
    setVariables(variables.filter((_, i) => i !== index));
  };

  // Save tags & variables
  const handleSaveAttributes = async () => {
    setIsSavingAttributes(true);
    setFeedback(null);

    const varMap: Record<string, string> = {};
    variables.forEach(({ key, value }) => {
      if (key.trim()) {
        varMap[key.trim()] = value;
      }
    });

    try {
      const res = await fetch(`/api/contacts/${contactId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tags,
          variables: varMap,
        }),
      });

      const json = await res.json();
      if (json.success) {
        setFeedback({ type: "success", text: "Tags e variáveis salvas com sucesso!" });
        setContact(json.data);
      } else {
        setFeedback({ type: "error", text: json.error || "Falha ao salvar atributos." });
      }
    } catch (err: any) {
      setFeedback({ type: "error", text: `Erro: ${err.message}` });
    } finally {
      setIsSavingAttributes(false);
    }
  };

  // Start Flow
  const handleStartFlow = async () => {
    if (!selectedBotId || !contact) return;
    setIsStartingFlow(true);
    try {
      const res = await fetch("/api/contacts/start-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactIds: [contact.id],
          chatbotId: selectedBotId,
          policy: "replace",
        }),
      });
      const json = await res.json();
      if (json.success) {
        setIsModalOpen(false);
        setFeedback({ type: "success", text: "Fluxo iniciado com sucesso para o contato!" });
        await loadData(true);
      } else {
        alert(json.error || "Falha ao iniciar fluxo.");
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    } finally {
      setIsStartingFlow(false);
    }
  };

  // Stop Flow
  const handleStopFlow = async () => {
    if (!contact) return;
    if (!confirm(`Deseja interromper o fluxo atual para ${contact.name}?`)) return;

    try {
      const res = await fetch(`/api/contacts/${contact.id}/stop-flow`, {
        method: "POST",
      });
      const json = await res.json();
      if (json.success) {
        setFeedback({ type: "success", text: "Fluxo interrompido com sucesso." });
        await loadData(true);
      } else {
        alert(json.error || "Falha ao parar fluxo.");
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full">
        <Loading text="Carregando dados do contato..." />
      </div>
    );
  }

  if (!contact) {
    return (
      <div className="flex-1 p-8 max-w-5xl mx-auto w-full text-center space-y-4">
        <h2 className="text-xl font-bold text-foreground">Contato não encontrado</h2>
        <Link
          href="/contacts"
          className="inline-flex items-center gap-2 text-indigo-400 hover:underline text-xs"
        >
          <ArrowLeft className="h-4 w-4" /> Voltar para lista de contatos
        </Link>
      </div>
    );
  }

  const hasActiveFlow = Boolean(contact.active_flow);

  return (
    <div className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Header / Back */}
      <div className="flex items-center justify-between">
        <Link
          href="/contacts"
          className="inline-flex items-center gap-2 text-xs font-medium text-muted-foreground hover:text-foreground transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar para Contatos
        </Link>

        <button
          onClick={() => loadData(true)}
          disabled={isRefreshing}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground px-3 py-1.5 rounded-lg border border-border/70 hover:bg-white/5 transition"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? "animate-spin" : ""}`} />
          Atualizar Dados
        </button>
      </div>

      {/* Notification Toast */}
      {feedback && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-red-950/40 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span>{feedback.text}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="p-1 hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Profile Card Header */}
      <div className="bg-[#11131a] border border-border/80 rounded-2xl p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="relative h-16 w-16 rounded-full bg-slate-800 border-2 border-indigo-500/30 flex items-center justify-center overflow-hidden shrink-0">
              {contact.profile_pic_url ? (
                <img
                  src={contact.profile_pic_url}
                  alt={contact.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-xl font-bold text-slate-300">
                  {contact.name.charAt(0).toUpperCase()}
                </span>
              )}
            </div>

            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-xl font-bold text-foreground">{contact.name}</h1>
                {contact.status === "active" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    Em fluxo
                  </span>
                ) : contact.status === "waiting" ? (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">
                    <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    Aguardando resposta
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-800 text-slate-400 border border-slate-700/50">
                    Inativo
                  </span>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-1.5 text-xs text-muted-foreground font-mono">
                <span className="flex items-center gap-1">
                  <Phone className="h-3.5 w-3.5 text-indigo-400" />+{contact.phone}
                </span>
                <span>•</span>
                <span>Instância: {contact.instance_name || "Carlos1"}</span>
                <span>•</span>
                <span>Criado: {formatDate(contact.created_at)}</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            {hasActiveFlow ? (
              <button
                onClick={handleStopFlow}
                className="flex items-center gap-2 rounded-xl bg-red-600/15 hover:bg-red-600/25 border border-red-500/30 text-red-300 px-4 py-2.5 text-xs font-semibold transition"
              >
                <Square className="h-3.5 w-3.5 fill-current" />
                Parar Fluxo ({contact.active_flow?.chatbot_name})
              </button>
            ) : null}

            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 text-xs font-semibold transition shadow-lg shadow-indigo-950/50"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {hasActiveFlow ? "Trocar Fluxo" : "Iniciar Fluxo"}
            </button>
          </div>
        </div>

        {/* Active Flow Banner */}
        {hasActiveFlow && (
          <div className="mt-5 pt-4 border-t border-border/60 flex items-center justify-between text-xs bg-indigo-950/20 -mx-6 -mb-6 p-4 rounded-b-2xl border-indigo-500/20">
            <div className="flex items-center gap-2 text-indigo-300">
              <Bot className="h-4 w-4 text-indigo-400" />
              <span>
                Fluxo Ativo: <strong>{contact.active_flow?.chatbot_name}</strong>
              </span>
              <span className="text-muted-foreground">
                (Iniciado {formatRelativeTime(contact.active_flow?.started_at || "")})
              </span>
            </div>
            <div className="text-[11px] text-muted-foreground font-mono">
              Status: {contact.active_flow?.status}
            </div>
          </div>
        )}
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-border/80 gap-6 text-xs font-semibold">
        <button
          onClick={() => setActiveTab("messages")}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === "messages"
              ? "border-b-2 border-indigo-500 text-indigo-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageSquare className="h-4 w-4" />
          Mensagens do WhatsApp
          <span className="rounded-full bg-slate-800 text-slate-300 px-2 py-0.5 text-[10px]">
            {messages.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("executions")}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === "executions"
              ? "border-b-2 border-indigo-500 text-indigo-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Bot className="h-4 w-4" />
          Histórico de Fluxos
          <span className="rounded-full bg-slate-800 text-slate-300 px-2 py-0.5 text-[10px]">
            {executions.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab("variables")}
          className={`pb-3 transition flex items-center gap-2 ${
            activeTab === "variables"
              ? "border-b-2 border-indigo-500 text-indigo-400"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Variable className="h-4 w-4" />
          Tags & Variáveis
        </button>
      </div>

      {/* Tab 1: WhatsApp Messages Timeline */}
      {activeTab === "messages" && (
        <div className="bg-[#11131a] border border-border/80 rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-border/70">
            <div>
              <h3 className="text-sm font-bold text-foreground">Conversa do WhatsApp</h3>
              <p className="text-xs text-muted-foreground">
                Sincronizado diretamente pela Evolution API (Instância {contact.instance_name || "Carlos1"})
              </p>
            </div>
            <span className="text-xs text-muted-foreground font-mono">
              Total: {messages.length} mensagens
            </span>
          </div>

          {messages.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Nenhuma mensagem registrada ainda para este número.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto p-2">
              {messages.map((msg, idx) => (
                <div
                  key={msg.id || idx}
                  className={`flex flex-col ${msg.fromMe ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-md rounded-2xl p-3 text-xs shadow-sm ${
                      msg.fromMe
                        ? "bg-indigo-600 text-white rounded-br-none"
                        : "bg-[#181b26] border border-border/70 text-slate-200 rounded-bl-none"
                    }`}
                  >
                    <div className="whitespace-pre-wrap break-words">{msg.text || "Mensagem de mídia"}</div>
                    <div
                      className={`text-[9px] mt-1 text-right ${
                        msg.fromMe ? "text-indigo-200" : "text-muted-foreground"
                      }`}
                    >
                      {formatRelativeTime(msg.timestamp)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Flow Executions History */}
      {activeTab === "executions" && (
        <div className="bg-[#11131a] border border-border/80 rounded-2xl p-6 space-y-4">
          <div className="pb-3 border-b border-border/70">
            <h3 className="text-sm font-bold text-foreground">Execuções de Chatbots</h3>
            <p className="text-xs text-muted-foreground">
              Histórico de todos os fluxos acionados automaticamente ou manualmente para este contato.
            </p>
          </div>

          {executions.length === 0 ? (
            <div className="p-12 text-center text-xs text-muted-foreground">
              Nenhuma execução registrada para este contato.
            </div>
          ) : (
            <div className="divide-y divide-border/50">
              {executions.map((exec) => (
                <div key={exec.id} className="py-4 flex items-center justify-between text-xs">
                  <div>
                    <div className="font-semibold text-foreground flex items-center gap-2">
                      <Bot className="h-4 w-4 text-indigo-400" />
                      Chatbot ID: <span className="font-mono text-indigo-300">{exec.chatbot_id}</span>
                    </div>
                    <div className="text-[11px] text-muted-foreground mt-1">
                      Nó Atual: <span className="font-mono">{exec.current_node_id || "Fim do fluxo"}</span> •
                      Iniciado em: {formatDate(exec.created_at)}
                    </div>
                  </div>

                  <div>
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-semibold ${
                        exec.status === "active"
                          ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30"
                          : exec.status === "waiting_input"
                          ? "bg-amber-500/15 text-amber-400 border border-amber-500/30"
                          : exec.status === "completed"
                          ? "bg-blue-500/15 text-blue-400 border border-blue-500/30"
                          : "bg-red-500/15 text-red-400 border border-red-500/30"
                      }`}
                    >
                      {exec.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Tags & Variables Editor */}
      {activeTab === "variables" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tags */}
          <div className="bg-[#11131a] border border-border/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2">
              <TagIcon className="h-4 w-4 text-indigo-400" />
              <h3 className="text-sm font-bold text-foreground">Tags do Contato</h3>
            </div>
            <p className="text-xs text-muted-foreground">
              Adicione etiquetas para segmentação e disparo condicional de fluxos.
            </p>

            <div className="flex gap-2">
              <input
                type="text"
                value={newTagInput}
                onChange={(e) => setNewTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
                placeholder="Nova tag (ex: VIP, Interessado)..."
                className="flex-1 rounded-xl bg-[#141722] border border-border/70 px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="button"
                onClick={handleAddTag}
                className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-2 rounded-xl text-xs font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                Adicionar
              </button>
            </div>

            <div className="flex flex-wrap gap-2 pt-2">
              {tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs bg-slate-800 text-slate-200 border border-slate-700"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    className="text-muted-foreground hover:text-red-400"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </span>
              ))}
              {tags.length === 0 && (
                <span className="text-xs text-muted-foreground/50 italic">Nenhuma tag associada.</span>
              )}
            </div>
          </div>

          {/* Variables */}
          <div className="bg-[#11131a] border border-border/80 rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Variable className="h-4 w-4 text-indigo-400" />
                <h3 className="text-sm font-bold text-foreground">Variáveis Personalizadas</h3>
              </div>
              <button
                type="button"
                onClick={handleAddVariableRow}
                className="flex items-center gap-1 text-[11px] text-indigo-400 hover:text-indigo-300 font-semibold"
              >
                <Plus className="h-3.5 w-3.5" />
                Nova Variável
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Valores capturados em formulários ou perguntas do chatbot acessíveis via <code>{"{{variavel}}"}</code>.
            </p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {variables.map((v, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <input
                    type="text"
                    value={v.key}
                    onChange={(e) => handleUpdateVariableRow(i, e.target.value, v.value)}
                    placeholder="Chave (ex: interesse)"
                    className="flex-1 rounded-xl bg-[#141722] border border-border/70 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60"
                  />
                  <input
                    type="text"
                    value={v.value}
                    onChange={(e) => handleUpdateVariableRow(i, v.key, e.target.value)}
                    placeholder="Valor (ex: Alfabetização)"
                    className="flex-1 rounded-xl bg-[#141722] border border-border/70 px-3 py-1.5 text-xs text-foreground placeholder:text-muted-foreground/60"
                  />
                  <button
                    onClick={() => handleRemoveVariableRow(i)}
                    className="text-muted-foreground hover:text-red-400 p-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
              {variables.length === 0 && (
                <span className="text-xs text-muted-foreground/50 italic">Nenhuma variável customizada.</span>
              )}
            </div>

            <div className="pt-3 border-t border-border/70 flex justify-end">
              <button
                type="button"
                onClick={handleSaveAttributes}
                disabled={isSavingAttributes}
                className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-xs font-semibold px-4 py-2 rounded-xl transition"
              >
                <Save className="h-3.5 w-3.5" />
                {isSavingAttributes ? "Salvando..." : "Salvar Alterações"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Iniciar Fluxo */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#141722] border border-border/80 rounded-2xl max-w-lg w-full p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b border-border/70 pb-4">
              <div>
                <h3 className="text-base font-bold text-foreground">Selecionar Fluxo</h3>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Iniciar chatbot para <strong>{contact.name}</strong> (+{contact.phone}).
                </p>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Chatbot List Selection */}
            <div className="space-y-3">
              <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Chatbots Publicados
              </label>

              {chatbots.length === 0 ? (
                <div className="p-4 rounded-xl border border-dashed border-border/70 text-center text-xs text-muted-foreground">
                  Nenhum chatbot publicado encontrado. Publique uma versão do chatbot primeiro.
                </div>
              ) : (
                <div className="max-h-56 overflow-y-auto space-y-2 pr-1">
                  {chatbots.map((bot) => (
                    <label
                      key={bot.id}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition ${
                        selectedBotId === bot.id
                          ? "bg-indigo-600/15 border-indigo-500 text-indigo-300"
                          : "bg-[#10121a] border-border/60 hover:bg-[#161924] text-slate-300"
                      }`}
                    >
                      <input
                        type="radio"
                        name="chatbotSelect"
                        value={bot.id}
                        checked={selectedBotId === bot.id}
                        onChange={() => setSelectedBotId(bot.id)}
                        className="text-indigo-600 focus:ring-indigo-500"
                      />
                      <div className="flex-1">
                        <div className="text-xs font-semibold">{bot.name}</div>
                        <div className="text-[10px] text-muted-foreground font-mono">
                          ID: {bot.id}
                        </div>
                      </div>
                      <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2 py-0.5 text-[10px] font-semibold">
                        Publicado
                      </span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-border/70">
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-medium text-slate-400 hover:text-white border border-border/60 hover:bg-white/5 transition"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleStartFlow}
                disabled={!selectedBotId || isStartingFlow}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white shadow-lg transition"
              >
                {isStartingFlow ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Iniciando...
                  </>
                ) : (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current" />
                    Iniciar Fluxo
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
