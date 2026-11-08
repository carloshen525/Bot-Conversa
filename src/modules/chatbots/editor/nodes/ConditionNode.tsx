import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { GitBranch } from "lucide-react";
import { ConditionNodeData } from "../../types";

export const ConditionNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as ConditionNodeData;
  const branches = nodeData.branches || [];

  const operatorLabels: Record<string, string> = {
    message_contains: "contém",
    message_equals: "é igual a",
    message_starts_with: "inicia com",
    message_ends_with: "termina com",
    variable_equals: "variável =",
    tag_exists: "tem tag",
    tag_not_exists: "não tem tag",
  };

  return (
    <div
      className={`min-w-[280px] max-w-[320px] rounded-xl border bg-[#11131a] p-3 shadow-lg transition-all duration-150 ${
        selected ? "border-pink-500 ring-2 ring-pink-500/20" : "border-pink-500/30 hover:border-pink-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-pink-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />

      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-pink-500/15">
            <GitBranch className="h-3.5 w-3.5 text-pink-400" />
          </div>
          <span className="text-xs font-semibold text-pink-400 tracking-wide uppercase">
            {nodeData.label || "Condição"}
          </span>
        </div>
        <span className="rounded bg-pink-500/10 px-1.5 py-0.5 text-[10px] font-medium text-pink-300">
          {branches.length} ramificações
        </span>
      </div>

      {/* List of independent branch outputs */}
      <div className="space-y-2">
        {branches.map((branch) => (
          <div
            key={branch.id}
            className="relative flex items-center justify-between rounded-lg bg-[#0c0d12] border border-border/60 p-2 pr-6"
          >
            <div className="text-[11px] truncate pr-2">
              <span className="font-medium text-foreground block truncate">{branch.label}</span>
              <span className="text-muted-foreground text-[10px] font-mono">
                {operatorLabels[branch.operator] || branch.operator} &quot;{branch.value}&quot;
              </span>
            </div>

            {/* Dedicated Source Handle for each condition branch! */}
            <Handle
              type="source"
              id={branch.id}
              position={Position.Right}
              className="!h-2.5 !w-2.5 !bg-pink-500 !border-2 !border-[#11131a] !-right-1.5 hover:!scale-150 transition-transform"
            />
          </div>
        ))}

        {/* Fallback Else output handle */}
        <div className="relative flex items-center justify-between rounded-lg bg-[#0c0d12]/60 border border-dashed border-border/40 p-2 pr-6">
          <div className="text-[11px] text-muted-foreground">
            <span className="italic">Senão (padrão)</span>
          </div>
          <Handle
            type="source"
            id="default"
            position={Position.Right}
            className="!h-2.5 !w-2.5 !bg-slate-400 !border-2 !border-[#11131a] !-right-1.5 hover:!scale-150 transition-transform"
          />
        </div>
      </div>
    </div>
  );
});

ConditionNode.displayName = "ConditionNode";
