import React from "react";
import {
  Play,
  MessageSquare,
  Clock,
  GitBranch,
  Tag,
  MinusCircle,
  Binary,
  Globe,
  Square,
  Sparkles,
} from "lucide-react";
import { NODE_TYPES } from "@/modules/shared/constants";

interface NodeItem {
  type: string;
  label: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  borderHover: string;
}

const BLOCKS: NodeItem[] = [
  {
    type: NODE_TYPES.START,
    label: "Início",
    description: "Palavra-chave, webhook ou novo contato",
    icon: <Play className="h-4 w-4 text-emerald-400" />,
    color: "bg-emerald-500/10 text-emerald-400",
    borderHover: "hover:border-emerald-500/50",
  },
  {
    type: NODE_TYPES.MESSAGE,
    label: "Mensagem",
    description: "Texto, imagem, vídeo, áudio ou documento",
    icon: <MessageSquare className="h-4 w-4 text-indigo-400" />,
    color: "bg-indigo-500/10 text-indigo-400",
    borderHover: "hover:border-indigo-500/50",
  },
  {
    type: NODE_TYPES.WAIT,
    label: "Espera",
    description: "Aguardar resposta ou intervalo de tempo",
    icon: <Clock className="h-4 w-4 text-amber-400" />,
    color: "bg-amber-500/10 text-amber-400",
    borderHover: "hover:border-amber-500/50",
  },
  {
    type: NODE_TYPES.CONDITION,
    label: "Condição",
    description: "Ramificações por mensagem, tag ou variável",
    icon: <GitBranch className="h-4 w-4 text-pink-400" />,
    color: "bg-pink-500/10 text-pink-400",
    borderHover: "hover:border-pink-500/50",
  },
  {
    type: NODE_TYPES.ADD_TAG,
    label: "Adicionar Tag",
    description: "Etiquetar o contato no fluxo",
    icon: <Tag className="h-4 w-4 text-purple-400" />,
    color: "bg-purple-500/10 text-purple-400",
    borderHover: "hover:border-purple-500/50",
  },
  {
    type: NODE_TYPES.REMOVE_TAG,
    label: "Remover Tag",
    description: "Remover etiqueta do contato",
    icon: <MinusCircle className="h-4 w-4 text-rose-400" />,
    color: "bg-rose-500/10 text-rose-400",
    borderHover: "hover:border-rose-500/50",
  },
  {
    type: NODE_TYPES.VARIABLE,
    label: "Variável",
    description: "Salvar ou manipular variáveis do contato",
    icon: <Binary className="h-4 w-4 text-cyan-400" />,
    color: "bg-cyan-500/10 text-cyan-400",
    borderHover: "hover:border-cyan-500/50",
  },
  {
    type: NODE_TYPES.WEBHOOK,
    label: "Webhook",
    description: "Chamar API externa via GET ou POST",
    icon: <Globe className="h-4 w-4 text-teal-400" />,
    color: "bg-teal-500/10 text-teal-400",
    borderHover: "hover:border-teal-500/50",
  },
  {
    type: NODE_TYPES.END,
    label: "Fim",
    description: "Finalizar a execução da conversa",
    icon: <Square className="h-4 w-4 text-slate-400 fill-slate-400" />,
    color: "bg-slate-500/10 text-slate-400",
    borderHover: "hover:border-slate-500/50",
  },
];

interface NodeSidebarProps {
  onAddNode?: (type: string) => void;
}

export function NodeSidebar({ onAddNode }: NodeSidebarProps) {
  const onDragStart = (event: React.DragEvent, nodeType: string) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-64 border-r border-border bg-[#0d0f15] p-4 flex flex-col h-full overflow-hidden select-none">
      <div className="flex items-center justify-between pb-3 border-b border-border/70 mb-3">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-indigo-400" />
          <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Blocos
          </h2>
        </div>
        <span className="text-[10px] text-muted-foreground/80">Arraste para a tela</span>
      </div>

      <div className="flex-1 overflow-y-auto space-y-2 pr-1 custom-scrollbar">
        {BLOCKS.map((block) => (
          <div
            key={block.type}
            draggable
            onDragStart={(e) => onDragStart(e, block.type)}
            onClick={() => onAddNode?.(block.type)}
            className={`group flex items-start gap-3 rounded-lg border border-border/70 bg-[#12141c] p-2.5 cursor-grab active:cursor-grabbing hover:bg-[#181b26] transition-all duration-150 ${block.borderHover}`}
          >
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-md ${block.color} transition-transform group-hover:scale-105`}
            >
              {block.icon}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="text-xs font-medium text-foreground group-hover:text-white">
                {block.label}
              </h3>
              <p className="text-[10px] text-muted-foreground truncate leading-tight mt-0.5">
                {block.description}
              </p>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-auto pt-3 border-t border-border/50 text-[10px] text-muted-foreground/60 text-center">
        Dica: Clique ou arraste para adicionar
      </div>
    </aside>
  );
}
