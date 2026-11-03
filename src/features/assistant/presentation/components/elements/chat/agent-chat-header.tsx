"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { EyeTracker } from "../eye-tracker/eye-tracker";

export interface AgentChatHeaderProps {
  /** Indica si el chat está expandido */
  isOpen?: boolean;
  /** Título principal mostrado en el header ("Asistente") */
  title?: string;
  /** Función invocada para colapsar/cerrar el chat */
  onClose: () => void;
  /** Clases CSS opcionales */
  className?: string;
}

export function AgentChatHeader({
  isOpen = true,
  title = "Asistente",
  onClose,
  className,
}: AgentChatHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between h-14 select-none bg-transparent flex-shrink-0 transition-all duration-300",
        isOpen ? "px-4 py-3 w-full" : "w-14 justify-center px-1",
        className
      )}
    >
      {/* Lado izquierdo: Mascota EyeTracker interactiva fija (size 44) y título */}
      <div className="flex items-center gap-2.5">
        <div className="w-11 h-11 flex items-center justify-center flex-shrink-0 pointer-events-none">
          <EyeTracker
            size={44}
            shape="Pill"
            eyes="Slant"
            follow={25}
            bounce={30}
            fill="light"
          />
        </div>
        {isOpen && (
          <span className="text-sm font-semibold text-zinc-100 animate-in fade-in duration-200">
            {title}
          </span>
        )}
      </div>

      {/* Lado derecho: Botón de cierre / colapso */}
      {isOpen && (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onClose();
          }}
          className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer focus:outline-none"
          aria-label="Cerrar chat"
          title="Cerrar chat (Escape)"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
