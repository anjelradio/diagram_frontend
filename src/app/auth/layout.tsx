import { Suspense, type ReactNode } from "react";
import { AuthHeader } from "@/features/auth/presentation/components/elements/auth-header";
import { BackgroundGlow } from "@/features/auth/presentation/components/elements/background-glow";
import { InteractiveDotPattern } from "@/features/shared/presentation/components/layout/interactive-dot-pattern";

/**
 * Layout de Next.js para todas las rutas bajo /auth/*.
 * Proporciona:
 * - Resplandores ambientales dinámicos en movimiento (BackgroundGlow).
 * - Matriz de puntos interactiva que se ilumina con colores de aurora boreal al mover el ratón (InteractiveDotPattern).
 * - Sombra y degradado superior de Stitch.
 * - Encabezado contextual dinámico (AuthHeader).
 * - Contenedor responsivo centrado con escala de lectura óptima.
 */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-svh flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200 bg-[#121316] text-slate-200 overflow-x-hidden">
      {/* Resplandores ambientales dinámicos flotantes (Capa profunda) */}
      <BackgroundGlow />

      {/* Cuadrícula de puntos interactiva reactiva al cursor */}
      <InteractiveDotPattern />

      {/* Sombra / degradado superior translúcido de Stitch */}
      <div className="fixed top-0 inset-x-0 h-28 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none z-30" />

      {/* Encabezado con marca Diagram y acción contextual variable según la ruta */}
      <Suspense fallback={null}>
        <AuthHeader />
      </Suspense>


      {/* Área principal centrada y responsiva con escala proporcionada */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 py-8 sm:py-12 flex flex-col items-center justify-center">
        <div className="w-full max-w-[465px] my-auto pt-2 sm:pt-4 pb-8 sm:pb-12">
          <div className="relative p-2 sm:p-8">
            {children}
          </div>
        </div>
      </main>
    </div>
  );
}
