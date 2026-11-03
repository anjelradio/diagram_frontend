"use client";

import React, { useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ImageViewerModalProps {
  /** Indica si el visor modal se encuentra visible */
  isOpen: boolean;
  /** URL de la imagen a renderizar en alta resolución */
  imageUrl: string | null;
  /** Texto alternativo para accesibilidad */
  imageAlt?: string;
  /** Callback para cerrar el visor */
  onClose: () => void;
  /** Clases CSS adicionales */
  className?: string;
}

export function ImageViewerModal({
  isOpen,
  imageUrl,
  imageAlt = "Visualización de imagen del asistente",
  onClose,
  className,
}: ImageViewerModalProps) {
  // Listener de tecla Escape para cerrar el visor
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Visor modal de imagen"
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-10 select-none animate-in fade-in duration-200",
        className
      )}
    >
      {/* Fondo gris / oscuro semitransparente con desenfoque suave */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm cursor-pointer"
        aria-hidden="true"
      />

      {/* Botón de cierre superior derecho */}
      <button
        type="button"
        onClick={onClose}
        className="fixed top-5 right-5 z-50 w-10 h-10 rounded-full bg-zinc-800/90 hover:bg-zinc-700 text-zinc-300 hover:text-white flex items-center justify-center transition-colors shadow-xl border border-white/10 cursor-pointer focus:outline-none focus:ring-2 focus:ring-white/20"
        aria-label="Cerrar visor de imagen"
        title="Cerrar (Escape)"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Contenedor de la imagen centrada sin recortar */}
      <div className="relative z-10 max-w-[90vw] max-h-[85vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl border border-white/10 bg-[#191a1d]">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={imageAlt}
          className="w-auto h-auto max-w-[90vw] max-h-[85vh] object-contain rounded-2xl"
        />
      </div>
    </div>
  );
}
