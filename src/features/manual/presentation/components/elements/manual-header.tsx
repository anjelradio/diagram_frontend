"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, LogIn } from "lucide-react";
import { authClient } from "@/lib/auth-client";

export function ManualHeader() {
  const router = useRouter();
  const { data: session } = authClient.useSession();
  const isAuthenticated = !!session?.user;

  const returnUrl = isAuthenticated ? "/projects" : "/auth/login";

  const handleBack = () => {
    // Si hay historial en la misma sesión, podemos usar back; si no, redirigir al entorno de origen
    if (typeof window !== "undefined" && window.history.length > 1 && document.referrer) {
      router.back();
    } else {
      router.push(returnUrl);
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-gradient-to-b from-black/80 via-black/40 to-transparent backdrop-blur-[4px] border-b border-white/5">
      <div className="mx-auto flex h-16 sm:h-20 max-w-6xl items-center justify-between px-4 sm:px-6">
        {/* Identidad / Marca con enlace inteligente */}
        <div className="flex items-center gap-3">
          <Link
            href={returnUrl}
            className="flex items-center gap-2.5 cursor-pointer select-none group"
            title="Ir a la pantalla principal"
          >
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform duration-200">
              <BookOpen className="w-4 h-4 text-indigo-300" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white group-hover:text-indigo-200 transition-colors">
              Diagram
            </span>
          </Link>
          <span className="hidden sm:inline-block text-xs font-medium px-2 py-0.5 rounded-full bg-white/5 text-slate-400 border border-white/10">
            Manual de Usuario
          </span>
        </div>

        {/* Acciones del encabezado */}
        <div className="flex items-center gap-2.5 sm:gap-3 select-none">
          <button
            type="button"
            onClick={handleBack}
            className="inline-flex items-center gap-1.5 sm:gap-2 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium text-slate-200 bg-[#17181d]/80 hover:bg-[#202127] border border-white/10 hover:border-indigo-500/40 transition-all duration-200 shadow-sm active:scale-95 cursor-pointer"
            title="Volver a la vista previa"
          >
            <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            <span>Volver</span>
          </button>

          {!isAuthenticated ? (
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium text-white bg-indigo-600 hover:bg-indigo-500 transition-all duration-200 shadow-md shadow-indigo-600/20 active:scale-95"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Iniciar sesión</span>
            </Link>
          ) : (
            <Link
              href="/projects"
              className="inline-flex items-center gap-1.5 px-3.5 sm:px-4 py-1.5 sm:py-2 rounded-full text-xs sm:text-[13px] font-medium text-white bg-white/10 hover:bg-white/15 border border-white/10 transition-all duration-200 active:scale-95"
            >
              <span>Ir a Proyectos</span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
