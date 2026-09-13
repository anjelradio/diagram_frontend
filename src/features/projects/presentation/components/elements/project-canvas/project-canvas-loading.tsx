import { Skeleton } from "@/components/ui/skeleton";

/**
 * Estado de carga estructural exclusivo para la ruta dinámica del lienzo (/projects/[projectId]).
 * Mantiene la cuadrícula infinita de puntos y esqueletos minimalistas de encabezado,
 * barra de herramientas y controles de zoom.
 */
export function ProjectCanvasLoading() {
  return (
    <div
      className="relative w-full h-screen overflow-hidden select-none bg-[#212224]"
      style={{
        backgroundImage:
          "radial-gradient(rgba(255, 255, 255, 0.12) 1.25px, transparent 1.25px)",
        backgroundSize: "24px 24px",
      }}
    >
      {/* Sombra / degradado superior sutil y continuo sin líneas de corte */}
      <div
        className="fixed top-0 inset-x-0 h-36 pointer-events-none z-20 select-none"
        style={{
          background:
            "linear-gradient(to bottom, rgba(33, 34, 36, 0.7) 0%, rgba(33, 34, 36, 0.45) 30%, rgba(33, 34, 36, 0.2) 60%, rgba(33, 34, 36, 0.05) 85%, transparent 100%)",
        }}
      />

      {/* Encabezado flotante esqueleto */}
      <header className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between py-3 px-5 pointer-events-none">
        {/* Izquierda: Menú y título del proyecto */}
        <div className="flex items-center space-x-3 pointer-events-auto">
          <Skeleton className="w-9 h-9 rounded-full bg-[#191a1d] border border-white/10" />
          <Skeleton className="h-8 w-48 sm:w-64 rounded-full bg-[#191a1d] border border-white/10" />
        </div>

        {/* Derecha: Acciones y avatar */}
        <div className="flex items-center space-x-2.5 pointer-events-auto">
          <Skeleton className="h-8 w-24 rounded-full bg-[#191a1d] border border-white/10 hidden sm:block" />
          <Skeleton className="h-8 w-20 rounded-full bg-blue-600/30 border border-blue-500/20" />
          <Skeleton className="h-9 w-20 rounded-full bg-[#191a1d] border border-white/10" />
        </div>
      </header>

      {/* Barra de herramientas derecha esqueleto */}
      <aside className="fixed right-5 top-1/2 -translate-y-1/2 z-30 pointer-events-none">
        <div className="bg-[#191a1d] border border-white/10 rounded-full p-1.5 flex flex-col items-center gap-1.5 shadow-xl">
          <Skeleton className="w-9 h-9 rounded-full bg-white/5" />
          <Skeleton className="w-9 h-9 rounded-full bg-white/5" />
          <div className="w-5 h-[1px] bg-white/15 my-0.5 rounded-full" />
          <Skeleton className="w-9 h-9 rounded-full bg-white/10" />
          <Skeleton className="w-9 h-9 rounded-full bg-white/5" />
          <Skeleton className="w-9 h-9 rounded-full bg-white/5" />
        </div>
      </aside>

      {/* Barra inferior esqueleto */}
      <footer className="fixed bottom-6 left-0 right-0 z-30 px-5 flex items-center justify-between pointer-events-none">
        {/* Izquierda: Registro de agente */}
        <Skeleton className="h-8 w-36 rounded-full bg-[#191a1d] border border-white/10" />

        {/* Derecha: Deshacer/rehacer y porcentaje de zoom */}
        <div className="flex items-center gap-2.5">
          <Skeleton className="h-8 w-20 rounded-full bg-[#191a1d] border border-white/10" />
          <Skeleton className="h-8 w-14 rounded-full bg-[#191a1d] border border-white/10" />
        </div>
      </footer>

      {/* Esqueleto central de tarjeta de clase con atributos */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none">
        <div className="w-[240px] bg-[#17181d]/80 rounded-xl border border-white/10 p-3 shadow-2xl backdrop-blur-sm">
          {/* Cabecera */}
          <div className="flex items-center gap-2.5 pb-2">
            <Skeleton className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30" />
            <Skeleton className="h-4 w-28 bg-white/10 rounded" />
          </div>
          {/* Divisor */}
          <div className="border-t border-white/10 mb-2" />
          {/* Subtítulo Atributos */}
          <div className="flex items-center justify-between px-1 pb-1.5">
            <Skeleton className="h-3 w-14 bg-white/5 rounded" />
            <Skeleton className="h-3 w-5 bg-white/5 rounded" />
          </div>
          {/* Filas de atributos */}
          <div className="space-y-1.5 px-1">
            {/* Fila PK */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3.5 w-6 bg-amber-400/20 rounded" />
                <Skeleton className="h-3 w-10 bg-white/10 rounded" />
              </div>
              <Skeleton className="h-3 w-10 bg-indigo-500/20 rounded" />
            </div>
            {/* Fila 2 */}
            <div className="flex items-center justify-between py-1">
              <div className="flex items-center gap-2">
                <Skeleton className="h-3 w-3 bg-white/5 rounded" />
                <Skeleton className="h-3 w-16 bg-white/10 rounded" />
              </div>
              <Skeleton className="h-3 w-12 bg-white/5 rounded" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
