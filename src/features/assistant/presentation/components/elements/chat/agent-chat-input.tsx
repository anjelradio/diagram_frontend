"use client";

import React, { useEffect, useRef } from "react";
import { ArrowUp, Download, ImagePlus, Loader2, Mic, Square, X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { SttSessionState } from "@/features/assistant/domain/entities/stt-session.entity";
import type { MultimodalDraftAttachment } from "@/features/assistant/domain/entities/multimodal-draft.entity";
import { ImageAttachmentBadge } from "./image-attachment-badge";

export interface AgentChatInputProps {
  /** Valor de texto actual */
  value: string;
  /** Callback al cambiar el texto */
  onChange: (value: string) => void;
  /** Callback al enviar mensaje de texto */
  onSend: (text: string) => void;
  /** Callback al pulsar el botón dinámico en modo micrófono */
  onAudioClick: () => void;
  /** Callback al pulsar el botón en modo pausa (detener grabación y transcribir) */
  onPauseClick?: () => void;
  /** Callback para cancelar y eliminar la grabación de audio en curso */
  onCancelVoiceClick?: () => void;
  /** Estado reactivo de transcripción por voz */
  sttState?: SttSessionState;
  /** Callback al pulsar el botón de adjuntar imagen */
  onImageClick: () => void;
  /** Borrador de imagen adjunta actual */
  draftAttachment?: MultimodalDraftAttachment | null;
  /** Callback para quitar la imagen adjunta */
  onRemoveAttachment?: () => void;
  /** Callback para abrir la imagen en visor modal */
  onPreviewAttachment?: (url: string) => void;
  /** Indica si está deshabilitado por permisos o estado de carga */
  disabled?: boolean;
  /** Placeholder para el input */
  placeholder?: string;
  /** Clases CSS adicionales */
  className?: string;
}

const MIN_TEXTAREA_HEIGHT = 38; // Altura mínima por defecto (1 línea)
const MAX_TEXTAREA_HEIGHT = 144; // Altura máxima en px antes de activar scroll vertical (~6 líneas)

export function AgentChatInput({
  value,
  onChange,
  onSend,
  onAudioClick,
  onPauseClick,
  onCancelVoiceClick,
  sttState,
  onImageClick,
  draftAttachment,
  onRemoveAttachment,
  onPreviewAttachment,
  disabled = false,
  placeholder = "Escribe una instrucción...",
  className,
}: AgentChatInputProps) {
  const isInputEmpty = value.trim().length === 0;
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Autoajuste dinámico de la altura del textarea con límite máximo y scroll
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    // Por defecto y cuando no hay texto, siempre debe mantenerse en su altura mínima de 1 línea
    if (!value) {
      textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
      textarea.style.overflowY = "hidden";
      return;
    }

    // Resetear temporalmente la altura para medir el scrollHeight real del texto
    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;

    if (scrollHeight > MAX_TEXTAREA_HEIGHT) {
      textarea.style.height = `${MAX_TEXTAREA_HEIGHT}px`;
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.height = `${Math.max(scrollHeight, MIN_TEXTAREA_HEIGHT)}px`;
      textarea.style.overflowY = "hidden";
    }
  }, [value]);

  // Listener de tecla Escape durante la grabación para cancelarla inmediatamente
  useEffect(() => {
    if (sttState?.status !== "recording") return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onCancelVoiceClick?.();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [sttState?.status, onCancelVoiceClick]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((!isInputEmpty || draftAttachment) && !disabled) {
      onSend(value);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if ((!isInputEmpty || draftAttachment) && !disabled) {
        onSend(value);
      }
    }
  };

  return (
    <div className={cn("px-3 pb-3 pt-1 bg-transparent select-none flex-shrink-0", className)}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col bg-[#282a30] rounded-2xl p-2.5 gap-1.5 transition-colors"
      >
        {/* Badge en píldora cuando existe una imagen adjunta */}
        {draftAttachment && onRemoveAttachment && onPreviewAttachment && (
          <div className="pb-1">
            <ImageAttachmentBadge
              attachment={draftAttachment}
              onRemove={onRemoveAttachment}
              onClickImage={onPreviewAttachment}
              disabled={disabled}
            />
          </div>
        )}

        {/* Fila 1: Textarea de entrada de texto */}
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          disabled={disabled}
          rows={1}
          style={{ height: MIN_TEXTAREA_HEIGHT }}
          className="w-full bg-transparent border-0 px-1 py-0.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0 resize-none max-h-36 overflow-y-hidden select-text [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent] leading-relaxed"
          aria-label="Campo de mensaje para el Asistente IA"
        />

        {/* Fila 2: Botones de acción fijados abajo (imagen a la izquierda, audio/enviar a la derecha) */}
        <div className="flex items-center justify-between pt-0.5">
          {/* Lado izquierdo: Botón de adjuntar imagen (inhabilitado si ya hay una imagen) */}
          <button
            type="button"
            onClick={onImageClick}
            disabled={disabled || Boolean(draftAttachment)}
            className={cn(
              "w-8 h-8 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer",
              (disabled || Boolean(draftAttachment)) && "opacity-40 cursor-not-allowed hover:bg-transparent hover:text-zinc-400"
            )}
            aria-label="Adjuntar imagen"
            title={draftAttachment ? "Solo se permite una imagen a la vez" : "Adjuntar imagen del diagrama"}
          >
            <ImagePlus className="w-4 h-4" />
          </button>

          {/* Lado derecho: Botón dinámico azul o controles de voz */}
          {isInputEmpty ? (
            draftAttachment ? (
              <button
                type="submit"
                disabled={disabled}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer ml-auto"
                aria-label="Enviar mensaje"
                title="Enviar mensaje"
              >
                <ArrowUp className="w-4 h-4" />
              </button>
            ) : sttState?.status === "downloading" ? (
              <button
                type="button"
                disabled
                className="relative w-8 h-8 rounded-full bg-blue-600/70 text-white flex items-center justify-center transition-colors shadow-md disabled:cursor-not-allowed flex-shrink-0 ml-auto"
                aria-label={`Descargando modelo: ${sttState.progress}%`}
                title={`Descargando modelo: ${sttState.progress}%`}
              >
                <svg className="absolute inset-0 w-full h-full -rotate-90 p-0.5" viewBox="0 0 36 36">
                  <path
                    className="text-blue-900/60"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className="text-blue-200 transition-all duration-200"
                    strokeDasharray={`${sttState.progress}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <Download className="w-3.5 h-3.5 text-blue-100 z-10" />
              </button>
            ) : sttState?.status === "recording" ? (
              <div className="flex items-center gap-1.5 ml-auto">
                {/* Botón X de cancelación a la izquierda */}
                <button
                  type="button"
                  onClick={onCancelVoiceClick}
                  className="w-7 h-7 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  aria-label="Cancelar grabación"
                  title="Cancelar y descartar grabación (Escape)"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                {/* Botón Square rojo de parada */}
                <button
                  type="button"
                  onClick={onPauseClick ?? onAudioClick}
                  disabled={disabled}
                  className="w-8 h-8 rounded-full bg-red-600 hover:bg-red-500 text-white flex items-center justify-center transition-colors shadow-md flex-shrink-0 cursor-pointer animate-pulse"
                  aria-label="Finalizar y transcribir"
                  title="Finalizar y transcribir"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                </button>
              </div>
            ) : sttState?.status === "transcribing" ? (
              <button
                type="button"
                disabled
                className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center transition-colors shadow-md disabled:opacity-80 disabled:cursor-not-allowed flex-shrink-0 ml-auto"
                aria-label="Transcribiendo audio..."
                title="Transcribiendo audio..."
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </button>
            ) : (
              <button
                type="button"
                onClick={onAudioClick}
                disabled={disabled}
                className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer ml-auto"
                aria-label="Grabar comando de voz"
                title="Grabar comando de voz"
              >
                <Mic className="w-4 h-4" />
              </button>
            )
          ) : (
            <button
              type="submit"
              disabled={disabled}
              className="w-8 h-8 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center transition-colors shadow-md disabled:opacity-50 disabled:cursor-not-allowed flex-shrink-0 cursor-pointer ml-auto"
              aria-label="Enviar mensaje"
              title="Enviar mensaje"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
