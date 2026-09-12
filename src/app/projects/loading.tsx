import { AppHeader } from "@/features/shared/presentation/components/layout/app-header";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga estructural para el catálogo de Projects (/projects).
 * Mantiene la composición visual con encabezado, hero de dos líneas, controles y cuadrícula de tarjetas.
 */
export default function ProjectsLoading() {
  return (
    <div className="relative min-h-svh flex flex-col antialiased bg-[#121316] text-slate-200 overflow-x-hidden">
      {/* Sombra / degradado superior translúcido */}
      <div className="fixed top-0 inset-x-0 h-28 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none z-30" />

      {/* Encabezado */}
      <AppHeader />

      {/* Esqueleto del contenido */}
      <main className="relative z-10 flex-1 max-w-6xl w-full mx-auto px-6 py-12 flex flex-col items-center">
        {/* Cabecera / Hero */}
        <section className="w-full flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10 pt-4">
          <div className="space-y-2">
            <Skeleton className="h-8 sm:h-9 w-64 sm:w-80 rounded-lg bg-white/10" />
            <Skeleton className="h-8 sm:h-9 w-36 sm:w-44 rounded-lg bg-white/10" />
          </div>
          <div className="flex flex-row items-center gap-3">
            <Skeleton className="h-10 w-36 rounded-full bg-white/10" />
            <Skeleton className="h-10 w-44 rounded-full bg-white/10" />
          </div>
        </section>

        {/* Controles de filtro: Pestañas y Buscador */}
        <div className="w-full flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-white/5 pb-4 mb-6">
          <Skeleton className="h-9 w-64 rounded-full bg-white/10" />
          <Skeleton className="h-9 w-64 rounded-full bg-white/10" />
        </div>

        {/* Cuadrícula de tarjetas simuladas */}
        <section className="w-full" aria-label="Cargando proyectos">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div
                key={index}
                className="h-72 rounded-2xl bg-[#17181d] border border-white/10 overflow-hidden flex flex-col"
              >
                <Skeleton className="h-44 w-full rounded-none bg-white/5" />
                <div className="p-4 pt-3 flex-1 flex flex-col justify-between -mt-8 relative z-10 space-y-3">
                  <div className="space-y-2">
                    <Skeleton className="h-5 w-3/4 rounded bg-white/10" />
                    <Skeleton className="h-3.5 w-full rounded bg-white/5" />
                    <Skeleton className="h-3.5 w-2/3 rounded bg-white/5" />
                  </div>
                  <div className="pt-3 border-t border-white/5 flex items-center justify-between">
                    <Skeleton className="h-3 w-24 rounded bg-white/5" />
                    <Skeleton className="h-4 w-16 rounded-full bg-white/5" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
