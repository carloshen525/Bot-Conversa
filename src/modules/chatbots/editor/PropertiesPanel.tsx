import React from "react";
import { FlowNode } from "../types";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { X, Plus, Trash2, Variable } from "lucide-react";
import { NODE_CONFIG } from "@/modules/shared/constants";
import { generateId } from "@/modules/shared/utils";

interface PropertiesPanelProps {
  selectedNode: FlowNode | null;
  onUpdateNodeData: (nodeId: string, updatedData: any) => void;
  onClose: () => void;
}

export function PropertiesPanel({
  selectedNode,
  onUpdateNodeData,
  onClose,
}: PropertiesPanelProps) {
  if (!selectedNode) {
    return (
      <aside className="w-80 border-l border-border bg-[#0d0f15] p-6 flex flex-col items-center justify-center text-center h-full select-none text-muted-foreground">
        <p className="text-xs">Selecione um bloco no canvas para editar suas propriedades.</p>
      </aside>
    );
  }

  const data = selectedNode.data as any;
  const config = NODE_CONFIG[selectedNode.type as keyof typeof NODE_CONFIG];

  const update = (patch: Record<string, any>) => {
    onUpdateNodeData(selectedNode.id, { ...data, ...patch });
  };

  return (
    <aside className="w-80 border-l border-border bg-[#0d0f15] flex flex-col h-full overflow-hidden select-none">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/80 p-4">
        <div className="flex items-center gap-2">
          <div
            className="h-3 w-3 rounded-full"
            style={{ backgroundColor: config?.color || "#6366f1" }}
          />
          <div>
            <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">
              {config?.label || "Propriedades"}
            </h3>
            <p className="text-[10px] text-muted-foreground font-mono truncate max-w-[170px]">
              ID: {selectedNode.id}
            </p>
          </div>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg p-1 text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Body with node-specific form controls */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar text-xs">
        {/* Label (Common for all nodes) */}
        <Input
          label="Nome do Bloco"
          value={data.label || ""}
          onChange={(e) => update({ label: e.target.value })}
          placeholder="Ex: Mensagem de Boas-Vindas"
        />

        {/* 1. START NODE PROPERTIES */}
        {selectedNode.type === "startNode" && (
          <div className="space-y-4">
            <Select
              label="Tipo de Gatilho"
              value={data.triggerType || "keyword"}
              onChange={(e) => update({ triggerType: e.target.value })}
              options={[
                { value: "keyword", label: "Palavra-chave" },
                { value: "new_conversation", label: "Nova Conversa" },
                { value: "webhook", label: "Webhook Externo" },
                { value: "manual", label: "Disparo Manual" },
              ]}
            />

            {data.triggerType === "keyword" && (
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">
                  Palavras-chave (separadas por vírgula)
                </label>
                <Input
                  value={(data.keywords || []).join(", ")}
                  onChange={(e) =>
                    update({
                      keywords: e.target.value
                        .split(",")
                        .map((k) => k.trim())
                        .filter(Boolean),
                    })
                  }
                  placeholder="Ex: oi, ola, preco, menu"
                />
              </div>
            )}

            <Textarea
              label="Descrição do Gatilho"
              rows={2}
              value={data.description || ""}
              onChange={(e) => update({ description: e.target.value })}
              placeholder="Notas sobre este gatilho..."
            />
          </div>
        )}

        {/* 2. MESSAGE NODE PROPERTIES */}
        {selectedNode.type === "messageNode" && (
          <div className="space-y-4">
            <Select
              label="Tipo de Mídia / Formato"
              value={data.messageType || "text"}
              onChange={(e) => update({ messageType: e.target.value })}
              options={[
                { value: "text", label: "Texto" },
                { value: "image", label: "Imagem" },
                { value: "video", label: "Vídeo" },
                { value: "audio", label: "Áudio" },
                { value: "document", label: "Documento (PDF)" },
              ]}
            />

            {data.messageType !== "text" && (
              <Input
                label="URL da Mídia (HTTPS)"
                value={data.mediaUrl || ""}
                onChange={(e) => update({ mediaUrl: e.target.value })}
                placeholder="https://exemplo.com/arquivo.jpg"
              />
            )}

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="text-xs font-medium text-slate-300">
                  {data.messageType === "text" ? "Conteúdo da Mensagem" : "Legenda / Caption"}
                </label>
                <div className="flex items-center gap-1 text-[10px] text-indigo-400">
                  <Variable className="h-3 w-3" />
                  <span>Use &#123;&#123;nome&#125;&#125;</span>
                </div>
              </div>
              <Textarea
                rows={5}
                value={data.content || ""}
                onChange={(e) => update({ content: e.target.value })}
                placeholder="Digite a mensagem. Ex: Olá {{nome}}, tudo bem?"
              />
            </div>

            <Input
              label="Atraso de Digitação (segundos)"
              type="number"
              min="0"
              max="30"
              value={data.delaySeconds ?? 1}
              onChange={(e) => update({ delaySeconds: Number(e.target.value) })}
            />
          </div>
        )}

        {/* 3. WAIT NODE PROPERTIES */}
        {selectedNode.type === "waitNode" && (
          <div className="space-y-4">
            <Select
              label="Tipo de Espera"
              value={data.waitType || "user_reply"}
              onChange={(e) => update({ waitType: e.target.value })}
              options={[
                { value: "user_reply", label: "Esperar resposta do usuário" },
                { value: "minutes", label: "Esperar Minutos" },
                { value: "hours", label: "Esperar Horas" },
                { value: "days", label: "Esperar Dias" },
              ]}
            />

            {data.waitType !== "user_reply" && (
              <Input
                label={`Quantidade de ${data.waitType || "minutos"}`}
                type="number"
                min="1"
                value={data.duration || 1}
                onChange={(e) => update({ duration: Number(e.target.value) })}
              />
            )}
          </div>
        )}

        {/* 4. CONDITION NODE PROPERTIES */}
        {selectedNode.type === "conditionNode" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-xs font-medium text-slate-300">Galhos de Decisão</label>
              <Button
                variant="subtle"
                size="sm"
                className="h-7 text-[11px]"
                onClick={() => {
                  const branches = data.branches || [];
                  const newBranch = {
                    id: generateId("branch"),
                    label: `Opção ${branches.length + 1}`,
                    operator: "message_contains",
                    value: String(branches.length + 1),
                  };
                  update({ branches: [...branches, newBranch] });
                }}
              >
                <Plus className="h-3 w-3 mr-1" />
                Adicionar Saída
              </Button>
            </div>

            <div className="space-y-3">
              {(data.branches || []).map((branch: any, idx: number) => (
                <div
                  key={branch.id}
                  className="rounded-lg border border-border/80 bg-[#12141d] p-2.5 space-y-2 relative"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-semibold text-pink-400">
                      Saída {idx + 1}
                    </span>
                    <button
                      onClick={() => {
                        const updated = data.branches.filter((b: any) => b.id !== branch.id);
                        update({ branches: updated });
                      }}
                      className="text-muted-foreground hover:text-red-400"
                    >
                      <Trash2 className="h-3 w-3" />
                    </button>
                  </div>

                  <Input
                    label="Rótulo da Saída"
                    value={branch.label}
                    onChange={(e) => {
                      const updated = [...data.branches];
                      updated[idx].label = e.target.value;
                      update({ branches: updated });
                    }}
                  />

                  <Select
                    label="Regra"
                    value={branch.operator}
                    onChange={(e) => {
                      const updated = [...data.branches];
                      updated[idx].operator = e.target.value;
                      update({ branches: updated });
                    }}
                    options={[
                      { value: "message_contains", label: "Mensagem contém" },
                      { value: "message_equals", label: "Mensagem igual" },
                      { value: "message_starts_with", label: "Mensagem inicia com" },
                      { value: "message_ends_with", label: "Mensagem termina com" },
                      { value: "variable_equals", label: "Variável igual" },
                      { value: "tag_exists", label: "Tag existe" },
                      { value: "tag_not_exists", label: "Tag não existe" },
                    ]}
                  />

                  {branch.operator === "variable_equals" && (
                    <Input
                      label="Nome da Variável"
                      value={branch.variableKey || ""}
                      onChange={(e) => {
                        const updated = [...data.branches];
                        updated[idx].variableKey = e.target.value;
                        update({ branches: updated });
                      }}
                      placeholder="Ex: saldo"
                    />
                  )}

                  <Input
                    label="Valor a comparar"
                    value={branch.value}
                    onChange={(e) => {
                      const updated = [...data.branches];
                      updated[idx].value = e.target.value;
                      update({ branches: updated });
                    }}
                    placeholder="Ex: sim, 1, VIP"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 5. ADD / REMOVE TAG PROPERTIES */}
        {(selectedNode.type === "addTagNode" || selectedNode.type === "removeTagNode") && (
          <div className="space-y-4">
            <Input
              label="Nome da Tag"
              value={data.tagName || ""}
              onChange={(e) => update({ tagName: e.target.value })}
              placeholder="Ex: Cliente VIP, Lead Quente, Fechou Pedido"
            />
          </div>
        )}

        {/* 6. VARIABLE NODE PROPERTIES */}
        {selectedNode.type === "variableNode" && (
          <div className="space-y-4">
            <Input
              label="Chave da Variável"
              value={data.variableKey || ""}
              onChange={(e) => update({ variableKey: e.target.value })}
              placeholder="Ex: saldo, interesse, email"
            />

            <Select
              label="Origem do Valor"
              value={data.sourceType || "custom"}
              onChange={(e) => update({ sourceType: e.target.value })}
              options={[
                { value: "custom", label: "Valor Estático / Personalizado" },
                { value: "last_message", label: "Última mensagem enviada pelo usuário" },
                { value: "contact_name", label: "Nome do Contato" },
                { value: "contact_phone", label: "Telefone do Contato" },
              ]}
            />

            {data.sourceType === "custom" && (
              <Input
                label="Valor da Variável"
                value={data.variableValue || ""}
                onChange={(e) => update({ variableValue: e.target.value })}
                placeholder="Ex: Confirmado, 100, Ativo"
              />
            )}
          </div>
        )}

        {/* 7. WEBHOOK NODE PROPERTIES */}
        {selectedNode.type === "webhookNode" && (
          <div className="space-y-4">
            <Select
              label="Método HTTP"
              value={data.method || "GET"}
              onChange={(e) => update({ method: e.target.value })}
              options={[
                { value: "GET", label: "GET" },
                { value: "POST", label: "POST" },
              ]}
            />

            <Input
              label="URL do Endpoint"
              value={data.url || ""}
              onChange={(e) => update({ url: e.target.value })}
              placeholder="https://api.seusistema.com/webhook"
            />

            {data.method === "POST" && (
              <Textarea
                label="Corpo da Requisição (JSON)"
                rows={4}
                value={data.body || ""}
                onChange={(e) => update({ body: e.target.value })}
                placeholder='{"nome": "{{nome}}", "telefone": "{{telefone}}"}'
              />
            )}

            <Input
              label="Salvar resposta na variável (opcional)"
              value={data.saveResponseVariable || ""}
              onChange={(e) => update({ saveResponseVariable: e.target.value })}
              placeholder="Ex: resposta_api"
            />
          </div>
        )}

        {/* 8. END NODE PROPERTIES */}
        {selectedNode.type === "endNode" && (
          <div className="space-y-4">
            <Input
              label="Motivo do Encerramento"
              value={data.reason || ""}
              onChange={(e) => update({ reason: e.target.value })}
              placeholder="Ex: Atendimento concluído com sucesso"
            />
          </div>
        )}
      </div>
    </aside>
  );
}
