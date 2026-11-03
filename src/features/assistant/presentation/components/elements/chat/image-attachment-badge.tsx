"use client";

import React from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MultimodalDraftAttachment } from "@/features/assistant/domain/entities/multimodal-draft.entity";

export interface ImageAttachmentBadgeProps {
  /** Objeto de borrador multimodal activo */
  attachment: MultimodalDraftAttachment;
  /** Callback para eliminar y descartar la imagen adjunta */
  onRemove: () => void;
  /** Callback para abrir el visor de imagen en modal */
  onClickImage: (previewUrl: string) => void;
  /** Si los controles de descarte están deshabilitados */
  disabled?: boolean;
  /** Clases CSS adicionales */
  className?: string;
}

export function ImageAttachmentBadge({
  attachment,
  onRemove,
  onClickImage,
  disabled = false,
  className,
}: ImageAttachmentBadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-zinc-800/95 border border-white/10 shadow-lg text-xs text-zinc-200 select-none transition-all duration-200 animate-in fade-in slide-in-from-bottom-1",
        className
      )}
    >
      {/* Miniatura interactiva para abrir modal de inspección */}
      <button
        type="button"
        onClick={() => onClickImage(attachment.previewUrl)}
        className="w-5 h-5 rounded overflow-hidden flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity focus:outline-none focus:ring-1 focus:ring-blue-400"
        title="Ver imagen en tamaño completo"
        aria-label="Ver imagen ampliada"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={attachment.previewUrl}
          alt={attachment.name || "Borrador de imagen"}
          className="w-full h-full object-cover pointer-events-none"
        />
      </button>

      {/* Nombre literal invariable requerido: 'imagen' */}
      <span className="font-medium text-[11px] text-zinc-300">imagen</span>

      {/* Botón de descarte X */}
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="w-4 h-4 rounded-full flex items-center justify-center text-zinc-400 hover:text-white hover:bg-white/10 transition-colors disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer focus:outline-none"
        title="Quitar imagen"
        aria-label="Quitar imagen adjunta"
      >
        <X className="w-3 h-3" />
      </button>
    </div>
  );
}
