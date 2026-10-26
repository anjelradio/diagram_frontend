"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/features/assistant/domain/entities/chat-message.entity";

export interface AgentChatBubbleProps {
  /** Mensaje a representar */
  message: ChatMessage;
  /** Indica si el mensaje pertenece al usuario en sesión */
  isCurrentUser: boolean;
  /** Clases CSS opcionales */
  className?: string;
}

const COLLAPSED_MAX_HEIGHT = 120; // Altura máxima en px del bubble colapsado (~5 líneas)

export function AgentChatBubble({
  message,
  isCurrentUser,
  className,
}: AgentChatBubbleProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const el = contentRef.current;
    if (!el) return;

    if (el.scrollHeight > COLLAPSED_MAX_HEIGHT + 8) {
      setIsOverflowing(true);
    } else {
      setIsOverflowing(false);
    }
  }, [message.content]);

  const senderName = isCurrentUser ? "Tú" : message.sender.name || "Colaborador";
  const initials = isCurrentUser
    ? "TÚ"
    : (message.sender.name || "U")
        .split(" ")
        .map((p: string) => p[0])
        .slice(0, 2)
        .join("")
        .toUpperCase();

  return (
    <div
      className={cn(
        "group relative flex flex-col my-1 max-w-full",
        isCurrentUser ? "items-end" : "items-start",
        className
      )}
    >
      {/* Etiqueta superior con nombre o 'Tú' */}
      <span
        className={cn(
          "text-[11px] font-medium mb-1 px-1",
          isCurrentUser ? "text-blue-300 text-right" : "text-zinc-400 text-left"
        )}
      >
        {senderName}
      </span>

      {/* Contenedor de burbuja + avatar */}
      <div
        className={cn(
          "flex items-end gap-2 max-w-full",
          isCurrentUser ? "flex-row" : "flex-row"
        )}
      >
        {/* Avatar del colaborador a la izquierda */}
        {!isCurrentUser && (
          <div
            className="w-7 h-7 rounded-full bg-zinc-700 border border-zinc-600 flex items-center justify-center text-[10px] font-semibold text-zinc-200 flex-shrink-0 select-none overflow-hidden"
            title={message.sender.name}
          >
            {message.sender.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message.sender.avatarUrl}
                alt={message.sender.name}
                className="w-full h-full object-cover"
              />
            ) : (
              initials
            )}
          </div>
        )}

        {/* Burbuja del mensaje */}
        <div
          className={cn(
            "relative px-3.5 py-2 text-sm shadow-sm break-words max-w-[82%] leading-relaxed transition-all duration-200",
            isCurrentUser
              ? "bg-blue-600 text-white rounded-2xl rounded-tr-sm"
              : "bg-zinc-800 text-zinc-100 border border-white/10 rounded-2xl rounded-tl-sm"
          )}
        >
          {/* Contenedor del contenido textual con clamp de altura si excede el límite y está colapsado */}
          <div
            ref={contentRef}
            className={cn(
              "whitespace-pre-wrap transition-[max-height] duration-200",
              isOverflowing && !isExpanded && "overflow-hidden"
            )}
            style={{
              maxHeight:
                isOverflowing && !isExpanded ? `${COLLAPSED_MAX_HEIGHT}px` : undefined,
            }}
          >
            {message.content}
          </div>

          {/* Degradado y botón 'Ver más' cuando el contenido supera el límite y está colapsado */}
          {isOverflowing && !isExpanded && (
            <div
              className={cn(
                "absolute inset-x-0 bottom-0 pt-8 pb-1.5 flex items-end justify-center rounded-b-2xl pointer-events-auto",
                isCurrentUser
                  ? "bg-gradient-to-t from-blue-600 via-blue-600/90 to-transparent"
                  : "bg-gradient-to-t from-zinc-800 via-zinc-800/90 to-transparent"
              )}
            >
              <button
                type="button"
                onClick={() => setIsExpanded(true)}
                className={cn(
                  "text-xs font-semibold px-2.5 py-0.5 rounded-full cursor-pointer transition-colors shadow-xs select-none",
                  isCurrentUser
                    ? "text-blue-100 hover:text-white bg-blue-700/80 hover:bg-blue-700"
                    : "text-zinc-200 hover:text-white bg-zinc-700/80 hover:bg-zinc-700"
                )}
                aria-expanded={false}
              >
                Ver más
              </button>
            </div>
          )}

          {/* Botón 'Ver menos' al final del contenido cuando está expandido */}
          {isOverflowing && isExpanded && (
            <div className="mt-2 pt-1 flex justify-end">
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className={cn(
                  "text-xs font-semibold px-2 py-0.5 rounded cursor-pointer transition-colors hover:underline select-none",
                  isCurrentUser
                    ? "text-blue-200 hover:text-white"
                    : "text-zinc-400 hover:text-zinc-100"
                )}
                aria-expanded={true}
              >
                Ver menos
              </button>
            </div>
          )}
        </div>

        {/* Avatar del usuario propio a la derecha */}
        {isCurrentUser && (
          <div
            className="w-7 h-7 rounded-full bg-blue-700 border border-blue-400/40 flex items-center justify-center text-[10px] font-semibold text-white flex-shrink-0 select-none overflow-hidden"
            title="Tú"
          >
            {message.sender.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={message.sender.avatarUrl}
                alt="Tú"
                className="w-full h-full object-cover"
              />
            ) : (
              "TÚ"
            )}
          </div>
        )}
      </div>

      {/* Fecha/hora simple visible únicamente al hacer hover */}
      <div
        suppressHydrationWarning
        className={cn(
          "opacity-0 group-hover:opacity-100 transition-opacity duration-150 text-[10px] text-zinc-400 mt-1 px-1",
          isCurrentUser ? "text-right" : "text-left"
        )}
      >
        {message.formattedTime}
      </div>
    </div>
  );
}
