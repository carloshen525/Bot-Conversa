import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Database, Binary } from "lucide-react";
import { VariableNodeData } from "../../types";

export const VariableNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as VariableNodeData;

  const sourceLabels = {
    custom: "Valor estático",
    last_message: "Última mensagem recebida",
    contact_name: "Nome do contato",
    contact_phone: "Telefone do contato",
  };

  const sourceType = nodeData.sourceType || "custom";

  return (
    <div
      className={`min-w-[240px] max-w-[280px] rounded-xl border bg-[#11131a] p-3 shadow-lg transition-all duration-150 ${
        selected ? "border-cyan-500 ring-2 ring-cyan-500/20" : "border-cyan-500/30 hover:border-cyan-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-cyan-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />

      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/15">
            <Binary className="h-3.5 w-3.5 text-cyan-400" />
          </div>
          <span className="text-xs font-semibold text-cyan-400 tracking-wide uppercase">
            {nodeData.label || "Variável"}
          </span>
        </div>
        <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-medium text-cyan-300">
          Set
        </span>
      </div>

      <div className="space-y-1 rounded-md bg-[#0c0d12] border border-border/50 p-2 text-xs">
        <div className="flex items-center gap-1 font-mono text-[11px] text-cyan-300">
          <Database className="h-3 w-3 shrink-0" />
          <span className="truncate">{nodeData.variableKey || "chave_variavel"}</span>
        </div>
        <div className="text-[10px] text-muted-foreground truncate">
          {sourceType === "custom"
            ? `Valor: "${nodeData.variableValue || ""}"`
            : sourceLabels[sourceType]}
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-cyan-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />
    </div>
  );
});

VariableNode.displayName = "VariableNode";
