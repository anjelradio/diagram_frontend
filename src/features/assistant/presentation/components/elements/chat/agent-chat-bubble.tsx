"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/features/assistant/domain/entities/chat-message.entity";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import {
  Bubble,
  BubbleContent,
} from "@/components/ui/bubble";
import {
  Message,
  MessageAvatar,
  MessageContent,
  MessageFooter,
} from "@/components/ui/message";

export interface AgentChatBubbleProps {
  /** Mensaje a representar */
  message: ChatMessage;
  /** Indica si el mensaje pertenece al usuario en sesión */
  isCurrentUser: boolean;
  /** Callback opcional al hacer clic en una imagen adjunta */
  onImageClick?: (url: string) => void;
  /** Clases CSS opcionales */
  className?: string;
}

const COLLAPSED_MAX_HEIGHT = 120; // Altura máxima en px del bubble colapsado (~5 líneas)

export function AgentChatBubble({
  message,
  isCurrentUser,
  onImageClick,
  className,
}: AgentChatBubbleProps) {
  const contentRef = useRef<HTMLDivElement>(null);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  useEffect(() => {
    const content = message.content || "";
    const lineCount = (content.match(/\n/g) || []).length + 1;

    const checkOverflow = () => {
      // Si el texto es corto (<= 120 caracteres) y tiene 4 renglones o menos, jamás debe desbordar
      if (content.length <= 120 && lineCount <= 4) {
        setIsOverflowing(false);
        setIsExpanded(false);
        return;
      }

      const el = contentRef.current;
      if (!el) return;
      const computedLineHeight = parseFloat(window.getComputedStyle(el).lineHeight) || 22;
      const estimatedLines = Math.round(el.scrollHeight / computedLineHeight);
      const isActuallyOverflowing =
        el.scrollHeight > COLLAPSED_MAX_HEIGHT + 8 && (estimatedLines > 4 || lineCount > 4);
      setIsOverflowing(isActuallyOverflowing);
    };

    const rafId = requestAnimationFrame(checkOverflow);
    return () => cancelAnimationFrame(rafId);
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
    <Message
      align={isCurrentUser ? "end" : "start"}
      className={cn("group my-1", className)}
    >
      {/* Avatar del usuario o colaborador anclado siempre arriba a la derecha (si es usuario) o izquierda */}
      <MessageAvatar>
        <Avatar
          className={cn(
            "size-7 border select-none overflow-hidden",
            isCurrentUser
              ? "bg-blue-700 border-blue-400/40 text-white"
              : "bg-zinc-700 border-zinc-600 text-zinc-200"
          )}
          title={senderName}
        >
          {message.sender.avatarUrl ? (
            <AvatarImage
              src={message.sender.avatarUrl}
              alt={senderName}
            />
          ) : null}
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
      </MessageAvatar>

      {/* Contenedor del mensaje */}
      <MessageContent>
        {/* Etiqueta superior con nombre para colaboradores */}
        {!isCurrentUser && (
          <span className="text-[11px] font-medium mb-0.5 px-1 text-zinc-400 text-left">
            {senderName}
          </span>
        )}

        {/* Burbuja del mensaje redonda y uniforme */}
        <Bubble
          variant={isCurrentUser ? "default" : "muted"}
          className={cn(
            isCurrentUser
              ? "bg-blue-600 text-white"
              : "bg-zinc-800 text-zinc-100"
          )}
        >
          {/* Imágenes adjuntas del mensaje */}
          {message.attachments && message.attachments.length > 0 && (
            <div className="flex flex-col gap-2 mb-2">
              {message.attachments
                .filter((att) => att.type === "image")
                .map((att) => (
                  <div
                    key={att.id}
                    onClick={() => onImageClick?.(att.url)}
                    className="relative rounded-xl overflow-hidden cursor-pointer group/img max-h-56 border border-white/10 shadow-sm"
                    title="Hacer clic para ampliar imagen"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.url}
                      alt={att.name || "Imagen adjunta"}
                      className="w-full h-auto max-h-56 object-cover transition-transform duration-200 group-hover/img:scale-105 pointer-events-none"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover/img:bg-black/25 transition-colors flex items-center justify-center">
                      <span className="opacity-0 group-hover/img:opacity-100 text-[11px] text-white bg-black/60 px-2.5 py-1 rounded-full transition-opacity shadow-sm">
                        Ver imagen
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          )}

          {/* Contenido textual con clamp de altura */}
          <BubbleContent
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
          </BubbleContent>

          {message.status === "uncertain" && (
            <p className="mt-2 px-1 text-[11px] text-amber-200" role="status">
              No pude confirmar el estado. No se reenviará automáticamente.
            </p>
          )}

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
        </Bubble>

        {/* Fecha/hora simple visible únicamente al hacer hover */}
        <MessageFooter
          suppressHydrationWarning
          className="opacity-0 group-hover:opacity-100 transition-opacity duration-150 px-1"
        >
          {message.formattedTime}
        </MessageFooter>
      </MessageContent>
    </Message>
  );
}
