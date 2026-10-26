"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/features/assistant/domain/entities/chat-message.entity";
import { AgentChatBubble } from "./agent-chat-bubble";
import { AgentAiMessage } from "./agent-ai-message";

export interface AgentChatMessageListProps {
  /** Colección de mensajes en memoria de la sesión */
  messages: ChatMessage[];
  /** ID del usuario actual para discriminar mensajes propios vs colaboradores */
  currentUserId?: string;
  /** Clases CSS para el contenedor con scroll */
  className?: string;
}

export function AgentChatMessageList({
  messages,
  currentUserId = "current-user",
  className,
}: AgentChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const [isInitialMount, setIsInitialMount] = useState(true);

  // Tras la apertura inicial y animación de entrada, los mensajes nuevos aparecen sin retraso
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialMount(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  // Scroll automático suave hacia el mensaje más reciente solo dentro de la lista
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTo({
        top: listRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  return (
    <div
      ref={listRef}
      className={cn(
        "flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 select-text",
        "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]",
        "[mask-image:linear-gradient(to_bottom,transparent_0%,black_24px,black_calc(100%-24px),transparent_100%)]",
        "[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_24px,black_calc(100%-24px),transparent_100%)]",
        className
      )}
    >
      {messages.map((message, index) => {
        const isCurrentUser =
          message.sender.role === "user" || message.sender.id === currentUserId;

        return (
          <div
            key={message.id}
            className="animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"
            style={{
              animationDelay: isInitialMount
                ? `${Math.min(index * 60 + 120, 360)}ms`
                : "0ms",
              animationFillMode: "both",
            }}
          >
            {message.sender.role === "assistant" ? (
              <AgentAiMessage message={message} />
            ) : (
              <AgentChatBubble
                message={message}
                isCurrentUser={isCurrentUser}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
