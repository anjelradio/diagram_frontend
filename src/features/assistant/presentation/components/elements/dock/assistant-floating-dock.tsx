"use client";

import React, { useRef, useState, useEffect } from "react";
import { ArrowUp, ImagePlus, Loader2, MessageSquare, Mic } from "lucide-react";
import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SttSessionState } from "@/features/assistant/domain/entities/stt-session.entity";
import type { MultimodalDraftAttachment } from "@/features/assistant/domain/entities/multimodal-draft.entity";
import { ImageAttachmentBadge } from "../chat/image-attachment-badge";
import { DockVoiceNote } from "./dock-voice-note";

export interface AssistantFloatingDockProps {
  /** Valor de texto actual */
  value: string;
  /** Callback al cambiar el texto */
  onChange: (value: string) => void;
  /** Callback al enviar mensaje con texto y/o adjunto */
  onSend: (text: string, attachment?: MultimodalDraftAttachment | null) => void;
  /** Callback al pulsar el botón para iniciar grabación de voz */
  onAudioStart: () => void;
  /** Callback al pulsar el botón de parada para transcribir voz */
  onAudioStop: () => void;
  /** Callback al pulsar el botón X para cancelar y descartar voz */
  onAudioCancel: () => void;
  /** Callback para abrir explorador de archivos y adjuntar imagen */
  onImageAttachClick: () => void;
  /** Callback al seleccionar un archivo de imagen directo (ej. drop o paste) */
  onImageFileSelected?: (file: File) => void;
  /** Borrador de imagen actualmente adjunta */
  draftAttachment?: MultimodalDraftAttachment | null;
  /** Callback para quitar la imagen adjunta */
  onRemoveAttachment?: () => void;
  /** Callback para abrir imagen en visor modal */
  onPreviewAttachment?: (previewUrl: string) => void;
  /** Estado de transcripción por voz */
  sttState?: SttSessionState;
  /** Permisos de edición del usuario en el lienzo */
  canEdit?: boolean;
  /** Si el asistente se encuentra procesando */
  isProcessing?: boolean;
  /** Placeholder para el input */
  placeholder?: string;
  /** Clases CSS adicionales */
  className?: string;
}

const MIN_TEXTAREA_HEIGHT = 42;
const MAX_TEXTAREA_HEIGHT = 160;

const DOCK_TRANSITION: Transition = {
  duration: 0.35,
  ease: [0.22, 1, 0.36, 1],
};

