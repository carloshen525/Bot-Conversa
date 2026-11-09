"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { HeaderUserMenu } from "./HeaderUserMenu";
import { Sparkles, ShieldCheck } from "lucide-react";

export function TopHeader() {
  const pathname = usePathname();

  // Hide on login page and visual flow canvas
  if (
    pathname === "/login" ||
    (pathname.startsWith("/chatbots/") && pathname !== "/chatbots")
  ) {
    return null;
  }

  // Compute simple section title
  let sectionTitle = "Painel";
  if (pathname === "/") sectionTitle = "Dashboard";
  else if (pathname.startsWith("/chatbots")) sectionTitle = "Chatbots Visuais";
  else if (pathname.startsWith("/contacts")) sectionTitle = "Contatos & Audiência";
  else if (pathname.startsWith("/settings/channels")) sectionTitle = "Canais de Comunicação";
  else if (pathname.startsWith("/settings")) sectionTitle = "Configurações";

  return (
    <header className="h-14 border-b border-border/80 bg-[#090a0f]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 select-none z-10 sticky top-0">
      {/* Left: Section Title & Breadcrumb Indicator */}
      <div className="flex items-center gap-2">
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
          {sectionTitle}
        </h2>
      </div>

      {/* Right: User Profile Menu */}
      <div className="flex items-center gap-3">
        <HeaderUserMenu />
      </div>
    </header>
  );
}
