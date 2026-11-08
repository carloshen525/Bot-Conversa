"use client";

import * as React from "react";
import { CheckCircle2, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/modules/shared/utils";

export type ToastType = "success" | "error" | "info" | "warning";

export interface ToastMessage {
  id: string;
  type: ToastType;
  title: string;
  description?: string;
}

interface ToastContextType {
  toast: (options: { type?: ToastType; title: string; description?: string; duration?: number }) => void;
  success: (title: string, description?: string) => void;
  error: (title: string, description?: string) => void;
  info: (title: string, description?: string) => void;
}

const ToastContext = React.createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = React.useState<ToastMessage[]>([]);

  const removeToast = React.useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = React.useCallback(
    ({ type = "info", title, description, duration = 4000 }: { type?: ToastType; title: string; description?: string; duration?: number }) => {
      const id = Math.random().toString(36).substring(2, 9);
      setToasts((prev) => [...prev, { id, type, title, description }]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
    },
    [removeToast]
  );

  const success = React.useCallback((title: string, description?: string) => toast({ type: "success", title, description }), [toast]);
  const error = React.useCallback((title: string, description?: string) => toast({ type: "error", title, description }), [toast]);
  const info = React.useCallback((title: string, description?: string) => toast({ type: "info", title, description }), [toast]);

  return (
    <ToastContext.Provider value={{ toast, success, error, info }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full pointer-events-none">
        {toasts.map((t) => {
          const icons = {
            success: <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />,
            error: <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />,
            info: <Info className="h-4 w-4 text-sky-400 shrink-0" />,
            warning: <AlertCircle className="h-4 w-4 text-amber-400 shrink-0" />,
          };

          return (
            <div
              key={t.id}
              className={cn(
                "pointer-events-auto flex items-start gap-3 rounded-xl border border-border/80 bg-[#151821] p-3.5 shadow-xl transition-all duration-200 animate-in slide-in-from-bottom-2",
                t.type === "success" && "border-emerald-500/30",
                t.type === "error" && "border-rose-500/30",
                t.type === "warning" && "border-amber-500/30"
              )}
            >
              <div className="mt-0.5">{icons[t.type]}</div>
              <div className="flex-1">
                <p className="text-xs font-semibold text-foreground">{t.title}</p>
                {t.description && <p className="text-xs text-muted-foreground mt-0.5">{t.description}</p>}
              </div>
              <button
                onClick={() => removeToast(t.id)}
                className="text-muted-foreground hover:text-foreground transition-colors p-0.5"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within ToastProvider");
  }
  return context;
}
