"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { AssistantVisualState } from "@/features/assistant/domain/entities/agent-activity.entity";
import { AgentTriggerButton } from "../agent-trigger-button";
import { AgentChatHeader } from "./agent-chat-header";
import { AgentChatMessageList } from "./agent-chat-message-list";
import { AgentChatInput } from "./agent-chat-input";
import { useAgentChat } from "@/features/assistant/presentation/hooks/use-agent-chat";
import { useInBrowserStt } from "@/features/assistant/presentation/hooks/use-in-browser-stt";

export interface AgentChatWidgetProps {
  /** Indica si el usuario actual posee permisos de interacción con el asistente */
  canInteract?: boolean;
  /** Estado visual previo del asistente para el botón colapsado */
  visualState?: AssistantVisualState;
  /** Callback opcional al disparar grabación de voz */
  onVoiceRecord?: () => void;
  /** Callback opcional al disparar importación de imágenes */
  onImageSelect?: () => void;
  /** Clases CSS adicionales para el contenedor exterior */
  className?: string;
  /** Contenido opcional para el cuerpo de mensajes */
  children?: React.ReactNode;
}

export function AgentChatWidget({
  canInteract = true,
  visualState = "idle",
  onVoiceRecord,
  onImageSelect,
  className,
  children,
}: AgentChatWidgetProps) {
  const chat = useAgentChat();
  const widgetRef = useRef<HTMLDivElement>(null);

  const stt = useInBrowserStt({
    onTranscribeSuccess: (transcribedText) => {
      chat.appendTranscribedText(transcribedText);
    },
  });

  const handleClose = () => {
    stt.cancelSession();
    chat.setIsOpen(false);
  };

  // Escuchar tecla Escape para cerrar el chat y liberar recursos
  useEffect(() => {
    if (!chat.isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        stt.cancelSession();
        chat.setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [chat.isOpen, chat, stt]);

  return (
    <div
      ref={widgetRef}
      className={cn(
        "relative transition-all duration-300 ease-in-out select-none",
        chat.isOpen
          ? "w-[calc(100vw-40px)] sm:w-[480px] h-[calc(100vh-84px)] max-h-[calc(100vh-84px)] min-h-[500px] rounded-3xl bg-[#191a1d] border border-zinc-700/80 shadow-2xl flex flex-col overflow-hidden"
          : "w-14 h-14 rounded-2xl",
        className
      )}
    >
      {!chat.isOpen ? (
        <AgentTriggerButton
          state={visualState}
          disabled={!canInteract}
          onClick={() => chat.setIsOpen(true)}
          aria-label="Abrir chat del Asistente IA"
          title="Abrir chat del Asistente IA"
        />
      ) : (
        <div className="flex flex-col w-full h-full animate-in fade-in duration-200">
          <AgentChatHeader
            title="Asistente"
            onClose={handleClose}
          />
          <AgentChatMessageList
            messages={chat.messages}
            currentUserId="current-user"
          />
          {children}
          <AgentChatInput
            value={chat.inputText}
            onChange={chat.setInputText}
            onSend={chat.sendMessage}
            sttState={stt.state}
            onAudioClick={() => {
              if (onVoiceRecord) {
                onVoiceRecord();
              } else {
                void stt.handleRecordClick();
              }
            }}
            onPauseClick={() => {
              void stt.handlePauseClick();
            }}
            onImageClick={() => {
              if (onImageSelect) {
                onImageSelect();
              }
            }}
            disabled={!canInteract}
          />
        </div>
      )}
    </div>
  );
}
