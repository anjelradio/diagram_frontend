"use client";

import { Search, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentReservationIndicatorProps {
  activityType: "query" | "edit";
  className?: string;
}

export function AgentReservationIndicator({
  activityType,
  className,
}: AgentReservationIndicatorProps) {
  const isEdit = activityType === "edit";
  const label = isEdit
    ? "El asistente está editando este componente"
    : "El asistente está consultando este componente";
  const shortText = isEdit ? "Asistente editando" : "Asistente consultando";

  return (
    <div
      role="status"
      aria-label={label}
      title={label}
      className={cn(
        "flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-medium backdrop-blur-md border transition-all duration-200 select-none",
        isEdit
          ? "bg-purple-950/90 text-purple-200 border-purple-500/40 shadow-[0_0_10px_rgba(168,85,247,0.2)]"
          : "bg-sky-950/90 text-sky-200 border-sky-500/40 shadow-[0_0_10px_rgba(56,189,248,0.2)]",
        className
      )}
    >
      {isEdit ? (
        <Pencil
          className="h-2.5 w-2.5 text-purple-400 motion-reduce:animate-none animate-pulse"
          aria-hidden="true"
        />
      ) : (
        <Search
          className="h-2.5 w-2.5 text-sky-400 motion-reduce:animate-none animate-pulse"
          aria-hidden="true"
        />
      )}
      <span>{shortText}</span>
    </div>
  );
}
