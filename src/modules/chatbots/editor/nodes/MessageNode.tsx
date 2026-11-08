import React, { memo } from "react";
import { Handle, Position, NodeProps } from "@xyflow/react";
import { MessageSquare, Image, Film, Mic, FileText, Clock } from "lucide-react";
import { MessageNodeData } from "../../types";

export const MessageNode = memo(({ data, selected }: NodeProps) => {
  const nodeData = data as unknown as MessageNodeData;

  const typeIcons = {
    text: <MessageSquare className="h-3.5 w-3.5 text-indigo-400" />,
    image: <Image className="h-3.5 w-3.5 text-indigo-400" />,
    video: <Film className="h-3.5 w-3.5 text-indigo-400" />,
    audio: <Mic className="h-3.5 w-3.5 text-indigo-400" />,
    document: <FileText className="h-3.5 w-3.5 text-indigo-400" />,
  };

  const messageType = nodeData.messageType || "text";

  // Highlight {{variables}} in text preview
  const renderPreview = (text: string) => {
    if (!text) return <span className="text-muted-foreground italic">Sem mensagem definida</span>;
    const parts = text.split(/(\{\{[^}]+\}\})/g);
    return parts.map((part, index) => {
      if (part.startsWith("{{") && part.endsWith("}}")) {
        return (
          <span
            key={index}
            className="rounded bg-indigo-500/20 text-indigo-300 px-1 py-0.2 font-mono text-[10px]"
          >
            {part}
          </span>
        );
      }
      return <span key={index}>{part}</span>;
    });
  };

  return (
    <div
      className={`min-w-[260px] max-w-[300px] rounded-xl border bg-[#11131a] p-3 shadow-lg transition-all duration-150 ${
        selected ? "border-indigo-500 ring-2 ring-indigo-500/20" : "border-indigo-500/30 hover:border-indigo-500/50"
      }`}
    >
      {/* Input Handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="!h-3 !w-3 !bg-indigo-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />

      <div className="flex items-center justify-between border-b border-border/60 pb-2 mb-2">
        <div className="flex items-center gap-2">
          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-indigo-500/15">
            {typeIcons[messageType]}
          </div>
          <span className="text-xs font-semibold text-indigo-400 tracking-wide uppercase">
            {nodeData.label || "Mensagem"}
          </span>
        </div>
        <div className="flex items-center gap-1.5">
          {nodeData.delaySeconds ? (
            <span className="flex items-center gap-0.5 text-[10px] text-muted-foreground bg-white/5 px-1.5 py-0.5 rounded">
              <Clock className="h-2.5 w-2.5" />
              {nodeData.delaySeconds}s
            </span>
          ) : null}
          <span className="rounded bg-indigo-500/10 px-1.5 py-0.5 text-[10px] font-medium text-indigo-300 uppercase">
            {messageType}
          </span>
        </div>
      </div>

      <div className="rounded-lg bg-[#0c0d12] border border-border/40 p-2 text-xs text-slate-300 line-clamp-3 leading-relaxed">
        {renderPreview(nodeData.content)}
      </div>

      {nodeData.mediaUrl && (
        <p className="mt-1.5 truncate text-[10px] text-muted-foreground font-mono">
          🔗 {nodeData.mediaUrl}
        </p>
      )}

      {/* Output Handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="!h-3 !w-3 !bg-indigo-500 !border-2 !border-[#11131a] hover:!scale-125 transition-transform"
      />
    </div>
  );
});

MessageNode.displayName = "MessageNode";
