import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { Tag, Plus } from "lucide-react";
import { TagNodeData } from "../../types";

export const AddTagNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as TagNodeData;

  return (
    <div
      className={`min-w-[220px] max-w-[260px] rounded-xl border bg-[#11131a] p-3 shadow-lg transition-all duration-150 ${
        selected ? "border-purple-500 ring-2 ring-purple-500/20" : "border-purple-500/30 hover:border-purple-500/50"
      }`}
    >
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-purple-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />

      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-purple-500/15">
            <Plus className="h-3.5 w-3.5 text-purple-400" />
          </div>
          <span className="text-xs font-semibold text-purple-400 tracking-wide uppercase">
            {nodeData.label || "Adicionar Tag"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-1.5 rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-1 text-xs text-purple-300">
        <Tag className="h-3 w-3 shrink-0" />
        <span className="font-medium truncate">{nodeData.tagName || "Selecione uma tag"}</span>
      </div>

      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-purple-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />
    </div>
  );
});

AddTagNode.displayName = "AddTagNode";
