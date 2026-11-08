"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Bot,
  Users,
  Settings,
  Zap,
  Activity,
  Layers,
} from "lucide-react";
import { cn } from "@/modules/shared/utils";

const NAV_ITEMS = [
  {
    label: "Dashboard",
    href: "/",
    icon: LayoutDashboard,
  },
  {
    label: "Chatbots",
    href: "/chatbots",
    icon: Bot,
  },
  {
    label: "Contatos",
    href: "/contacts",
    icon: Users,
    badge: "V1",
  },
  {
    label: "Configurações",
    href: "/settings",
    icon: Settings,
  },
];

export function Sidebar() {
  const pathname = usePathname();

  // Hide global sidebar when inside visual flow editor for maximum canvas space
  if (pathname.startsWith("/chatbots/") && pathname !== "/chatbots") {
    return null;
  }

  return (
    <aside className="w-60 shrink-0 border-r border-border bg-[#0b0c10] flex flex-col h-screen select-none">
      {/* Brand */}
      <div className="h-14 border-b border-border/80 px-5 flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-600 shadow-md shadow-indigo-600/30">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <div>
          <span className="font-bold text-sm text-foreground tracking-tight block">
            Bot Conversa
          </span>
          <span className="text-[10px] text-muted-foreground uppercase tracking-widest font-mono">
            Platform V1
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Principal
        </div>
        {NAV_ITEMS.map((item) => {
          const isActive =
            item.href === "/" ? pathname === "/" : pathname === item.href;
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 group",
                isActive
                  ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/25 shadow-sm"
                  : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
              )}
            >
              <div className="flex items-center gap-2.5">
                <Icon
                  className={cn(
                    "h-4 w-4 transition-colors",
                    isActive ? "text-indigo-400" : "text-muted-foreground group-hover:text-foreground"
                  )}
                />
                <span>{item.label}</span>
              </div>
              {item.badge && (
                <span className="rounded bg-white/5 px-1.5 py-0.2 text-[9px] font-semibold text-muted-foreground">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        <div className="pt-3 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/60">
          Canais WhatsApp
        </div>
        <Link
          href="/settings/channels/evolution"
          className={cn(
            "flex items-center justify-between rounded-lg px-3 py-2 text-xs font-medium transition-all duration-150 group",
            pathname.startsWith("/settings/channels/evolution")
              ? "bg-indigo-600/15 text-indigo-400 border border-indigo-500/25 shadow-sm"
              : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
          )}
        >
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400" />
            <span>Evolution API</span>
          </div>
          <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-400">
            Ativo
          </span>
        </Link>
      </nav>

      {/* Engine Status Card */}
      <div className="p-3 border-t border-border/70">
        <div className="rounded-lg border border-border/60 bg-[#11131a] p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
              Motor de Execução
            </span>
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          </div>
          <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Operacional</span>
          </div>
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            Snapshots publicados isolados e ativos.
          </p>
        </div>
      </div>
    </aside>
  );
}
