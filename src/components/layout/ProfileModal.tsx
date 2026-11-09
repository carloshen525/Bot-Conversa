"use client";

import React, { useState } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/modules/auth/AuthContext";
import { useToast } from "@/components/ui/toast";
import { User, Shield, Mail, Calendar, Key, CheckCircle2 } from "lucide-react";
import { formatDate } from "@/modules/shared/utils";

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProfileModal({ isOpen, onClose }: ProfileModalProps) {
  const { profile, updateProfile, role, isAdmin } = useAuth();
  const { success } = useToast();

  const [nome, setNome] = useState(profile?.nome || "Carlos Henrique");
  const [avatar, setAvatar] = useState(profile?.avatar || "");
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({ nome, avatar });
      success("Perfil Atualizado", "As informações do seu perfil foram salvas.");
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  const roleLabels: Record<string, string> = {
    admin: "Administrador Geral (Total)",
    gestor: "Gestor de Equipe",
    operador: "Operador de Fluxos",
    atendimento: "Atendente WhatsApp",
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Meu Perfil"
      description="Gerencie suas informações de conta e credenciais do Supabase Auth."
      maxWidth="md"
    >
      <form onSubmit={handleSave} className="space-y-4">
        {/* Profile Card Header */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-[#141722] border border-border/70">
          <div className="relative">
            {avatar ? (
              <img
                src={avatar}
                alt={nome}
                className="h-14 w-14 rounded-full object-cover border-2 border-indigo-500/40"
              />
            ) : (
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-300 font-bold text-lg border border-indigo-500/30">
                {nome.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-3.5 w-3.5 rounded-full bg-emerald-500 border-2 border-[#141722]" />
          </div>

          <div className="space-y-0.5">
            <h4 className="font-semibold text-sm text-foreground">{nome}</h4>
            <p className="text-xs text-muted-foreground">{profile?.email}</p>
            <span className="inline-flex items-center gap-1 mt-1 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider">
              <Shield className="h-2.5 w-2.5" />
              {roleLabels[role] || "Administrador"}
            </span>
          </div>
        </div>

        {/* Inputs */}
        <div className="space-y-3">
          <Input
            label="Nome Completo"
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            required
          />

          <Input
            label="E-mail (Supabase Auth)"
            value={profile?.email || ""}
            disabled
            helperText="O e-mail é gerenciado exclusivamente via Supabase Auth."
          />

          <Input
            label="URL da Imagem de Avatar (Opcional)"
            value={avatar}
            onChange={(e) => setAvatar(e.target.value)}
            placeholder="https://exemplo.com/foto.jpg"
          />
        </div>

        {/* Role & Permissions Info */}
        <div className="rounded-lg bg-[#0c0d12] border border-border/60 p-3 space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Key className="h-3 w-3 text-indigo-400" />
              Nível de Permissão:
            </span>
            <span className="font-semibold text-emerald-400">
              {isAdmin ? "Acesso Total (Admin)" : role}
            </span>
          </div>
          <div className="flex items-center justify-between text-slate-300">
            <span className="flex items-center gap-1.5 text-[11px]">
              <Calendar className="h-3 w-3 text-indigo-400" />
              Cadastrado em:
            </span>
            <span className="text-[11px]">
              {profile?.created_at ? formatDate(profile.created_at) : "Novembro 2026"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 pt-3 border-t border-border/70">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSaving}>
            Cancelar
          </Button>
          <Button type="submit" size="sm" isLoading={isSaving}>
            Salvar Alterações
          </Button>
        </div>
      </form>
    </Modal>
  );
}
