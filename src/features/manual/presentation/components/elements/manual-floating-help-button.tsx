"use client";

import React from "react";
import Link from "next/link";
import { HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ManualFloatingHelpButtonProps {
  className?: string;
}

/**
 * Botón flotante accesible ("pelotita flotando") para la esquina inferior derecha.
 * Provee acceso rápido y persistente al manual de usuario y documentación pública.
 */
export function ManualFloatingHelpButton({
  className,
}: ManualFloatingHelpButtonProps) {
  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-40 group flex items-center select-none",
        className
      )}
    >
      {/* Tooltip flotante a la izquierda de la pelotita */}
      <div
        role="tooltip"
        className="mr-3 px-3 py-1.5 rounded-lg bg-[#18191e] border border-white/10 text-xs font-medium text-slate-200 shadow-xl opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity duration-200 pointer-events-none whitespace-nowrap hidden sm:block"
      >
        <span>Manual y Documentación</span>
        <div className="absolute right-[-4px] top-1/2 -translate-y-1/2 w-2 h-2 bg-[#18191e] border-t border-r border-white/10 rotate-45" />
      </div>

      {/* Botón flotante circular ("Pelotita") */}
      <Link
        href="/manual"
        aria-label="Abrir manual de usuario y documentación"
        className="w-12 h-12 rounded-full bg-[#18191e]/95 hover:bg-[#23252d] border border-white/15 hover:border-indigo-500/50 text-indigo-300 hover:text-white shadow-2xl shadow-black/80 flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 cursor-pointer"
      >
        <HelpCircle className="w-5 h-5 text-indigo-300 group-hover:text-indigo-200 transition-colors" />
      </Link>
    </div>
  );
}
