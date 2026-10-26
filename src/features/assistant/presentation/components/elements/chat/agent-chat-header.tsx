"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface AgentChatHeaderProps {
  /** Título principal mostrado en el header ("Asistente") */
  title?: string;
  /** URL de la imagen del asistente para el icono izquierdo */
  avatarSrc?: string;
  /** Función invocada para colapsar/cerrar el chat */
  onClose: () => void;
  /** Clases CSS opcionales */
  className?: string;
}

export function AgentChatHeader({
  title = "Asistente",
  avatarSrc = "/assistant_states/base.webp",
  onClose,
  className,
}: AgentChatHeaderProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between px-4 py-3 select-none bg-transparent",
        className
      )}
    >
      {/* Lado izquierdo: Imagen del agente y título simple */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 flex items-center justify-center flex-shrink-0">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={avatarSrc}
            alt="Asistente"
            width={32}
            height={32}
            className="w-full h-full object-contain pointer-events-none select-none"
          />
        </div>
        <span className="text-sm font-semibold text-zinc-100">
          {title}
        </span>
      </div>

      {/* Lado derecho: Botón de cierre / colapso */}
      <button
        type="button"
        onClick={onClose}
        className="w-7 h-7 rounded-lg flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
        aria-label="Cerrar chat"
        title="Cerrar chat (Escape)"
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
