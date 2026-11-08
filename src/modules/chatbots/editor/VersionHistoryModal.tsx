import React, { useState, useEffect } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { ChatbotVersion } from "../types";
import { History, RotateCcw, CheckCircle2, Clock, GitCommit } from "lucide-react";
import { formatRelativeTime, formatDate } from "@/modules/shared/utils";
import { useToast } from "@/components/ui/toast";

interface VersionHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  chatbotId: string;
  currentPublishedVersionId?: string | null;
  onRollbackComplete?: () => void;
}

export function VersionHistoryModal({
  isOpen,
  onClose,
  chatbotId,
  currentPublishedVersionId,
  onRollbackComplete,
}: VersionHistoryModalProps) {
  const { success, error } = useToast();
  const [versions, setVersions] = useState<ChatbotVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rollbackTarget, setRollbackTarget] = useState<ChatbotVersion | null>(null);
  const [isRollingBack, setIsRollingBack] = useState(false);

  const fetchVersions = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbotId}/versions`);
      const json = await res.json();
      if (json.success) {
        setVersions(json.data || []);
      }
    } catch (err: any) {
      error("Erro", "Não foi possível carregar as versões.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchVersions();
    }
  }, [isOpen, chatbotId]);

  const handleConfirmRollback = async () => {
    if (!rollbackTarget) return;
    setIsRollingBack(true);
    try {
      const res = await fetch(`/api/chatbots/${chatbotId}/rollback`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ versionId: rollbackTarget.id }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Falha ao realizar rollback");

      success(
        "Rollback Concluído!",
        `O chatbot foi restaurado para a versão v${rollbackTarget.version_number}.`
      );
      setRollbackTarget(null);
      onRollbackComplete?.();
      onClose();
    } catch (err: any) {
      error("Erro no Rollback", err.message);
    } finally {
      setIsRollingBack(false);
    }
  };

  return (
    <>
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title="Histórico de Versões Publicadas (Snapshots)"
        description="Cada publicação gera um snapshot imutável. Você pode restaurar qualquer versão anterior."
        maxWidth="xl"
      >
        <div className="space-y-3 max-h-[420px] overflow-y-auto custom-scrollbar pr-1">
          {isLoading ? (
            <p className="text-xs text-muted-foreground text-center py-8">Carregando versões...</p>
          ) : versions.length === 0 ? (
            <div className="rounded-lg border border-dashed border-border/80 p-8 text-center text-xs text-muted-foreground">
              Nenhuma versão publicada ainda. Clique em &quot;Publicar&quot; no topo da tela para gerar sua primeira versão estável.
            </div>
          ) : (
            versions.map((ver) => {
              const isActive = ver.id === currentPublishedVersionId;
              const nodeCount = ver.flow_data?.nodes?.length || 0;
              const edgeCount = ver.flow_data?.edges?.length || 0;

              return (
                <div
                  key={ver.id}
                  className={`flex items-start justify-between rounded-xl border p-3.5 transition-colors ${
                    isActive
                      ? "border-emerald-500/40 bg-emerald-950/10"
                      : "border-border/70 bg-[#12141c] hover:border-border"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="rounded bg-indigo-500/20 text-indigo-300 font-mono text-xs font-bold px-2 py-0.5">
                        v{ver.version_number}
                      </span>
                      {isActive && (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-semibold px-2 py-0.5">
                          <CheckCircle2 className="h-3 w-3" />
                          Versão Ativa
                        </span>
                      )}
                      <span className="text-[11px] text-muted-foreground">
                        {formatRelativeTime(ver.published_at)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-300 font-medium pt-0.5">
                      {ver.changelog || "Publicação do fluxo"}
                    </p>

                    <p className="text-[10px] text-muted-foreground font-mono">
                      Snapshot: {nodeCount} blocos, {edgeCount} conexões • Publicado em {formatDate(ver.published_at)}
                    </p>
                  </div>

                  {!isActive && (
                    <Button
                      size="sm"
                      variant="secondary"
                      className="h-8 text-xs gap-1.5"
                      onClick={() => setRollbackTarget(ver)}
                    >
                      <RotateCcw className="h-3.5 w-3.5" />
                      <span>Restaurar</span>
                    </Button>
                  )}
                </div>
              );
            })
          )}
        </div>
      </Modal>

      {/* Confirmation Dialog */}
      <Dialog
        isOpen={!!rollbackTarget}
        onClose={() => setRollbackTarget(null)}
        onConfirm={handleConfirmRollback}
        title={`Restaurar versão v${rollbackTarget?.version_number}?`}
        description={`O rascunho atual e a versão publicada ativa serão substituídos pelo snapshot v${rollbackTarget?.version_number}.`}
        confirmLabel="Sim, Restaurar Versão"
        isLoading={isRollingBack}
      />
    </>
  );
}
