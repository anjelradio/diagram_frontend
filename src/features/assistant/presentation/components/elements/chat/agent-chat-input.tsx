"use client";

import React, { useEffect, useRef } from "react";
import { ArrowUp, Download, ImagePlus, Loader2, Mic, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SttSessionState } from "@/features/assistant/domain/entities/stt-session.entity";
import type { MultimodalDraftAttachment } from "@/features/assistant/domain/entities/multimodal-draft.entity";
import { ComposerImagePreview } from "../composer-image-preview";

export interface AgentChatInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: (text: string) => void;
  onAudioClick: () => void;
  onPauseClick?: () => void;
  onCancelVoiceClick?: () => void;
  onStopAgent?: () => void;
  onDiscardEdit?: () => void;
  isEditingPending?: boolean;
  hasActiveMessage?: boolean;
  isCancelling?: boolean;
  isQueueFull?: boolean;
  sttState?: SttSessionState;
  onImageClick: () => void;
  draftAttachment?: MultimodalDraftAttachment | null;
  onRemoveAttachment?: () => void;
  onPreviewAttachment?: (url: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

const MIN_TEXTAREA_HEIGHT = 38;
const MAX_TEXTAREA_HEIGHT = 144;

export function AgentChatInput({
  value,
  onChange,
  onSend,
  onAudioClick,
  onPauseClick,
  onCancelVoiceClick,
  onStopAgent,
  hasActiveMessage = false,
  isCancelling = false,
  isQueueFull = false,
  sttState,
  onImageClick,
  draftAttachment,
  onRemoveAttachment,
  onPreviewAttachment,
  disabled = false,
  placeholder = "Escribe una instrucción...",
  className,
}: AgentChatInputProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const hasContent = value.trim().length > 0 || Boolean(draftAttachment);
  const hasPrompt = value.trim().length > 0;
  const sendDisabled = disabled || !hasPrompt || (hasActiveMessage && isQueueFull);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    if (!value) {
      textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
      textarea.style.overflowY = "hidden";
      return;
    }
    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;
    textarea.style.height = `${Math.min(Math.max(scrollHeight, MIN_TEXTAREA_HEIGHT), MAX_TEXTAREA_HEIGHT)}px`;
    textarea.style.overflowY = scrollHeight > MAX_TEXTAREA_HEIGHT ? "auto" : "hidden";
  }, [value]);

  useEffect(() => {
    if (sttState?.status !== "recording") return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onCancelVoiceClick?.();
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onCancelVoiceClick, sttState?.status]);

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    if (!sendDisabled) onSend(value);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey) {
      event.preventDefault();
      if (!sendDisabled) onSend(value);
    }
  };

  return (
    <div className={cn("flex-shrink-0 bg-transparent px-3 pb-3 pt-1", className)}>
      <form onSubmit={handleSubmit} className="flex flex-col gap-1.5 rounded-2xl bg-[#282a30] p-2.5 transition-colors">
        {draftAttachment && onRemoveAttachment && onPreviewAttachment && (
          <div className="flex min-h-16 items-start">
            <ComposerImagePreview
              attachment={draftAttachment}
              onRemove={onRemoveAttachment}
              onPreview={onPreviewAttachment}
              disabled={disabled}
            />
          </div>
        )}

        <textarea
          ref={textareaRef}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          style={{ height: MIN_TEXTAREA_HEIGHT }}
          className="w-full resize-none border-0 bg-transparent px-1 py-0.5 text-sm leading-relaxed text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0 max-h-36 overflow-y-hidden select-text [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent]"
          aria-label="Campo de mensaje para el Asistente IA"
        />

        <div className="flex items-center justify-between pt-0.5">
          <button
            type="button"
            onClick={onImageClick}
            disabled={disabled || Boolean(draftAttachment)}
            className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-zinc-400 transition-colors hover:bg-white/10 hover:text-white", (disabled || draftAttachment) && "cursor-not-allowed opacity-40")}
            aria-label="Adjuntar imagen"
            title={draftAttachment ? "Solo se permite una imagen a la vez" : "Adjuntar imagen del diagrama"}
          >
            <ImagePlus className="size-4" />
          </button>

          <div className="ml-auto flex items-center gap-2">
            {hasActiveMessage && hasContent && onStopAgent && (
              <button
                type="button"
                onClick={onStopAgent}
                disabled={disabled || isCancelling}
                className="flex size-8 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={isCancelling ? "Cancelando instrucción" : "Detener respuesta del asistente"}
                title={isCancelling ? "Cancelando…" : "Detener respuesta del asistente"}
              >
                {isCancelling ? <Loader2 className="size-4 animate-spin" /> : <Square className="size-3.5 fill-current" />}
              </button>
            )}
            {sttState?.status === "recording" ? (
              <div className="flex items-center gap-1.5">
                <button type="button" onClick={onCancelVoiceClick} className="flex size-7 items-center justify-center rounded-full text-zinc-400 hover:bg-white/10 hover:text-white" aria-label="Cancelar grabación">
                  <X className="size-3.5" />
                </button>
                <button type="button" onClick={onPauseClick ?? onAudioClick} className="flex size-8 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-500" aria-label="Finalizar y transcribir">
                  <Square className="size-3.5 fill-current" />
                </button>
              </div>
            ) : sttState?.status === "downloading" ? (
              <button type="button" disabled className="flex size-8 items-center justify-center rounded-full bg-blue-600/70 text-white" aria-label={`Descargando modelo: ${sttState.progress}%`}>
                <Download className="size-3.5" />
              </button>
            ) : sttState?.status === "transcribing" ? (
              <button type="button" disabled className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-white" aria-label="Transcribiendo audio">
                <Loader2 className="size-4 animate-spin" />
              </button>
            ) : hasContent ? (
              <button
                type="submit"
                disabled={sendDisabled}
                className="flex size-8 items-center justify-center rounded-full bg-indigo-600 text-white shadow-md transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:bg-zinc-700 disabled:text-zinc-500"
                aria-label={hasActiveMessage ? "Añadir mensaje a la cola" : "Enviar mensaje"}
                title={!hasPrompt ? "Escribe una instrucción para enviar la imagen" : isQueueFull ? "La cola está llena (máx 3)" : (hasActiveMessage ? "Añadir mensaje a la cola" : "Enviar mensaje")}
              >
                <ArrowUp className="size-4" />
              </button>
            ) : hasActiveMessage ? (
              <button
                type="button"
                onClick={onStopAgent}
                disabled={disabled || isCancelling}
                className="flex size-8 items-center justify-center rounded-full bg-red-600 text-white shadow-md transition hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                aria-label={isCancelling ? "Cancelando instrucción" : "Detener respuesta del asistente"}
                title={isCancelling ? "Cancelando…" : "Detener"}
              >
                {isCancelling ? <Loader2 className="size-4 animate-spin" /> : <Square className="size-3.5 fill-current" />}
              </button>
            ) : (
              <button
                type="button"
                onClick={onAudioClick}
                disabled={disabled || isQueueFull}
                className="flex size-8 items-center justify-center rounded-full bg-blue-600 text-white shadow-md hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-40"
                aria-label="Grabar comando de voz"
                title={isQueueFull ? "La cola está llena" : "Grabar comando de voz"}
              >
                <Mic className="size-4" />
              </button>
            )}
          </div>
        </div>
        {draftAttachment && !hasPrompt && (
          <span className="sr-only" role="status">Escribe una instrucción para poder enviar la imagen.</span>
        )}
      </form>
    </div>
  );
}
