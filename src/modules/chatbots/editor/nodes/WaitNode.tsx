import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Clock, MessageCircle } from "lucide-react";
import { WaitNodeData } from "../../types";

export const WaitNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WaitNodeData;
  const isReply = nodeData.waitType === "user_reply";

  return (
    <div
      className={`min-w-[240px] max-w-[280px] rounded-xl border bg-[#11131a] p-3 shadow-lg transition-all duration-150 ${
        selected ? "border-amber-500 ring-2 ring-amber-500/20" : "border-amber-500/30 hover:border-amber-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-amber-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />

      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/15">
            {isReply ? (
              <MessageCircle className="h-3.5 w-3.5 text-amber-400" />
            ) : (
              <Clock className="h-3.5 w-3.5 text-amber-400" />
            )}
          </div>
          <span className="text-xs font-semibold text-amber-400 tracking-wide uppercase">
            {nodeData.label || "Espera"}
          </span>
        </div>
        <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium text-amber-300">
          {isReply ? "Resposta" : "Tempo"}
        </span>
      </div>

      <div className="text-xs text-slate-300">
        {isReply ? (
          <p className="text-[11px] text-muted-foreground">
            Aguardando resposta do contato para continuar.
          </p>
        ) : (
          <p className="text-[11px] text-slate-300 font-medium">
            Pausar por:{" "}
            <span className="text-amber-400 font-bold">
              {nodeData.duration || 1} {nodeData.waitType}
            </span>
          </p>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-amber-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />
    </div>
  );
});

WaitNode.displayName = "WaitNode";
