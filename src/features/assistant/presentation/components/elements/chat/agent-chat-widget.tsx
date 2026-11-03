"use client";

import React, { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import type { AssistantVisualState } from "@/features/assistant/domain/entities/agent-activity.entity";
import { AgentChatHeader } from "./agent-chat-header";
import { AgentChatMessageList } from "./agent-chat-message-list";
import { AgentChatInput } from "./agent-chat-input";
import { ImageViewerModal } from "./image-viewer-modal";
import { useAgentChat, type UseAgentChatReturn } from "@/features/assistant/presentation/hooks/use-agent-chat";
import { useInBrowserStt } from "@/features/assistant/presentation/hooks/use-in-browser-stt";

export interface AgentChatWidgetProps {
  /** Instancia compartida opcional de useAgentChat */
  chat?: UseAgentChatReturn;
  /** Instancia compartida opcional de useInBrowserStt */
  stt?: ReturnType<typeof useInBrowserStt>;
  /** Indica si el usuario actual posee permisos de interacción con el asistente */
  canInteract?: boolean;
  /** Estado visual previo del asistente */
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
  chat: externalChat,
  stt: externalStt,
  canInteract = true,
  visualState = "idle",
  onVoiceRecord,
  onImageSelect,
  className,
  children,
}: AgentChatWidgetProps) {
  const internalChat = useAgentChat();
  const chat = externalChat ?? internalChat;

  const internalStt = useInBrowserStt({
    onTranscribeSuccess: (transcribedText) => {
      chat.appendTranscribedText(transcribedText);
    },
  });
  const stt = externalStt ?? internalStt;

  const widgetRef = useRef<HTMLDivElement>(null);

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
    <>
      <div
        ref={widgetRef}
        className={cn(
          "relative transition-all duration-300 ease-in-out select-none",
          chat.isOpen
            ? "w-[calc(100vw-40px)] sm:w-[480px] h-[calc(100vh-84px)] max-h-[calc(100vh-84px)] min-h-[500px] rounded-3xl bg-[#191a1d] border border-zinc-700/80 shadow-2xl flex flex-col overflow-hidden"
            : "w-14 h-14 rounded-2xl bg-[#191a1d] border border-zinc-700/80 shadow-2xl hover:bg-[#212327] hover:border-zinc-500/80 flex flex-col p-0 cursor-pointer overflow-hidden active:scale-95",
          visualState === "thinking" && "ring-2 ring-indigo-500 animate-pulse",
          visualState === "recording" && "ring-2 ring-rose-500",
          !canInteract && "opacity-50 cursor-not-allowed",
          className
        )}
        onClick={!chat.isOpen && canInteract ? () => chat.setIsOpen(true) : undefined}
        role={!chat.isOpen ? "button" : undefined}
        tabIndex={!chat.isOpen ? 0 : undefined}
        aria-label={!chat.isOpen ? "Abrir chat del Asistente IA" : undefined}
        title={!chat.isOpen ? "Asistente de Diagrama IA" : undefined}
      >
        {/* Cabecera persistente: Mascota EyeTracker siempre anclada en la misma posición y tamaño */}
        <AgentChatHeader
          isOpen={chat.isOpen}
          title="Asistente"
          onClose={handleClose}
        />

        {/* Contenido expandido del chat */}
        {chat.isOpen && (
          <div className="flex flex-col flex-1 min-h-0 w-full animate-in fade-in duration-200 overflow-hidden">
            <AgentChatMessageList
              messages={chat.messages}
              currentUserId="current-user"
              onImageClick={chat.openModalImage}
            />
            {children}
            <AgentChatInput
              value={chat.inputText}
              onChange={chat.setInputText}
              onSend={(text) => chat.sendMessage(text, chat.draftAttachment)}
              sttState={stt.state}
              draftAttachment={chat.draftAttachment}
              onRemoveAttachment={chat.removeDraftAttachment}
              onPreviewAttachment={chat.openModalImage}
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
              onCancelVoiceClick={() => {
                stt.cancelSession();
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

      {/* Visor modal para ampliar imágenes adjuntas */}
      <ImageViewerModal
        isOpen={Boolean(chat.activeModalImageUrl)}
        imageUrl={chat.activeModalImageUrl}
        onClose={chat.closeModalImage}
      />
    </>
  );
}
