import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Play, KeyRound, Globe, Hand } from "lucide-react";
import { StartNodeData } from "../../types";

export const StartNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as StartNodeData;

  const triggerIcons = {
    new_conversation: <Play className="h-3.5 w-3.5 text-emerald-400" />,
    keyword: <KeyRound className="h-3.5 w-3.5 text-emerald-400" />,
    webhook: <Globe className="h-3.5 w-3.5 text-emerald-400" />,
    manual: <Hand className="h-3.5 w-3.5 text-emerald-400" />,
  };

  const triggerLabels = {
    new_conversation: "Nova conversa",
    keyword: "Palavra-chave",
    webhook: "Webhook",
    manual: "Manual",
  };

  const triggerType = nodeData.triggerType || "keyword";

  return (
    <div
      className={`min-w-[240px] max-w-[280px] rounded-xl border bg-[#11131a] p-3 shadow-lg transition-all duration-150 ${
        selected ? "border-emerald-500 ring-2 ring-emerald-500/20" : "border-emerald-500/30 hover:border-emerald-500/50"
      }`}
    >
      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2.5">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/15">
            {triggerIcons[triggerType]}
          </div>
          <span className="text-xs font-semibold text-emerald-400 tracking-wide uppercase">
            {nodeData.label || "Início"}
          </span>
        </div>
        <span className="rounded bg-emerald-500/10 px-1.5 py-0.5 text-[10px] font-medium text-emerald-400">
          {triggerLabels[triggerType]}
        </span>
      </div>

      <div className="space-y-1 text-xs text-slate-300">
        {triggerType === "keyword" && nodeData.keywords && nodeData.keywords.length > 0 ? (
          <div className="flex flex-wrap gap-1">
            {nodeData.keywords.map((kw, i) => (
              <span
                key={i}
                className="rounded bg-white/5 border border-border/80 px-1.5 py-0.5 text-[11px] text-slate-300 font-mono"
              >
                {kw}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-[11px] text-muted-foreground">
            {nodeData.description || "Gatilho de entrada do fluxo"}
          </p>
        )}
      </div>

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-emerald-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />
    </div>
  );
});

StartNode.displayName = "StartNode";
