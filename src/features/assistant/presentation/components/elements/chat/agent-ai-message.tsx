"use client";

import React from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/features/assistant/domain/entities/chat-message.entity";

export interface AgentAiMessageProps {
  /** Mensaje de la IA */
  message: ChatMessage;
  /** Clases CSS opcionales */
  className?: string;
}

export function AgentAiMessage({ message, className }: AgentAiMessageProps) {
  return (
    <div
      className={cn(
        "group relative flex flex-col my-2 max-w-full items-start text-left select-text",
        className
      )}
    >
      {/* Texto plano minimalista sin contenedor de burbuja, icono ni nombre */}
      <div className="text-sm text-zinc-200 leading-relaxed px-1 break-words whitespace-pre-wrap">
        {message.content}
      </div>

      {/* Fecha/hora en hover */}
      <div
        suppressHydrationWarning
        className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] text-zinc-500 mt-1 px-1 select-none"
      >
        {message.formattedTime}
      </div>
    </div>
  );
}
