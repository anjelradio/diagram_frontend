import React, { Suspense } from "react";
import { BackgroundGlow } from "@/features/auth/presentation/components/elements/background-glow";
import { InteractiveDotPattern } from "@/features/shared/presentation/components/layout/interactive-dot-pattern";
import { ManualHeader } from "../elements/manual-header";
import { ManualNavbar } from "../elements/manual-navbar";
import { ManualSectionCard } from "../elements/manual-section-card";
import { MANUAL_DOCUMENT } from "../../constants/manual-content.constants";
import { BookOpen, Sparkles } from "lucide-react";

export function ManualView() {
  return (
    <div className="relative min-h-svh flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200 bg-[#121316] text-slate-200 overflow-x-hidden">
      {/* Resplandores ambientales dinámicos flotantes (Capa profunda) */}
      <BackgroundGlow />

      {/* Cuadrícula de puntos interactiva reactiva al cursor */}
      <InteractiveDotPattern />

      {/* Sombra / degradado superior translúcido de Stitch */}
      <div className="fixed top-0 inset-x-0 h-28 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none z-30" />

      {/* Encabezado fijo superior */}
      <Suspense fallback={null}>
        <ManualHeader />
      </Suspense>

      {/* Barra de navegación por anclajes sticky */}
      <ManualNavbar items={MANUAL_DOCUMENT.navigation} />

      {/* Área de contenido scrolleable */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-12">
        {/* Banner Hero Superior */}
        <section className="text-center space-y-4 pt-4 sm:pt-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium bg-indigo-500/10 text-indigo-300 border border-indigo-500/20 shadow-inner">
            <Sparkles className="w-3.5 h-3.5 text-indigo-400" />
            <span>Guía de Referencia y Documentación Oficial</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white max-w-3xl mx-auto leading-tight">
            Manual de Usuario y Capacidades de Diagram
          </h1>

          <p className="text-base sm:text-lg text-slate-400 max-w-2xl mx-auto leading-relaxed">
            Descubre cómo modelar diagramas de clases UML, colaborar con tu equipo en tiempo real,
            acelerar tu flujo con IA multimodal y exportar aplicaciones backend listas para producción.
          </p>
        </section>

        {/* Listado de Secciones Temáticas */}
        <div className="space-y-8 sm:space-y-12 pb-16">
          {MANUAL_DOCUMENT.sections.map((section) => (
            <ManualSectionCard key={section.id} section={section} />
          ))}
        </div>

        {/* Pie de página del manual */}
        <footer className="pt-8 pb-12 border-t border-white/10 text-center text-xs text-slate-500 space-y-2">
          <div className="flex items-center justify-center gap-2 text-slate-400 font-medium">
            <BookOpen className="w-4 h-4 text-indigo-400" />
            <span>Diagram · Plataforma de Modelado Arquitectónico</span>
          </div>
          <p>
            Versión {MANUAL_DOCUMENT.version} · Actualizado en {MANUAL_DOCUMENT.lastUpdated}
          </p>
        </footer>
      </main>
    </div>
  );
}
