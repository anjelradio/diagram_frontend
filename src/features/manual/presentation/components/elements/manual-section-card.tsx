import React from "react";
import type { ManualSection } from "@/features/manual/domain/entities/manual-section.entity";
import { ManualIcon } from "./manual-icon";
import { MousePointerClick, Lightbulb, Keyboard } from "lucide-react";

interface ManualSectionCardProps {
  section: ManualSection;
}

export function ManualSectionCard({ section }: ManualSectionCardProps) {
  return (
    <section
      id={section.id}
      className="scroll-mt-24 rounded-2xl bg-[#16171b]/90 border border-white/10 p-6 sm:p-8 backdrop-blur-md shadow-2xl transition-all duration-300 hover:border-white/20"
    >
      {/* Encabezado de la Sección */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-indigo-500/10 border border-indigo-500/30 flex items-center justify-center text-indigo-400 shrink-0 shadow-inner">
            <ManualIcon name={section.iconName} className="w-6 h-6" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
                {section.title}
              </h2>
              {section.badge ? (
                <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">
                  {section.badge}
                </span>
              ) : null}
            </div>
            <p className="mt-1 text-sm text-slate-400">{section.subtitle}</p>
          </div>
        </div>
      </div>

      {/* Resumen / Introducción */}
      <div className="pt-2">
        <p className="text-sm sm:text-base leading-relaxed text-slate-300 font-normal">
          {section.summary}
        </p>
      </div>

      {/* Pasos de Uso y "¿Dónde hacer clic?" */}
      {section.steps && section.steps.length > 0 ? (
        <div className="space-y-4 pt-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-2">
            <MousePointerClick className="w-4 h-4 text-indigo-400" />
            <span>Guía Paso a Paso y Dónde Hacer Clic</span>
          </h3>

          <div className="grid gap-4 sm:grid-cols-2">
            {section.steps.map((step) => (
              <div
                key={step.stepNumber}
                className="flex flex-col justify-between rounded-xl bg-[#1c1d22]/80 border border-white/5 p-4 sm:p-5 hover:border-indigo-500/20 transition-all duration-200"
              >
                <div>
                  <div className="flex items-center gap-2.5 mb-2">
                    <span className="flex items-center justify-center w-6 h-6 rounded-full bg-indigo-600/30 text-indigo-300 text-xs font-bold border border-indigo-500/30">
                      {step.stepNumber}
                    </span>
                    <h4 className="text-sm font-semibold text-white">
                      {step.title}
                    </h4>
                  </div>
                  <p className="text-xs sm:text-[13px] text-slate-400 leading-relaxed">
                    {step.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-white/5 space-y-1.5">
                  {step.clickTarget ? (
                    <div className="flex items-start gap-1.5 text-[11px] text-indigo-300/90 font-mono bg-indigo-950/30 border border-indigo-500/10 px-2.5 py-1.5 rounded-md">
                      <MousePointerClick className="w-3.5 h-3.5 text-indigo-400 shrink-0 mt-0.5" />
                      <span>{step.clickTarget}</span>
                    </div>
                  ) : null}

                  {step.shortcut ? (
                    <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-mono px-1">
                      <Keyboard className="w-3.5 h-3.5 text-slate-500 shrink-0" />
                      <span>
                        Atajo:{" "}
                        <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-white font-semibold">
                          {step.shortcut}
                        </kbd>
                      </span>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Características Destacadas */}
      {section.features && section.features.length > 0 ? (
        <div className="pt-2">
          <div className="grid gap-3 sm:grid-cols-2">
            {section.features.map((feat, idx) => (
              <div
                key={idx}
                className="flex items-start gap-3 rounded-lg bg-white/[0.02] border border-white/5 p-3.5"
              >
                <div className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-slate-300 shrink-0">
                  <ManualIcon name={feat.iconName} className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-xs sm:text-sm font-medium text-white">
                    {feat.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-0.5 leading-snug">
                    {feat.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {/* Tips / Consejos Prácticos */}
      {section.tips && section.tips.length > 0 ? (
        <div className="space-y-2 pt-2">
          {section.tips.map((tip, idx) => (
            <div
              key={idx}
              className="flex items-start gap-2.5 rounded-lg bg-amber-500/10 border border-amber-500/20 px-4 py-3 text-xs sm:text-sm text-amber-200/90"
            >
              <Lightbulb className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
              <span>{tip}</span>
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
