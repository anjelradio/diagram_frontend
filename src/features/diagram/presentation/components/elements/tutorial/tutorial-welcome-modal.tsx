"use client";

import React from "react";
import Image from "next/image";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Sparkles, ArrowRight } from "lucide-react";

export interface TutorialWelcomeModalProps {
  open: boolean;
  onStartTutorial: () => void;
  onSkipTutorial: () => void;
}

/**
 * Modal de bienvenida al tutorial con el mismo estilo visual de Notion/Neon:
 * Imagen superior envolvente (/images/tutorial.webp), sin botón 'X',
 * botón blanco "Comenzar tutorial" y enlace sutil "Ignorar tutorial".
 */
export function TutorialWelcomeModal({
  open,
  onStartTutorial,
  onSkipTutorial,
}: TutorialWelcomeModalProps) {
  return (
    <Dialog open={open} onOpenChange={(isOpen) => (!isOpen ? onSkipTutorial() : null)}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-[520px] sm:max-w-[540px] p-0 gap-0 overflow-hidden rounded-3xl border border-white/10 bg-[#131418] text-slate-200 shadow-[0_30px_70px_rgba(0,0,0,0.85)] z-50 select-none"
      >
        <DialogTitle className="sr-only">
          Bienvenido al tutorial interactivo
        </DialogTitle>

        {/* Cabecera con imagen tutorial.webp a sangre */}
        <div className="relative w-full h-56 sm:h-64 overflow-hidden bg-black select-none">
          <Image
            src="/images/tutorial.webp"
            alt="Cabecera del tutorial"
            fill
            className="object-cover object-center"
            priority
          />
          {/* Difuminado suave hacia la superficie inferior (#131418) */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#131418] via-[#131418]/50 to-transparent pointer-events-none" />
        </div>

        {/* Cuerpo del modal */}
        <div className="px-7 pt-4 pb-7 flex flex-col items-center text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold mb-3">
            <Sparkles className="w-3.5 h-3.5" />
            <span>Guía interactiva</span>
          </div>

          <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white mb-2">
            ¡Te damos la bienvenida a tu lienzo!
          </h2>

          <p className="text-sm text-slate-400 max-w-md leading-relaxed mb-6">
            Aprende en solo 2 minutos a crear tus clases, conectarlas con relaciones UML, interactuar con tu asistente inteligente y descubrir las integraciones disponibles.
          </p>

          {/* Botón blanco Comenzar tutorial */}
          <button
            type="button"
            onClick={onStartTutorial}
            className="w-full py-3 px-5 rounded-xl bg-white hover:bg-slate-100 text-[#131418] font-bold text-sm shadow-lg shadow-white/10 flex items-center justify-center gap-2 transition active:scale-[0.98] cursor-pointer"
          >
            <span>Comenzar tutorial</span>
            <ArrowRight className="w-4 h-4 text-[#131418]" />
          </button>

          {/* Enlace sutil Ignorar tutorial */}
          <button
            type="button"
            onClick={onSkipTutorial}
            className="mt-3.5 text-xs text-slate-400 hover:text-slate-200 transition-colors py-1 px-3 cursor-pointer"
          >
            No deseo tomar el tutorial por ahora
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
