"use client";

import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { ChatMessage } from "@/features/assistant/domain/entities/chat-message.entity";
import { AgentChatBubble } from "./agent-chat-bubble";
import { AgentAiMessage } from "./agent-ai-message";
import { AgentActivityStatus } from "./agent-activity-status";

export interface AgentChatMessageListProps {
  /** Colección de mensajes en memoria de la sesión */
  messages: ChatMessage[];
  /** ID del usuario actual para discriminar mensajes propios vs colaboradores */
  currentUserId?: string;
  /** Callback opcional al hacer clic en una imagen adjunta */
  onImageClick?: (url: string) => void;
  /** Clases CSS para el contenedor con scroll */
  className?: string;
  hasMoreHistory?: boolean;
  isHistoryLoading?: boolean;
  onLoadMore?: () => Promise<void>;
  onResponseAnimationConsumed?: (responseMessageId: string) => void;
}

export function AgentChatMessageList({
  messages,
  currentUserId = "current-user",
  onImageClick,
  className,
  hasMoreHistory = false,
  isHistoryLoading = false,
  onLoadMore,
  onResponseAnimationConsumed,
}: AgentChatMessageListProps) {
  const listRef = useRef<HTMLDivElement>(null);
  const bottomSentinelRef = useRef<HTMLDivElement>(null);
  const [isInitialMount, setIsInitialMount] = useState(true);
  const scrollAnchorRef = useRef<{ height: number; top: number } | null>(null);
  const wasAtBottomRef = useRef(true);
  const previousMessageCountRef = useRef(0);

  // Tras la apertura inicial y animación de entrada, los mensajes nuevos aparecen sin retraso
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsInitialMount(false);
    }, 600);
    return () => clearTimeout(timer);
  }, []);

  const scrollToBottom = (instant = false) => {
    const element = listRef.current;
    if (!element) return;
    if (instant) {
      element.scrollTop = element.scrollHeight;
      bottomSentinelRef.current?.scrollIntoView({ block: "end" });
    } else {
      element.scrollTo({ top: element.scrollHeight, behavior: "smooth" });
    }
  };

  useLayoutEffect(() => {
    const element = listRef.current;
    if (!element) return;

    // En apertura o carga inicial con mensajes existentes, posicionar de inmediato al fondo
    if (previousMessageCountRef.current === 0 && messages.length > 0) {
      scrollToBottom(true);
      requestAnimationFrame(() => {
        scrollToBottom(true);
      });
      previousMessageCountRef.current = messages.length;
      return;
    }

    if (previousMessageCountRef.current === messages.length) return;

    if (scrollAnchorRef.current) {
      const anchor = scrollAnchorRef.current;
      element.scrollTop = anchor.top + element.scrollHeight - anchor.height;
      scrollAnchorRef.current = null;
    } else if (wasAtBottomRef.current && messages.length > 0) {
      scrollToBottom(false);
    }
    previousMessageCountRef.current = messages.length;
  }, [messages]);

  const loadMore = async () => {
    const element = listRef.current;
    if (!element || !onLoadMore || isHistoryLoading) return;
    scrollAnchorRef.current = { height: element.scrollHeight, top: element.scrollTop };
    await onLoadMore();
  };

  useLayoutEffect(() => {
    if (!isHistoryLoading && scrollAnchorRef.current && previousMessageCountRef.current === messages.length) {
      scrollAnchorRef.current = null;
    }
  }, [isHistoryLoading, messages.length]);

  return (
    <div
      ref={listRef}
      onScroll={(event) => {
        const element = event.currentTarget;
        wasAtBottomRef.current = element.scrollHeight - element.scrollTop - element.clientHeight < 48;
      }}
      className={cn(
        "flex-1 min-h-0 overflow-y-auto px-4 py-3 space-y-2 select-text",
        "[scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.15)_transparent]",
        "[mask-image:linear-gradient(to_bottom,transparent_0%,black_24px,black_calc(100%-24px),transparent_100%)]",
        "[-webkit-mask-image:linear-gradient(to_bottom,transparent_0%,black_24px,black_calc(100%-24px),transparent_100%)]",
        className
      )}
    >
      {hasMoreHistory && (
        <div className="sticky top-0 z-10 flex justify-center pb-3">
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={isHistoryLoading}
            className="rounded-full border border-white/10 bg-zinc-900/90 px-3 py-1.5 text-xs text-zinc-300 shadow-lg backdrop-blur transition hover:bg-zinc-800 disabled:opacity-60"
          >
            {isHistoryLoading ? "Cargando…" : "Cargar más"}
          </button>
        </div>
      )}
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-center p-6 select-none h-full min-h-[220px]">
          <p className="text-sm text-zinc-500 font-normal">
            Empieza a escribir o pregunta algo al asistente
          </p>
        </div>
      ) : (
        messages.map((message, index) => {
          const isCurrentUser = message.sender.id === currentUserId;

          return (
            <div
              key={message.id}
              className={cn(
                message.sender.role !== "assistant" &&
                  "animate-in fade-in-0 zoom-in-95 slide-in-from-bottom-2 duration-300 ease-out"
              )}
              style={{
                animationDelay: message.sender.role !== "assistant" && isInitialMount
                  ? `${Math.min(index * 60 + 120, 360)}ms`
                  : undefined,
                animationFillMode: message.sender.role !== "assistant" && isInitialMount
                  ? "both"
                  : undefined,
              }}
            >
              {message.sender.role === "assistant" ? (
                <AgentAiMessage
                  message={message}
                  onAnimationConsumed={onResponseAnimationConsumed}
                />
              ) : (
                <>
                  <AgentChatBubble
                    message={message}
                    isCurrentUser={isCurrentUser}
                    onImageClick={onImageClick}
                  />
                  {message.status === "running" && (
                    <div className="w-full flex justify-start pl-1 pt-1.5 pb-0.5">
                      <AgentActivityStatus
                        code={message.activityCode}
                        type={message.activityType}
                        stale={message.activityStale}
                        cancelling={message.cancelRequested}
                      />
                    </div>
                  )}
                </>
              )}
            </div>
          );
        })
      )}
      <div ref={bottomSentinelRef} className="h-px w-full shrink-0" aria-hidden="true" />
    </div>
  );
}
