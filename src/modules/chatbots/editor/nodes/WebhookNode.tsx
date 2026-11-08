import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Globe, ArrowRight } from "lucide-react";
import { WebhookNodeData } from "../../types";

export const WebhookNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as WebhookNodeData;
  const method = nodeData.method || "GET";

  return (
    <div
      className={`min-w-[250px] max-w-[290px] rounded-xl border bg-[#11131a] p-3 shadow-lg transition-all duration-150 ${
        selected ? "border-teal-500 ring-2 ring-teal-500/20" : "border-teal-500/30 hover:border-teal-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-teal-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />

      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-teal-500/15">
            <Globe className="h-3.5 w-3.5 text-teal-400" />
          </div>
          <span className="text-xs font-semibold text-teal-400 tracking-wide uppercase">
            {nodeData.label || "Webhook"}
          </span>
        </div>
        <span
          className={`rounded px-1.5 py-0.5 text-[10px] font-bold ${
            method === "POST" ? "bg-amber-500/20 text-amber-300" : "bg-sky-500/20 text-sky-300"
          }`}
        >
          {method}
        </span>
      </div>

      <div className="rounded-md bg-[#0c0d12] border border-border/50 p-2 text-xs">
        <p className="font-mono text-[10px] text-slate-300 truncate">
          {nodeData.url || "https://api.exemplo.com/endpoint"}
        </p>
        {nodeData.saveResponseVariable && (
          <div className="mt-1 flex items-center gap-1 text-[10px] text-teal-400">
            <ArrowRight className="h-2.5 w-2.5" />
            <span>Salva em: {nodeData.saveResponseVariable}</span>
          </div>
        )}
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-teal-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />
    </div>
  );
});

WebhookNode.displayName = "WebhookNode";
