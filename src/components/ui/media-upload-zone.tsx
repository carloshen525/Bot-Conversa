"use client";

import React, { useState, useRef } from "react";
import {
  Upload,
  Image as ImageIcon,
  Film,
  Mic,
  FileText,
  X,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Play,
  Volume2,
} from "lucide-react";
import { Button } from "./button";
import { Input } from "./input";
import { useToast } from "./toast";

interface MediaUploadZoneProps {
  mediaType: "image" | "video" | "audio" | "document";
  mediaUrl?: string;
  fileName?: string;
  fileSize?: number;
  mimeType?: string;
  onChange: (data: {
    mediaUrl: string;
    fileName?: string;
    fileSize?: number;
    mimeType?: string;
  }) => void;
  onClear: () => void;
}

export function MediaUploadZone({
  mediaType,
  mediaUrl,
  fileName,
  fileSize,
  mimeType,
  onChange,
  onClear,
}: MediaUploadZoneProps) {
  const { error, success } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [customUrl, setCustomUrl] = useState(mediaUrl || "");

  const acceptConfig = {
    image: {
      accept: ".jpg,.jpeg,.png,.webp,.gif",
      label: "Foto ou Imagem (JPG, PNG, WEBP)",
      icon: ImageIcon,
      hint: "Arraste sua imagem ou clique para selecionar",
    },
    video: {
      accept: ".mp4,.mov,.avi,.webm",
      label: "Vídeo (MP4, MOV, WEBM)",
      icon: Film,
      hint: "Arraste seu vídeo MP4 ou clique para selecionar",
    },
    audio: {
      accept: ".ogg,.mp3,.wav,.m4a,.aac,.opus",
      label: "Áudio ou Mensagem de Voz (.OGG, .MP3)",
      icon: Mic,
      hint: "Arraste o arquivo de áudio ou clique para selecionar",
    },
    document: {
      accept: ".pdf,.doc,.docx,.xls,.xlsx,.zip,.txt",
      label: "Documento (PDF, DOCX, ZIP)",
      icon: FileText,
      hint: "Arraste o documento ou clique para selecionar",
    },
  }[mediaType];

  const CurrentIcon = acceptConfig.icon;

  const handleUploadFile = async (file: File) => {
    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (!res.ok || !json.success) {
        throw new Error(json.error || "Falha no envio do arquivo.");
      }

      onChange({
        mediaUrl: json.url,
        fileName: json.fileName,
        fileSize: json.fileSize,
        mimeType: json.mimeType,
      });

      success("Arquivo Carregado!", `${file.name} adicionado ao bloco.`);
    } catch (err: any) {
      error("Erro no Upload", err.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
    // reset input
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUploadFile(file);
    }
  };

  const formatBytes = (bytes?: number) => {
    if (!bytes) return "";
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2 select-none">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileSelect}
        accept={acceptConfig.accept}
        className="hidden"
      />

      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-slate-300 flex items-center gap-1.5">
          <CurrentIcon className="h-3.5 w-3.5 text-indigo-400" />
          <span>{acceptConfig.label}</span>
        </label>
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-[10px] text-indigo-400 hover:text-indigo-300 underline"
        >
          {showUrlInput ? "Fazer upload de arquivo" : "Ou colar URL externa"}
        </button>
      </div>

      {showUrlInput ? (
        <div className="space-y-1.5">
          <Input
            value={customUrl}
            onChange={(e) => {
              setCustomUrl(e.target.value);
              onChange({ mediaUrl: e.target.value, fileName: e.target.value.split("/").pop() });
            }}
            placeholder="https://exemplo.com/arquivo.jpg"
            className="text-xs"
          />
          <p className="text-[10px] text-muted-foreground">
            Insira o link HTTPS direto para o arquivo de mídia.
          </p>
        </div>
      ) : mediaUrl ? (
        /* Preview Card when file is uploaded or selected */
        <div className="rounded-xl border border-border/80 bg-[#12141c] p-3 space-y-2.5">
          <div className="flex items-center justify-between gap-2 border-b border-border/60 pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600/20 text-indigo-400 border border-indigo-500/30 shrink-0">
                <CurrentIcon className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground truncate">
                  {fileName || mediaUrl.split("/").pop() || "Arquivo Selecionado"}
                </p>
                {fileSize && (
                  <p className="text-[10px] text-muted-foreground font-mono">
                    {formatBytes(fileSize)}
                  </p>
                )}
              </div>
            </div>
            <button
              type="button"
              onClick={onClear}
              className="rounded-md p-1 text-muted-foreground hover:bg-rose-500/10 hover:text-rose-400 transition-colors"
              title="Remover arquivo"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Media Interactive Previews */}
          {mediaType === "image" && (
            <div className="relative rounded-lg overflow-hidden bg-black/40 border border-border/50 max-h-48 flex items-center justify-center">
              <img
                src={mediaUrl}
                alt="Preview"
                className="max-h-48 w-full object-contain rounded-lg"
              />
            </div>
          )}

          {mediaType === "audio" && (
            <div className="rounded-lg bg-[#0c0d12] p-2 border border-border/60 space-y-1">
              <audio controls src={mediaUrl} className="w-full h-8" />
              <div className="flex items-center gap-1.5 text-[10px] text-emerald-400 pt-0.5">
                <Volume2 className="h-3 w-3" />
                <span>Áudio pronto para disparo WhatsApp (.ogg / .mp3)</span>
              </div>
            </div>
          )}

          {mediaType === "video" && (
            <div className="rounded-lg overflow-hidden bg-black/50 border border-border/60">
              <video controls src={mediaUrl} className="w-full max-h-48 rounded-lg" />
            </div>
          )}

          {mediaType === "document" && (
            <div className="flex items-center gap-2 text-xs text-slate-300 bg-[#0c0d12] p-2 rounded-lg border border-border/60">
              <FileText className="h-4 w-4 text-cyan-400 shrink-0" />
              <span className="truncate">{fileName || "Documento anexado"}</span>
            </div>
          )}

          {/* Replace Button */}
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => fileInputRef.current?.click()}
            isLoading={isUploading}
            className="w-full text-xs h-7 border-border/70 hover:bg-white/5"
          >
            Substituir Arquivo
          </Button>
        </div>
      ) : (
        /* Dropzone / Upload Trigger Button */
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`cursor-pointer rounded-xl border-2 border-dashed p-5 text-center transition-all duration-150 flex flex-col items-center justify-center gap-2 ${
            isDragging
              ? "border-indigo-500 bg-indigo-500/10"
              : "border-border/70 bg-[#12141c]/60 hover:border-indigo-500/50 hover:bg-[#141722]"
          }`}
        >
          {isUploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
              <p className="text-xs text-indigo-300 font-medium">Enviando arquivo...</p>
            </div>
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-semibold text-foreground">
                  Escolher arquivo do computador
                </p>
                <p className="text-[10px] text-muted-foreground mt-0.5">
                  {acceptConfig.hint}
                </p>
              </div>
              <span className="rounded bg-white/5 px-2 py-0.5 text-[9px] font-mono text-muted-foreground border border-border/50">
                {acceptConfig.accept.replace(/,/g, " ")}
              </span>
            </>
          )}
        </div>
      )}
    </div>
  );
}