export function AssistantFloatingDock({
  value,
  onChange,
  onSend,
  onAudioStart,
  onAudioStop,
  onAudioCancel,
  onImageAttachClick,
  onImageFileSelected,
  draftAttachment,
  onRemoveAttachment,
  onPreviewAttachment,
  sttState,
  canEdit = true,
  isProcessing = false,
  placeholder = "Escribe una instrucción para el asistente...",
  className,
}: AssistantFloatingDockProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isInputEmpty = value.trim().length === 0;
  const hasContent = !isInputEmpty || Boolean(draftAttachment);
  const isRecording = sttState?.status === "recording";
  const isDisabled = !canEdit || isProcessing;

  // El dock se expande a 2 filas si está enfocado o si ya hay texto escrito
  const isExpandedLayout = (isFocused || !isInputEmpty) && !isRecording;

  // Autoajuste dinámico de la altura del textarea con límite máximo y scroll sutil
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea || !isExpandedLayout) return;

    if (!value) {
      textarea.style.height = `${MIN_TEXTAREA_HEIGHT}px`;
      textarea.style.overflowY = "hidden";
      return;
    }

    textarea.style.height = "auto";
    const scrollHeight = textarea.scrollHeight;

    if (scrollHeight > MAX_TEXTAREA_HEIGHT) {
      textarea.style.height = `${MAX_TEXTAREA_HEIGHT}px`;
      textarea.style.overflowY = "auto";
    } else {
      textarea.style.height = `${Math.max(scrollHeight, MIN_TEXTAREA_HEIGHT)}px`;
      textarea.style.overflowY = "hidden";
    }
  }, [value, isExpandedLayout]);

  const handleSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (hasContent && !isDisabled) {
      onSend(value, draftAttachment);
      setIsFocused(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (e.key === "Escape") {
      if (value.trim().length === 0) {
        setIsFocused(false);
      }
      return;
    }
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Manejador de pegado (Ctrl+V) de imágenes
  const handlePaste = (e: React.ClipboardEvent) => {
    if (!onImageFileSelected || Boolean(draftAttachment)) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      if (item.type.startsWith("image/")) {
        const file = item.getAsFile();
        if (file) {
          e.preventDefault();
          onImageFileSelected(file);
          break;
        }
      }
    }
  };

  return (
    <div
      className={cn(
        "relative flex flex-col items-center select-none pointer-events-auto",
        className
      )}
    >
      {/* Badge píldora de imagen flotando encima del dock si existe un borrador */}
      {draftAttachment && onRemoveAttachment && onPreviewAttachment && (
        <div className="absolute -top-11 left-6 z-10">
          <ImageAttachmentBadge
            attachment={draftAttachment}
            onRemove={onRemoveAttachment}
            onClickImage={onPreviewAttachment}
            disabled={isDisabled}
          />
        </div>
      )}

      {/* Cápsula interactiva del dock flotante con layout morphing animado suave sin rebote */}
      <motion.form
        layout
        transition={DOCK_TRANSITION}
        onSubmit={handleSubmit}
        className={cn(
          "bg-[#191a1d]/95 backdrop-blur-md border border-zinc-700/80 shadow-2xl transition-colors duration-200 select-none overflow-hidden",
          isRecording
            ? "w-[400px] max-w-[90vw] rounded-full p-2 ring-2 ring-blue-500/40"
            : isExpandedLayout
            ? "w-[520px] sm:w-[580px] max-w-[90vw] rounded-3xl p-3 flex flex-col gap-2.5"
            : "w-[480px] sm:w-[520px] max-w-[90vw] rounded-full p-2 flex items-center gap-2.5"
        )}
      >
        {isRecording ? (
          /* ── ESTADO 1: Grabación de Audio Activa ── */
          <div className="flex items-center gap-2 w-full">
            {/* Botón imagen circular deshabilitado sin contorno */}
            <motion.div
              layout
              transition={DOCK_TRANSITION}
              className="w-10 h-10 rounded-full bg-zinc-800/40 text-zinc-600 flex items-center justify-center cursor-not-allowed flex-shrink-0"
              title="Adjunto deshabilitado durante la grabación"
            >
              <ImagePlus className="w-4 h-4" />
            </motion.div>

            {/* Píldora de texto comprimida simultáneamente a círculo con icono de chat */}
            <motion.div
              layoutId="dock-text-pill"
              transition={DOCK_TRANSITION}
              className="w-10 h-10 rounded-full bg-[#282a30] text-zinc-500 flex items-center justify-center cursor-not-allowed flex-shrink-0"
              title="Texto deshabilitado durante la grabación"
            >
              <MessageSquare className="w-4 h-4" />
            </motion.div>

            {/* Componente azul de grabación VoiceNote estilo Bencho extendiéndose simultáneamente */}
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={DOCK_TRANSITION}
              className="flex-1 min-w-0"
            >
              <DockVoiceNote
                onStop={onAudioStop}
                onCancel={onAudioCancel}
                className="w-full"
              />
            </motion.div>
          </div>
        ) : isExpandedLayout ? (
          /* ── ESTADO 2: Entrada Enfocada / Con Texto (2 Filas) ── */
          <>
            {/* Fila 1: Píldora de texto expandida a todo el ancho con fondo #282a30, scroll sutil y sin rebote */}
            <motion.div
              layoutId="dock-text-pill"
              transition={DOCK_TRANSITION}
              className="w-full rounded-2xl bg-[#282a30] p-2.5 flex items-start"
            >
              <textarea
                ref={textareaRef}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  if (value.trim().length === 0) {
                    setIsFocused(false);
                  }
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={placeholder}
                rows={1}
                disabled={isDisabled}
                autoFocus
                style={{ height: MIN_TEXTAREA_HEIGHT }}
                className="w-full bg-transparent border-0 px-1 py-0.5 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-0 resize-none select-text [scrollbar-width:thin] [scrollbar-color:rgba(255,255,255,0.2)_transparent] leading-relaxed transition-[height] duration-150"
                aria-label="Instrucción para el asistente"
              />
            </motion.div>

            {/* Fila 2: Botón de imagen a la izquierda y botón de envío a la derecha */}
            <motion.div
              layout
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -4 }}
              transition={DOCK_TRANSITION}
              className="flex items-center justify-between w-full px-1 pt-0.5"
            >
              {/* Botón circular de imagen sin contorno */}
              <button
                type="button"
                onClick={onImageAttachClick}
                disabled={isDisabled || Boolean(draftAttachment)}
                className={cn(
                  "w-9 h-9 rounded-full bg-zinc-800/80 hover:bg-zinc-700/80 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer active:scale-95",
                  (isDisabled || Boolean(draftAttachment)) && "opacity-40 cursor-not-allowed"
                )}
                aria-label="Adjuntar imagen"
                title={draftAttachment ? "Solo se permite una imagen a la vez" : "Adjuntar imagen"}
              >
                <ImagePlus className="w-4 h-4" />
              </button>

              {/* Botón dinámico de envío sin contorno */}
              <button
                type="submit"
                disabled={isDisabled || !hasContent}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition shadow-md active:scale-95",
                  hasContent
                    ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-indigo-600/30"
                    : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                )}
                aria-label="Enviar instrucción"
                title="Enviar instrucción (Enter)"
              >
                {isProcessing ? (
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                ) : (
                  <ArrowUp className="w-4 h-4" />
                )}
              </button>
            </motion.div>
          </>
        ) : (
          /* ── ESTADO 3: Reposo Compacto (1 Fila) ── */
          <>
            {/* Lado izquierdo: Botón circular de imagen sin contorno */}
            <motion.button
              layout
              transition={DOCK_TRANSITION}
              type="button"
              onClick={onImageAttachClick}
              disabled={isDisabled || Boolean(draftAttachment)}
              className={cn(
                "w-10 h-10 rounded-full bg-zinc-800/80 hover:bg-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition cursor-pointer flex-shrink-0 active:scale-95",
                (isDisabled || Boolean(draftAttachment)) && "opacity-40 cursor-not-allowed"
              )}
              aria-label="Adjuntar imagen"
              title={draftAttachment ? "Solo se permite una imagen a la vez" : "Adjuntar imagen"}
            >
              <ImagePlus className="w-4 h-4" />
            </motion.button>

            {/* Centro: Píldora de texto en reposo con fondo #282a30 sin contorno */}
            <motion.div
              layoutId="dock-text-pill"
              transition={DOCK_TRANSITION}
              className="flex-1 h-10 rounded-full bg-[#282a30] hover:bg-[#30333a] px-4 flex items-center cursor-text transition-colors"
              onClick={() => {
                inputRef.current?.focus();
                setIsFocused(true);
              }}
            >
              <input
                ref={inputRef}
                type="text"
                value={value}
                onChange={(e) => onChange(e.target.value)}
                onFocus={() => setIsFocused(true)}
                onBlur={() => {
                  if (value.trim().length === 0) setIsFocused(false);
                }}
                onKeyDown={handleKeyDown}
                onPaste={handlePaste}
                placeholder={placeholder}
                disabled={isDisabled}
                className="w-full bg-transparent border-0 text-sm text-zinc-100 placeholder:text-zinc-500 focus:outline-none select-text"
                aria-label="Instrucción para el asistente"
              />
            </motion.div>

            {/* Lado derecho: Botón circular de audio (azul) o envío sin contorno */}
            <motion.div layout transition={DOCK_TRANSITION}>
              {hasContent ? (
                <button
                  type="submit"
                  disabled={isDisabled}
                  className="w-10 h-10 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-md shadow-indigo-600/30 transition cursor-pointer flex-shrink-0 active:scale-95"
                  aria-label="Enviar instrucción"
                  title="Enviar instrucción (Enter)"
                >
                  {isProcessing ? (
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                  ) : (
                    <ArrowUp className="w-4 h-4" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onAudioStart}
                  disabled={isDisabled}
                  className={cn(
                    "w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-900/30 transition cursor-pointer flex-shrink-0 active:scale-95",
                    isDisabled && "opacity-40 cursor-not-allowed"
                  )}
                  aria-label="Comando de voz"
                  title="Comando de voz"
                >
                  <Mic className="w-4 h-4" />
                </button>
              )}
            </motion.div>
          </>
        )}
      </motion.form>
    </div>
  );
}
