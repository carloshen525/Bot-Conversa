import * as React from "react";
import { cn } from "@/modules/shared/utils";

export interface LoadingProps {
  className?: string;
  text?: string;
  size?: "sm" | "md" | "lg";
}

export function Loading({ className, text = "Carregando...", size = "md" }: LoadingProps) {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-6 w-6 border-2",
    lg: "h-10 w-10 border-3",
  };

  return (
    <div className={cn("flex flex-col items-center justify-center p-8 gap-3", className)}>
      <div
        className={cn(
          "animate-spin rounded-full border-border border-t-primary",
          sizes[size]
        )}
      />
      {text && <p className="text-xs text-muted-foreground">{text}</p>}
    </div>
  );
}
