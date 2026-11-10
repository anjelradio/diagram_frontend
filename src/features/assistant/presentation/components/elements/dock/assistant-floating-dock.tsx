"use client";

import React, { useRef, useState, useEffect } from "react";
import { ArrowUp, Download, ImagePlus, Loader2, MessageSquare, Mic, Square } from "lucide-react";
import { motion, type Transition } from "framer-motion";
import { cn } from "@/lib/utils";
import type { SttSessionState } from "@/features/assistant/domain/entities/stt-session.entity";
import type { MultimodalDraftAttachment } from "@/features/assistant/domain/entities/multimodal-draft.entity";
import type { AgentQueueMessage } from "@/features/assistant/domain/entities/agent-queue.entity";
import { AgentQueueCard } from "../agent-queue-card";
import { ComposerImagePreview } from "../composer-image-preview";
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
  isCancelling?: boolean;
  isQueueFull?: boolean;
  isEditingPending?: boolean;
  pendingMessages?: AgentQueueMessage[];
  onEditPending?: (messageId: string) => void;
  onRemovePending?: (messageId: string) => void;
  onDiscardEdit?: () => void;
  onStopAgent?: () => void;
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
  isCancelling = false,
  isQueueFull = false,
  pendingMessages = [],
  onEditPending,
  onRemovePending,
  onStopAgent,
  placeholder = "Escribe una instrucción para el asistente...",
  className,
}: AssistantFloatingDockProps) {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isInputEmpty = value.trim().length === 0;
  const hasContent = !isInputEmpty || Boolean(draftAttachment);
  const isRecording = sttState?.status === "recording";
  const isTranscribing = sttState?.status === "transcribing";
  const isDownloading = sttState?.status === "downloading" || sttState?.status === "checking_cache";
  const isVoicePill = isRecording || isTranscribing || isDownloading;
  const isDisabled = !canEdit;
  const isAudioDisabled = !canEdit || isQueueFull;
  const isSendDisabled = isDisabled || isInputEmpty || (isProcessing && isQueueFull);

  // El dock se expande a 2 filas si está enfocado o si ya hay texto escrito
  const isExpandedLayout = (isFocused || !isInputEmpty || Boolean(draftAttachment)) && !isVoicePill;

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
    if (hasContent && !isSendDisabled) {
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
        "relative flex flex-col items-center gap-2 select-none pointer-events-auto",
        pendingMessages.length > 0 && (isRecording || isTranscribing || isDownloading
          ? "w-[400px] max-w-[90vw]"
          : isExpandedLayout
            ? "w-[520px] max-w-[90vw] sm:w-[580px]"
            : "w-[480px] max-w-[90vw] sm:w-[520px]"),
        className
      )}
    >
      <AgentQueueCard
        messages={pendingMessages}
        onEdit={onEditPending ?? (() => undefined)}
        onRemove={onRemovePending ?? (() => undefined)}
      />


      {/* Cápsula interactiva del dock flotante con layout morphing animado suave sin rebote */}
      <motion.form
        layout
        transition={DOCK_TRANSITION}
        onSubmit={handleSubmit}
        className={cn(
          "w-full bg-[#191a1d]/95 backdrop-blur-md border border-zinc-700/80 shadow-2xl transition-colors duration-200 select-none overflow-hidden",
          isVoicePill
            ? "w-[400px] max-w-[90vw] rounded-full p-2 ring-2 ring-blue-500/40"
            : isExpandedLayout
            ? "w-[520px] sm:w-[580px] max-w-[90vw] rounded-3xl p-3 flex flex-col gap-2.5"
            : "w-[480px] sm:w-[520px] max-w-[90vw] rounded-full p-2 flex items-center gap-2.5"
        )}
      >
        {draftAttachment && onRemoveAttachment && onPreviewAttachment && !isVoicePill && (
          <div className="flex min-h-16 items-start px-1">
            <ComposerImagePreview
              attachment={draftAttachment}
              onRemove={onRemoveAttachment}
              onPreview={onPreviewAttachment}
              disabled={isDisabled}
            />
          </div>
        )}

        {isVoicePill ? (
          /* ── ESTADO 1: Grabación / Transcripción de Audio Activa ── */
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

            {/* Componente azul de grabación VoiceNote o estado de transcripción/descarga */}
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.92 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.92 }}
              transition={DOCK_TRANSITION}
              className="flex-1 min-w-0"
            >
              {isRecording ? (
                <DockVoiceNote
                  onStop={onAudioStop}
                  onCancel={onAudioCancel}
                  className="w-full"
                />
              ) : isTranscribing ? (
                <div className="h-10 px-4 rounded-full bg-blue-600 text-white flex items-center justify-center gap-2 shadow-lg backdrop-blur select-none">
                  <Loader2 className="w-4 h-4 animate-spin text-white" />
                  <span className="text-xs font-medium tracking-wide">Transcribiendo y enviando…</span>
                </div>
              ) : (
                <div className="h-10 px-4 rounded-full bg-blue-600/80 text-white flex items-center justify-center gap-2 shadow-lg backdrop-blur select-none">
                  <Download className="w-4 h-4 animate-bounce text-white" />
                  <span className="text-xs font-medium tracking-wide">
                    {sttState?.status === "downloading" ? `Preparando modelo (${sttState.progress}%)…` : "Verificando modelo…"}
                  </span>
                </div>
              )}
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

              {isProcessing && hasContent && (
                <button
                  type="button"
                  onClick={onStopAgent}
                  disabled={isCancelling}
                  className="flex size-8 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={isCancelling ? "Cancelando instrucción" : "Detener respuesta del asistente"}
                  title={isCancelling ? "Cancelando…" : "Detener respuesta del asistente"}
                >
                  {isCancelling ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Square className="size-3.5 fill-current" />}
                </button>
              )}

              {/* Botón dinámico único en el extremo derecho */}
              {hasContent ? (
                <button
                  type="submit"
                  disabled={isSendDisabled}
                  className={cn(
                    "w-9 h-9 rounded-full flex items-center justify-center transition shadow-md active:scale-95",
                    !isSendDisabled
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white cursor-pointer shadow-indigo-600/30"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  )}
                  aria-label={isProcessing ? "Añadir mensaje a la cola" : "Enviar instrucción"}
                  title={isInputEmpty ? "Escribe una instrucción para enviar la imagen" : isQueueFull ? "La cola está llena (máx 3)" : (isProcessing ? "Añadir mensaje a la cola (Enter)" : "Enviar instrucción (Enter)")}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              ) : isProcessing ? (
                <button
                  type="button"
                  onClick={onStopAgent}
                  disabled={isCancelling}
                  className="flex size-9 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={isCancelling ? "Cancelando instrucción" : "Detener respuesta del asistente"}
                  title={isCancelling ? "Cancelando…" : "Detener"}
                >
                  {isCancelling ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Square className="size-3.5 fill-current" />
                  )}
                </button>
              ) : (
                <button
                  type="submit"
                  disabled
                  className="w-9 h-9 rounded-full flex items-center justify-center bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  aria-label="Enviar instrucción"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              )}
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

            {/* Lado derecho: Botón circular dinámico único */}
            <motion.div layout transition={DOCK_TRANSITION} className="relative flex items-center gap-1">
              {isProcessing && hasContent && (
                <button
                  type="button"
                  onClick={onStopAgent}
                  disabled={isCancelling}
                  className="flex size-8 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={isCancelling ? "Cancelando instrucción" : "Detener respuesta del asistente"}
                  title={isCancelling ? "Cancelando…" : "Detener respuesta del asistente"}
                >
                  {isCancelling ? <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" /> : <Square className="size-3.5 fill-current" />}
                </button>
              )}
              {hasContent ? (
                <button
                  type="submit"
                  disabled={isSendDisabled}
                  className={cn(
                    "w-10 h-10 rounded-full flex items-center justify-center shadow-md transition cursor-pointer flex-shrink-0 active:scale-95",
                    !isSendDisabled
                      ? "bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-600/30"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  )}
                  aria-label={isProcessing ? "Añadir mensaje a la cola" : "Enviar instrucción"}
                  title={isInputEmpty ? "Escribe una instrucción para enviar la imagen" : isQueueFull ? "La cola está llena (máx 3)" : (isProcessing ? "Añadir mensaje a la cola (Enter)" : "Enviar instrucción (Enter)")}
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
              ) : isProcessing ? (
                <button
                  type="button"
                  onClick={onStopAgent}
                  disabled={isCancelling}
                  className="flex size-10 items-center justify-center rounded-full bg-red-600 text-white shadow-md hover:bg-red-500 disabled:cursor-not-allowed disabled:opacity-50"
                  aria-label={isCancelling ? "Cancelando instrucción" : "Detener respuesta del asistente"}
                  title={isCancelling ? "Cancelando…" : "Detener"}
                >
                  {isCancelling ? (
                    <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
                  ) : (
                    <Square className="size-4 fill-current" />
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={onAudioStart}
                  disabled={isAudioDisabled}
                  className={cn(
                    "w-10 h-10 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-md shadow-blue-900/30 transition cursor-pointer flex-shrink-0 active:scale-95",
                    isAudioDisabled && "opacity-40 cursor-not-allowed"
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
