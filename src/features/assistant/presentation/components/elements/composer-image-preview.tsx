"use client";

import { X } from "lucide-react";
import type { MultimodalDraftAttachment } from "@/features/assistant/domain/entities/multimodal-draft.entity";

type ComposerImagePreviewProps = {
  attachment: MultimodalDraftAttachment;
  onRemove: () => void;
  onPreview: (url: string) => void;
  disabled?: boolean;
};

export function ComposerImagePreview({ attachment, onRemove, onPreview, disabled = false }: ComposerImagePreviewProps) {
  return (
    <div className="relative w-fit p-1">
      <button
        type="button"
        onClick={() => onPreview(attachment.previewUrl)}
        className="size-16 overflow-hidden rounded-xl border border-white/10 bg-black/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        aria-label="Ver imagen adjunta en tamaño completo"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={attachment.previewUrl} alt={attachment.name || "Imagen adjunta"} className="size-full object-cover" />
      </button>
      <button
        type="button"
        onClick={onRemove}
        disabled={disabled}
        className="absolute right-0 top-0 flex size-5 items-center justify-center rounded-full border border-black/30 bg-zinc-700 text-white shadow-md transition hover:bg-red-600 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
        aria-label="Quitar imagen adjunta"
        title="Quitar imagen"
      >
        <X className="size-3" aria-hidden="true" />
      </button>
    </div>
  );
}
