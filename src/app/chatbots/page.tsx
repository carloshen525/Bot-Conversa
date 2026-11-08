"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Bot,
  Plus,
  Edit3,
  Copy,
  Trash2,
  Rocket,
  Search,
  MoreVertical,
  CheckCircle2,
  Clock,
  Layers,
  ArrowUpRight,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Modal } from "@/components/ui/modal";
import { Dialog } from "@/components/ui/dialog";
import { Dropdown } from "@/components/ui/dropdown";
import { Loading } from "@/components/ui/loading";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast } from "@/components/ui/toast";
import { formatDate, formatRelativeTime } from "@/modules/shared/utils";
import { VersionHistoryModal } from "@/modules/chatbots/editor/VersionHistoryModal";

interface ChatbotItem {
  id: string;
  name: string;
  description: string;
  status: "draft" | "published" | "archived";
  current_published_version_id?: string | null;
  current_version?: {
    id: string;
    version_number: number;
    published_at: string;
  } | null;
  created_at: string;
  updated_at: string;
}

export default function ChatbotsPage() {
  const { success, error, info } = useToast();
  const [chatbots, setChatbots] = useState<ChatbotItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal Create
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBotName, setNewBotName] = useState("");
  const [newBotDesc, setNewBotDesc] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Dialog Delete
  const [deleteTarget, setDeleteTarget] = useState<ChatbotItem | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Publishing
  const [isPublishingId, setIsPublishingId] = useState<string | null>(null);

  // Version History Modal
  const [historyTarget, setHistoryTarget] = useState<ChatbotItem | null>(null);

  const fetchChatbots = async () => {
    try {
      const res = await fetch("/api/chatbots");
      const json = await res.json();
      if (json.success) {
        setChatbots(json.data || []);
      }
    } catch (err: any) {
      error("Erro ao carregar chatbots", err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchChatbots();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBotName.trim()) return;

    setIsCreating(true);
    try {
      const res = await fetch("/api/chatbots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newBotName.trim(), description: newBotDesc.trim() }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao criar chatbot");

      success("Chatbot Criado", `O chatbot "${newBotName}" foi criado.`);
      setIsCreateOpen(false);
      setNewBotName("");
      setNewBotDesc("");
      await fetchChatbots();
    } catch (err: any) {
      error("Erro", err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const handleDuplicate = async (bot: ChatbotItem) => {
    try {
      const res = await fetch(`/api/chatbots/${bot.id}/duplicate`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao duplicar");

      success("Chatbot Duplicado", `Cópia de "${bot.name}" criada.`);
      await fetchChatbots();
    } catch (err: any) {
      error("Erro ao duplicar", err.message);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/chatbots/${deleteTarget.id}`, { method: "DELETE" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao excluir");

      success("Excluído", `Chatbot "${deleteTarget.name}" removido.`);
      setDeleteTarget(null);
      await fetchChatbots();
    } catch (err: any) {
      error("Erro ao excluir", err.message);
    } finally {
      setIsDeleting(false);
    }
  };

  const handlePublish = async (bot: ChatbotItem) => {
    setIsPublishingId(bot.id);
    try {
      const res = await fetch(`/api/chatbots/${bot.id}/publish`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ changelog: "Publicação manual na listagem" }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao publicar");

      success(
        "Chatbot Publicado!",
        `Snapshot imutável v${json.data?.version_number} gerado.`
      );
      await fetchChatbots();
    } catch (err: any) {
      error("Erro ao publicar", err.message);
    } finally {
      setIsPublishingId(null);
    }
  };

  const filteredBots = chatbots.filter(
    (b) =>
      b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 max-w-7xl mx-auto w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-border/80 pb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Chatbots</h1>
          <p className="text-xs text-muted-foreground mt-1">
            Gerencie seus fluxos automatizados de conversa e visualize as versões publicadas.
          </p>
        </div>
        <Button size="sm" variant="primary" onClick={() => setIsCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          <span>Novo Chatbot</span>
        </Button>
      </div>

      {/* Filter / Search Bar */}
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar por nome ou descrição..."
            className="w-full rounded-lg bg-[#12141c] border border-border/70 pl-9 pr-4 py-2 text-xs text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-indigo-500"
          />
        </div>
      </div>

      {/* Table / List */}
      {isLoading ? (
        <Loading text="Carregando chatbots..." />
      ) : filteredBots.length === 0 ? (
        <EmptyState
          icon={<Bot className="h-8 w-8 text-indigo-400" />}
          title="Nenhum chatbot encontrado"
          description={
            searchQuery
              ? "Nenhum resultado corresponde à sua pesquisa."
              : "Crie seu primeiro fluxo de chatbot visual para automatizar o WhatsApp."
          }
          action={{
            label: "Novo Chatbot",
            onClick: () => setIsCreateOpen(true),
            icon: <Plus className="h-4 w-4" />,
          }}
        />
      ) : (
        <div className="rounded-xl border border-border/70 bg-[#11131a] overflow-hidden shadow-sm">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#141722] border-b border-border/80 text-muted-foreground font-semibold uppercase tracking-wider text-[10px]">
                <tr>
                  <th className="px-5 py-3.5">Nome</th>
                  <th className="px-5 py-3.5">Status</th>
                  <th className="px-5 py-3.5">Versão Publicada</th>
                  <th className="px-5 py-3.5">Última Edição</th>
                  <th className="px-5 py-3.5">Última Publicação</th>
                  <th className="px-5 py-3.5 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border/60 text-slate-300">
                {filteredBots.map((bot) => {
                  const isPublished = bot.status === "published";
                  const versionNum = bot.current_version?.version_number;

                  return (
                    <tr
                      key={bot.id}
                      className="hover:bg-[#151822]/60 transition-colors group"
                    >
                      {/* Name */}
                      <td className="px-5 py-4">
                        <Link
                          href={`/chatbots/${bot.id}`}
                          className="font-medium text-foreground hover:text-indigo-400 transition-colors block text-sm"
                        >
                          {bot.name}
                        </Link>
                        {bot.description && (
                          <p className="text-[11px] text-muted-foreground line-clamp-1 mt-0.5">
                            {bot.description}
                          </p>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-4">
                        <span
                          className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-medium border ${
                            isPublished
                              ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                              : "bg-amber-500/10 text-amber-400 border-amber-500/30"
                          }`}
                        >
                          <span
                            className={`h-1.5 w-1.5 rounded-full ${
                              isPublished ? "bg-emerald-400" : "bg-amber-400"
                            }`}
                          />
                          {isPublished ? "Publicado" : "Rascunho"}
                        </span>
                      </td>

                      {/* Published Version */}
                      <td className="px-5 py-4">
                        {versionNum ? (
                          <span className="rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 text-[11px] font-mono font-semibold">
                            v{versionNum}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-[11px] italic">
                            Não publicada
                          </span>
                        )}
                      </td>

                      {/* Last Edited */}
                      <td className="px-5 py-4 text-muted-foreground text-[11px]">
                        {formatRelativeTime(bot.updated_at)}
                      </td>

                      {/* Last Published */}
                      <td className="px-5 py-4 text-muted-foreground text-[11px]">
                        {bot.current_version?.published_at
                          ? formatRelativeTime(bot.current_version.published_at)
                          : "-"}
                      </td>

                      {/* Action Buttons */}
                      <td className="px-5 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* Edit button */}
                          <Link href={`/chatbots/${bot.id}`}>
                            <Button size="sm" variant="secondary" className="h-8 px-2.5 text-xs">
                              <Edit3 className="h-3.5 w-3.5" />
                              <span className="hidden sm:inline">Editar</span>
                            </Button>
                          </Link>

                          {/* Publish button */}
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handlePublish(bot)}
                            isLoading={isPublishingId === bot.id}
                            className="h-8 px-2.5 text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                            title="Publicar novo snapshot"
                          >
                            <Rocket className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">Publicar</span>
                          </Button>

                          {/* Version history / rollback */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setHistoryTarget(bot)}
                            title="Histórico de versões e rollback"
                            className="h-8 w-8 p-0 hover:text-indigo-400"
                          >
                            <History className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>

                          {/* Duplicate */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDuplicate(bot)}
                            title="Duplicar chatbot"
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3.5 w-3.5 text-muted-foreground" />
                          </Button>

                          {/* Delete */}
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setDeleteTarget(bot)}
                            title="Excluir chatbot"
                            className="h-8 w-8 p-0 hover:text-red-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal: Novo Chatbot */}
      <Modal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        title="Criar Novo Chatbot"
        description="Defina as informações básicas do seu novo fluxo visual"
      >
        <form onSubmit={handleCreate} className="space-y-4">
          <Input
            label="Nome do Chatbot"
            value={newBotName}
            onChange={(e) => setNewBotName(e.target.value)}
            placeholder="Ex: Triagem Comercial, Agendamento..."
            required
            autoFocus
          />

          <Input
            label="Descrição (Opcional)"
            value={newBotDesc}
            onChange={(e) => setNewBotDesc(e.target.value)}
            placeholder="Ex: Atendimento automático de boas-vindas e qualificação"
          />

          <div className="flex justify-end gap-2 pt-3 border-t border-border/70">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateOpen(false)}
              disabled={isCreating}
            >
              Cancelar
            </Button>
            <Button type="submit" size="sm" isLoading={isCreating}>
              Criar Chatbot
            </Button>
          </div>
        </form>
      </Modal>

      {/* Dialog: Confirm Delete */}
      <Dialog
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Excluir Chatbot"
        description={`Tem certeza que deseja excluir o chatbot "${deleteTarget?.name}"? Esta ação removerá o rascunho e todo o histórico de versões.`}
        confirmLabel="Sim, Excluir"
        isDestructive
        isLoading={isDeleting}
      />

      {/* Modal: Version History & Rollback */}
      {historyTarget && (
        <VersionHistoryModal
          isOpen={!!historyTarget}
          onClose={() => setHistoryTarget(null)}
          chatbotId={historyTarget.id}
          currentPublishedVersionId={historyTarget.current_published_version_id}
          onRollbackComplete={() => {
            fetchChatbots();
          }}
        />
      )}
    </div>
  );
}
