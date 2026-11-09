"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/modules/auth/AuthContext";
import { User, Settings, LogOut, ChevronDown, Shield, Sparkles } from "lucide-react";
import { ProfileModal } from "./ProfileModal";

export function HeaderUserMenu() {
  const { profile, signOut, role, isAdmin } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const displayName = profile?.nome || "Carlos Henrique";
  const displayEmail = profile?.email || "carloshenrq1245@gmail.com";
  const avatarUrl = profile?.avatar;

  return (
    <>
      <div className="relative" ref={menuRef}>
        {/* User Button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-full hover:bg-white/5 border border-border/60 transition-colors group select-none"
        >
          {/* Avatar */}
          <div className="relative">
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt={displayName}
                className="h-7 w-7 rounded-full object-cover border border-border"
              />
            ) : (
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-indigo-600/20 text-indigo-300 font-bold text-xs border border-indigo-500/30">
                {displayName.slice(0, 2).toUpperCase()}
              </div>
            )}
            <span className="absolute bottom-0 right-0 h-2 w-2 rounded-full bg-emerald-500 border border-[#0d0f15]" />
          </div>

          {/* Name & Role */}
          <div className="hidden sm:flex flex-col text-left">
            <span className="text-xs font-semibold text-foreground group-hover:text-indigo-300 transition-colors leading-tight">
              {displayName}
            </span>
            <span className="text-[10px] text-muted-foreground/80 leading-tight">
              {isAdmin ? "Admin" : role}
            </span>
          </div>

          <ChevronDown className="h-3.5 w-3.5 text-muted-foreground group-hover:text-foreground transition-transform duration-150" />
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute right-0 mt-2 w-56 rounded-xl border border-border/80 bg-[#11131a] p-1.5 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-100">
            {/* User Info Header */}
            <div className="px-3 py-2 border-b border-border/60 mb-1 space-y-0.5">
              <p className="text-xs font-bold text-foreground truncate">{displayName}</p>
              <p className="text-[11px] text-muted-foreground truncate">{displayEmail}</p>
              <div className="pt-1 flex items-center gap-1 text-[10px] text-indigo-400 font-medium">
                <Shield className="h-3 w-3" />
                <span>{isAdmin ? "Administrador Geral" : role}</span>
              </div>
            </div>

            {/* Menu Items */}
            <button
              onClick={() => {
                setIsOpen(false);
                setIsProfileModalOpen(true);
              }}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-foreground transition-colors"
            >
              <User className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Meu Perfil</span>
            </button>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-white/5 hover:text-foreground transition-colors"
            >
              <Settings className="h-3.5 w-3.5 text-muted-foreground" />
              <span>Configurações</span>
            </Link>

            <div className="h-[1px] bg-border/60 my-1" />

            <button
              onClick={() => {
                setIsOpen(false);
                signOut();
              }}
              className="w-full flex items-center gap-2 rounded-lg px-3 py-2 text-xs text-rose-400 hover:bg-rose-500/10 transition-colors"
            >
              <LogOut className="h-3.5 w-3.5" />
              <span>Sair da Conta</span>
            </button>
          </div>
        )}
      </div>

      {/* Profile Modal */}
      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
      />
    </>
  );
}
