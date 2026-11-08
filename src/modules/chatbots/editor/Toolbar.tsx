import React, { useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Save,
  Rocket,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Map as MapIcon,
  Undo2,
  Redo2,
  PlayCircle,
  ArrowLeft,
  History,
  Download,
  Upload,
} from "lucide-react";
import Link from "next/link";

interface ToolbarProps {
  chatbotName: string;
  chatbotStatus: string;
  isSaving: boolean;
  isPublishing: boolean;
  canUndo: boolean;
  canRedo: boolean;
  isMiniMapOpen: boolean;
  onSave: () => void;
  onPublish: () => void;
  onUndo: () => void;
  onRedo: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFitView: () => void;
  onToggleMiniMap: () => void;
  onOpenSimulator: () => void;
  onOpenHistory?: () => void;
  onExportJson?: () => void;
  onImportJson?: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

export function Toolbar({
  chatbotName,
  chatbotStatus,
  isSaving,
  isPublishing,
  canUndo,
  canRedo,
  isMiniMapOpen,
  onSave,
  onPublish,
  onUndo,
  onRedo,
  onZoomIn,
  onZoomOut,
  onFitView,
  onToggleMiniMap,
  onOpenSimulator,
  onOpenHistory,
  onExportJson,
  onImportJson,
}: ToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <header className="h-14 border-b border-border bg-[#0d0f15] px-4 flex items-center justify-between select-none z-10">
      {/* Hidden file input for importing JSON flow */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={onImportJson}
        accept=".json,application/json"
        className="hidden"
      />

      {/* Left side: Back button & Chatbot title */}
      <div className="flex items-center gap-3">
        <Link
          href="/chatbots"
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border/70 bg-[#12141c] text-muted-foreground hover:bg-white/5 hover:text-foreground transition-colors"
          title="Voltar para lista de chatbots"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>

        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-sm font-semibold text-foreground tracking-tight max-w-[200px] sm:max-w-xs truncate">
              {chatbotName}
            </h1>
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-medium border ${
                chatbotStatus === "published"
                  ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
                  : "bg-amber-500/10 text-amber-400 border-amber-500/30"
              }`}
            >
              {chatbotStatus === "published" ? "Publicado" : "Rascunho"}
            </span>
          </div>
        </div>
      </div>

      {/* Center: Canvas View Controls (Undo, Redo, Zoom, Fit, MiniMap) */}
      <div className="hidden md:flex items-center gap-1 rounded-lg border border-border/80 bg-[#12141c] p-1">
        <button
          onClick={onUndo}
          disabled={!canUndo}
          title="Desfazer (Ctrl+Z)"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={onRedo}
          disabled={!canRedo}
          title="Refazer (Ctrl+Y)"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground disabled:opacity-30 disabled:hover:bg-transparent"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-border mx-1" />

        <button
          onClick={onZoomIn}
          title="Aproximar (+)"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={onZoomOut}
          title="Afastar (-)"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={onFitView}
          title="Centralizar Fluxo"
          className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
        >
          <Maximize2 className="h-4 w-4" />
        </button>
        <button
          onClick={onToggleMiniMap}
          title="Alternar MiniMapa"
          className={`rounded-md p-1.5 transition-colors ${
            isMiniMapOpen
              ? "bg-indigo-500/20 text-indigo-400"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          }`}
        >
          <MapIcon className="h-4 w-4" />
        </button>

        <div className="h-4 w-[1px] bg-border mx-1" />

        {onExportJson && (
          <button
            onClick={onExportJson}
            title="Exportar Fluxo em JSON"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <Download className="h-4 w-4" />
          </button>
        )}
        {onImportJson && (
          <button
            onClick={() => fileInputRef.current?.click()}
            title="Importar Fluxo JSON"
            className="rounded-md p-1.5 text-muted-foreground hover:bg-white/5 hover:text-foreground"
          >
            <Upload className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Right side: Simulator, History, Save, Publish */}
      <div className="flex items-center gap-2">
        {onOpenHistory && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onOpenHistory}
            className="text-xs text-muted-foreground hover:text-foreground"
            title="Ver snapshots publicados e realizar rollback"
          >
            <History className="h-4 w-4" />
            <span className="hidden lg:inline">Versões</span>
          </Button>
        )}

        <Button
          variant="secondary"
          size="sm"
          onClick={onOpenSimulator}
          className="border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/10"
        >
          <PlayCircle className="h-4 w-4 text-indigo-400" />
          <span className="hidden sm:inline">Testar Fluxo</span>
        </Button>

        <Button
          variant="secondary"
          size="sm"
          onClick={onSave}
          isLoading={isSaving}
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">Salvar</span>
        </Button>

        <Button
          variant="primary"
          size="sm"
          onClick={onPublish}
          isLoading={isPublishing}
          className="bg-emerald-600 hover:bg-emerald-500 shadow-emerald-500/20"
        >
          <Rocket className="h-4 w-4" />
          <span>Publicar</span>
        </Button>
      </div>
    </header>
  );
}
