import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Square } from "lucide-react";
import { EndNodeData } from "../../types";

export const EndNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as EndNodeData;

  return (
    <div
      className={`min-w-[200px] max-w-[240px] rounded-xl border bg-[#11131a] p-3 shadow-lg transition-all duration-150 ${
        selected ? "border-slate-400 ring-2 ring-slate-400/20" : "border-slate-600/30 hover:border-slate-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-slate-400 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />

      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-slate-500/15">
            <Square className="h-3 w-3 text-slate-400 fill-slate-400" />
          </div>
          <span className="text-xs font-semibold text-slate-400 tracking-wide uppercase">
            {nodeData.label || "Fim"}
          </span>
        </div>
      </div>

      <p className="text-[11px] text-muted-foreground truncate">
        {nodeData.reason || "Encerra a execução do fluxo"}
      </p>

      {/* No output handle: EndNode terminates the execution path */}
    </div>
  );
});

EndNode.displayName = "EndNode";
