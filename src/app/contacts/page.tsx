"use client";

import React, { useEffect, useState, useMemo } from "react";
import Link from "next/link";
import {
  Users,
  Search,
  RefreshCw,
  Play,
  Square,
  Tag,
  ExternalLink,
  MessageSquare,
  CheckSquare,
  Square as SquareIcon,
  Bot,
  Clock,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Filter,
  CheckCircle2,
  X,
} from "lucide-react";
import { Loading } from "@/components/ui/loading";
import { formatRelativeTime, formatPhone } from "@/modules/shared/utils";

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

export default function ContactsPage() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [chatbots, setChatbots] = useState<PublishedBot[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [flowFilter, setFlowFilter] = useState<"all" | "active" | "none">("all");
  const [selectedTag, setSelectedTag] = useState<string>("all");

  // Selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Modal Iniciar Fluxo
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedBotId, setSelectedBotId] = useState<string>("");
  const [conflictPolicy, setConflictPolicy] = useState<"replace" | "keep">("replace");
  const [isStartingFlow, setIsStartingFlow] = useState(false);

  // Load Contacts & Published Bots
  const loadData = async (silent = false) => {
    if (!silent) setIsLoading(true);
    try {
      const [contactsRes, botsRes] = await Promise.all([
        fetch("/api/contacts"),
        fetch("/api/chatbots"),
      ]);

      const contactsJson = await contactsRes.json();
      const botsJson = await botsRes.json();

      if (contactsJson.success) {
        setContacts(contactsJson.data || []);
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
      console.error("Erro ao carregar dados:", err);
    } finally {
      if (!silent) setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Sync with Evolution API
  const handleSync = async () => {
    setIsSyncing(true);
    setNotification(null);
    try {
      const res = await fetch("/api/contacts/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: "success",
          text: `Sincronização concluída: ${data.data.totalSynced} contatos encontrados na Evolution API (${data.data.newContacts} novos).`,
        });
        await loadData(true);
      } else {
        setNotification({
          type: "error",
          text: data.error || "Falha ao sincronizar com a Evolution API.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: `Erro de rede: ${err.message}`,
      });
    } finally {
      setIsSyncing(false);
    }
  };

  // Distinct tags for filtering
  const allTags = useMemo(() => {
    const set = new Set<string>();
    contacts.forEach((c) => c.tags?.forEach((t) => set.add(t)));
    return Array.from(set);
  }, [contacts]);

  // Filtered contacts
  const filteredContacts = useMemo(() => {
    return contacts.filter((c) => {
      const s = search.toLowerCase().trim();
      const matchSearch =
        !s ||
        c.name.toLowerCase().includes(s) ||
        c.phone.includes(s) ||
        (c.last_message && c.last_message.toLowerCase().includes(s)) ||
        c.tags.some((t) => t.toLowerCase().includes(s)) ||
        (c.active_flow?.chatbot_name && c.active_flow.chatbot_name.toLowerCase().includes(s));

      const matchFlow =
        flowFilter === "all"
          ? true
          : flowFilter === "active"
          ? Boolean(c.active_flow)
          : !c.active_flow;

      const matchTag = selectedTag === "all" ? true : c.tags.includes(selectedTag);

      return matchSearch && matchFlow && matchTag;
    });
  }, [contacts, search, flowFilter, selectedTag]);

  // Selection Helpers
  const isAllSelected =
    filteredContacts.length > 0 &&
    filteredContacts.every((c) => selectedIds.has(c.id));

  const toggleSelectAll = () => {
    if (isAllSelected) {
      setSelectedIds(new Set());
    } else {
      const next = new Set<string>();
      filteredContacts.forEach((c) => next.add(c.id));
      setSelectedIds(next);
    }
  };

  const toggleSelectOne = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  // Trigger Flow
  const handleStartFlow = async () => {
    if (!selectedBotId || selectedIds.size === 0) return;
    setIsStartingFlow(true);
    setNotification(null);

    try {
      const res = await fetch("/api/contacts/start-flow", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contactIds: Array.from(selectedIds),
          chatbotId: selectedBotId,
          policy: conflictPolicy,
        }),
      });

      const data = await res.json();
      if (data.success) {
        setNotification({
          type: "success",
          text: `Fluxo disparado com sucesso para ${data.data.dispatchedCount} contato(s)!`,
        });
        setIsModalOpen(false);
        setSelectedIds(new Set());
        await loadData(true);
      } else {
        setNotification({
          type: "error",
          text: data.error || "Falha ao iniciar fluxo.",
        });
      }
    } catch (err: any) {
      setNotification({
        type: "error",
        text: `Erro ao iniciar fluxo: ${err.message}`,
      });
    } finally {
      setIsStartingFlow(false);
    }
  };

  // Stop Flow
  const handleStopFlow = async (contactId: string, contactName: string) => {
    if (!confirm(`Deseja interromper o fluxo ativo para ${contactName}?`)) return;

    try {
      const res = await fetch(`/api/contacts/${contactId}/stop-flow`, {
        method: "POST",
      });
      const data = await res.json();
      if (data.success) {
        setNotification({
          type: "success",
          text: `Fluxo interrompido com sucesso para ${contactName}.`,
        });
        await loadData(true);
      } else {
        alert(data.error || "Falha ao interromper fluxo.");
      }
    } catch (err: any) {
      alert(`Erro: ${err.message}`);
    }
  };

  return (
    <div className="flex-1 p-6 sm:p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Top Banner / Breadcrumb */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold text-foreground tracking-tight">Contatos</h1>
            <span className="rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 px-2.5 py-0.5 text-xs font-semibold">
              Evolution API Integrada
            </span>
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            Base de contatos sincronizada diretamente do WhatsApp. Selecione contatos e dispare chatbots manualmente.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 text-xs font-medium transition shadow-sm"
          >
            <RefreshCw className={`h-4 w-4 ${isSyncing ? "animate-spin" : ""}`} />
            {isSyncing ? "Sincronizando..." : "Sincronizar Contatos"}
          </button>
        </div>
      </div>

      {/* Notification Toast Alert */}
      {notification && (
        <div
          className={`flex items-center justify-between p-4 rounded-xl border text-xs font-medium transition ${
            notification.type === "success"
              ? "bg-emerald-950/40 border-emerald-500/30 text-emerald-300"
              : "bg-red-950/40 border-red-500/30 text-red-300"
          }`}
        >
          <div className="flex items-center gap-2">
            {notification.type === "success" ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
            )}
            <span>{notification.text}</span>
          </div>
          <button
            onClick={() => setNotification(null)}
            className="text-muted-foreground hover:text-foreground p-1"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Action Bar when items selected */}
      {selectedIds.size > 0 && (
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-950/90 to-[#181b26] border border-indigo-500/40 rounded-xl p-3 px-5 shadow-lg animate-in fade-in duration-200">
          <div className="flex items-center gap-3">
            <span className="flex items-center justify-center h-6 w-6 rounded-full bg-indigo-600 text-[11px] font-bold text-white">
              {selectedIds.size}
            </span>
            <span className="text-xs font-medium text-slate-200">
              {selectedIds.size === 1
                ? "1 contato selecionado"
                : `${selectedIds.size} contatos selecionados`}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-xs text-muted-foreground hover:text-slate-200 px-3 py-1.5 rounded-lg border border-border/70 hover:bg-white/5 transition"
            >
              Desmarcar todos
            </button>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold px-4 py-2 rounded-lg shadow transition"
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              Iniciar Fluxo
            </button>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
        {/* Search */}
        <div className="relative md:col-span-6">
          <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Pesquisar por nome, número, mensagem, tag ou fluxo..."
            className="w-full rounded-xl bg-[#12141c] border border-border/70 pl-10 pr-4 py-2.5 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500 transition"
          />
        </div>

        {/* Flow Filter */}
        <div className="md:col-span-3">
          <select
            value={flowFilter}
            onChange={(e) => setFlowFilter(e.target.value as any)}
            className="w-full rounded-xl bg-[#12141c] border border-border/70 px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="all">Todos os Contatos</option>
            <option value="active">Com Fluxo Ativo</option>
            <option value="none">Sem Fluxo</option>
          </select>
        </div>

        {/* Tag Filter */}
        <div className="md:col-span-3">
          <select
            value={selectedTag}
            onChange={(e) => setSelectedTag(e.target.value)}
            className="w-full rounded-xl bg-[#12141c] border border-border/70 px-3 py-2.5 text-xs text-foreground focus:outline-none focus:border-indigo-500 transition"
          >
            <option value="all">Todas as Tags</option>
            {allTags.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Contacts Table */}
      {isLoading ? (
        <Loading text="Carregando contatos sincronizados..." />
      ) : filteredContacts.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border/70 bg-[#11131a]/50 p-12 text-center space-y-3">
          <Users className="h-10 w-10 text-muted-foreground/50 mx-auto" />
          <div className="text-sm font-medium text-foreground">Nenhum contato encontrado</div>
          <p className="text-xs text-muted-foreground max-w-md mx-auto">
            {search || flowFilter !== "all" || selectedTag !== "all"
              ? "Tente ajustar seus filtros de busca para encontrar os contatos."
              : "Clique em 'Sincronizar Contatos' acima para carregar automaticamente as conversas do seu WhatsApp conectado via Evolution API."}
          </p>
          <button
            onClick={handleSync}
            disabled={isSyncing}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600/20 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-600/30 px-4 py-2 text-xs font-medium transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isSyncing ? "animate-spin" : ""}`} />
            Sincronizar Agora
          </button>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/70 bg-[#11131a] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141722] border-b border-border/80 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="py-3 px-4 w-10">
                    <button
                      onClick={toggleSelectAll}
                      className="text-muted-foreground hover:text-foreground flex items-center"
                    >
                      {isAllSelected ? (
                        <CheckSquare className="h-4 w-4 text-indigo-400" />
                      ) : (
                        <SquareIcon className="h-4 w-4 text-muted-foreground/60" />
                      )}
                    </button>
                  </th>
                  <th className="py-3 px-4">Contato</th>
                  <th className="py-3 px-4">Última Mensagem</th>
                  <th className="py-3 px-4">Última Interação</th>
                  <th className="py-3 px-4">Tags</th>
                  <th className="py-3 px-4">Fluxo Ativo</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/40">
                {filteredContacts.map((contact) => {
                  const isSelected = selectedIds.has(contact.id);
                  const hasActiveFlow = Boolean(contact.active_flow);

                  return (
                    <tr
                      key={contact.id}
                      className={`hover:bg-[#161924]/60 transition group ${
                        isSelected ? "bg-indigo-950/20" : ""
                      }`}
                    >
                      {/* Checkbox */}
                      <td className="py-3 px-4">
                        <button
                          onClick={() => toggleSelectOne(contact.id)}
                          className="flex items-center text-muted-foreground hover:text-foreground"
                        >
                          {isSelected ? (
                            <CheckSquare className="h-4 w-4 text-indigo-400" />
                          ) : (
                            <SquareIcon className="h-4 w-4 text-muted-foreground/40 group-hover:text-muted-foreground/80" />
                          )}
                        </button>
                      </td>

                      {/* Contact Info / Avatar */}
                      <td className="py-3 px-4">
                        <Link
                          href={`/contacts/${contact.id}`}
                          className="flex items-center gap-3 group-hover:text-indigo-400 transition"
                        >
                          <div className="relative h-9 w-9 rounded-full bg-slate-800 border border-border/60 flex items-center justify-center overflow-hidden shrink-0">
                            {contact.profile_pic_url ? (
                              <img
                                src={contact.profile_pic_url}
                                alt={contact.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <span className="text-xs font-semibold text-slate-300">
                                {contact.name.charAt(0).toUpperCase()}
                              </span>
                            )}
                          </div>
                          <div>
                            <div className="font-semibold text-foreground group-hover:text-indigo-300">
                              {contact.name}
                            </div>
                            <div className="text-[11px] text-muted-foreground font-mono">
                              {formatPhone(contact.phone)}
                            </div>
                          </div>
                        </Link>
                      </td>

                      {/* Last Message */}
                      <td className="py-3 px-4 max-w-xs truncate text-muted-foreground">
                        {contact.last_message ? (
                          <div className="flex items-center gap-1.5">
                            {contact.last_message_from_me && (
                              <span className="text-[10px] text-indigo-400 font-bold shrink-0">
                                Você:
                              </span>
                            )}
                            <span className="truncate">{contact.last_message}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/40 italic">Sem mensagens</span>
                        )}
                      </td>

                      {/* Last Interaction */}
                      <td className="py-3 px-4 whitespace-nowrap text-muted-foreground">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-muted-foreground/50" />
                          <span>{formatRelativeTime(contact.last_message_at || contact.updated_at)}</span>
                        </div>
                      </td>

                      {/* Tags */}
                      <td className="py-3 px-4">
                        <div className="flex flex-wrap gap-1 max-w-[200px]">
                          {contact.tags && contact.tags.length > 0 ? (
                            contact.tags.map((tag) => (
                              <span
                                key={tag}
                                className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-300 border border-slate-700/60"
                              >
                                {tag}
                              </span>
                            ))
                          ) : (
                            <span className="text-[11px] text-muted-foreground/40 italic">—</span>
                          )}
                        </div>
                      </td>

                      {/* Active Flow */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {hasActiveFlow ? (
                          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-indigo-500/15 border border-indigo-500/30 text-indigo-300">
                            <Bot className="h-3 w-3 text-indigo-400" />
                            <span>{contact.active_flow?.chatbot_name}</span>
                          </div>
                        ) : (
                          <span className="text-muted-foreground/50 text-[11px] italic">Sem fluxo</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="py-3 px-4 whitespace-nowrap">
                        {contact.status === "active" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                            Em fluxo
                          </span>
                        ) : contact.status === "waiting" ? (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-amber-500/15 text-amber-400 border border-amber-500/30">
                            <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                            Aguardando resposta
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-800 text-slate-400 border border-slate-700/50">
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="py-3 px-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {hasActiveFlow && (
                            <button
                              onClick={() => handleStopFlow(contact.id, contact.name)}
                              title="Parar fluxo ativo"
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 transition"
                            >
                              <Square className="h-3 w-3 fill-current" />
                              Parar
                            </button>
                          )}
                          <Link
                            href={`/contacts/${contact.id}`}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-medium bg-white/5 hover:bg-white/10 text-slate-300 border border-border/70 transition"
                          >
                            Ver
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Table Footer */}
          <div className="p-4 border-t border-border/80 flex items-center justify-between text-xs text-muted-foreground bg-[#141722]/50">
            <div>
              Mostrando <strong className="text-foreground">{filteredContacts.length}</strong> de{" "}
              <strong className="text-foreground">{contacts.length}</strong> contatos
            </div>
            {selectedIds.size > 0 && (
              <div className="text-indigo-400 font-medium">
                {selectedIds.size} contato(s) selecionado(s)
              </div>
            )}
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
                  Iniciar chatbot publicado para {selectedIds.size} contato(s) selecionado(s).
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

            {/* Policy Conflict */}
            <div className="space-y-2 pt-2 border-t border-border/70">
              <label className="text-xs font-semibold text-slate-300">
                Se o contato já tiver um fluxo em andamento:
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConflictPolicy("replace")}
                  className={`p-2.5 rounded-xl border text-xs text-left transition ${
                    conflictPolicy === "replace"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold"
                      : "bg-[#10121a] border-border/60 text-muted-foreground hover:bg-[#161924]"
                  }`}
                >
                  <div className="font-semibold text-foreground">Cancelar atual</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Substitui pelo novo fluxo
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setConflictPolicy("keep")}
                  className={`p-2.5 rounded-xl border text-xs text-left transition ${
                    conflictPolicy === "keep"
                      ? "bg-indigo-600/20 border-indigo-500 text-indigo-200 font-semibold"
                      : "bg-[#10121a] border-border/60 text-muted-foreground hover:bg-[#161924]"
                  }`}
                >
                  <div className="font-semibold text-foreground">Continuar atual</div>
                  <div className="text-[10px] text-muted-foreground mt-0.5">
                    Ignora quem já tem fluxo ativo
                  </div>
                </button>
              </div>
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
