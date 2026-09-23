"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { joinProjectAction } from "@/features/collaboration/presentation/actions/invitation.action";

type ProjectJoinViewProps = {
  code: string;
};

/**
 * Vista de transición para la unión a un proyecto mediante código de invitación.
 * Reproduce fielmente el diseño de design/join.html con fondo de matriz de puntos,
 * animación de carga con aura pulsante y orquestación automática del join hacia el lienzo.
 */
export function ProjectJoinView({ code }: ProjectJoinViewProps) {
  const router = useRouter();
  const hasExecutedRef = useRef(false);

  useEffect(() => {
    if (hasExecutedRef.current) return;
    hasExecutedRef.current = true;

    async function processJoin() {
      try {
        const result = await joinProjectAction(code);
        if (result.ok) {
          if (result.data?.projectId) {
            appToast.success("¡Te has unido al proyecto exitosamente!");
            router.push(`/projects/${result.data.projectId}`);
            return;
          }
        }
        const errorMessage =
          !result.ok && result.errors?.[0]
            ? result.errors[0]
            : "El código de invitación es inválido o ha expirado.";
        appToast.error(errorMessage);
        router.push("/projects");
      } catch {
        appToast.error("Ocurrió un error inesperado al unirse al proyecto.");
        router.push("/projects");
      }
    }

    processJoin();
  }, [code, router]);

  return (
    <div
      className="min-h-screen text-slate-200 antialiased font-sans flex flex-col selection:bg-indigo-500/30 selection:text-indigo-200"
      style={{
        backgroundColor: "rgb(18, 19, 22)",
        backgroundImage:
          "radial-gradient(rgba(255, 255, 255, 0.08) 1px, transparent 1px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Barra superior minimalista */}
      <div className="fixed top-0 inset-x-0 h-28 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none z-30" />
      <header className="w-full bg-transparent sticky top-0 z-40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5 cursor-pointer select-none group">
            <span className="text-lg font-bold tracking-tight text-white">
              Diagram
            </span>
          </div>
        </div>
      </header>

      {/* Contenido Principal con Animación de Carga */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-md my-auto flex flex-col items-center text-center px-4">
          <div className="relative mb-8 flex items-center justify-center">
            {/* Aura pulsante de fondo */}
            <div className="absolute w-24 h-24 rounded-full bg-indigo-500/15 blur-xl animate-pulse pointer-events-none" />

            {/* Spinner animado con gradiente */}
            <div className="relative w-16 h-16">
              <svg
                className="w-16 h-16 animate-spin text-indigo-500/20"
                fill="none"
                viewBox="0 0 64 64"
              >
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <svg
                className="absolute inset-0 w-16 h-16 animate-spin"
                fill="none"
                viewBox="0 0 64 64"
              >
                <defs>
                  <linearGradient
                    id="join-spin-gradient"
                    x1="0%"
                    y1="0%"
                    x2="100%"
                    y2="100%"
                  >
                    <stop offset="0%" stopColor="#818cf8" />
                    <stop offset="50%" stopColor="#6366f1" />
                    <stop
                      offset="100%"
                      stopColor="#c0c1ff"
                      stopOpacity="0"
                    />
                  </linearGradient>
                </defs>
                <circle
                  cx="32"
                  cy="32"
                  r="26"
                  stroke="url(#join-spin-gradient)"
                  strokeDasharray="90 140"
                  strokeLinecap="round"
                  strokeWidth="4"
                />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_10px_#818cf8]" />
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-bold text-white tracking-tight mb-2.5">
            Uniéndote a la sala...
          </h1>
          <p className="text-xs text-slate-400 font-normal leading-relaxed max-w-xs mb-6">
            Verificando código de invitación y preparando el lienzo en tiempo real
            <span className="inline-flex ml-1 animate-pulse font-bold text-indigo-400">
              ...
            </span>
          </p>
        </div>
      </main>
    </div>
  );
}
