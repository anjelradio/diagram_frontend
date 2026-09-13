"use client";

import {
  BoxSelect,
  Hand,
  Image as ImageIcon,
  MousePointer2,
  Network,
  SquarePlus,
  Type,
} from "lucide-react";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";
import { cn } from "@/lib/utils";
export type CanvasTool = "cursor" | "select" | "hand" | "create-class";

type ProjectCanvasToolbarProps = {
  activeTool: CanvasTool;
  isTemporaryHand: boolean;
  canEdit?: boolean;
  onSelectTool: (tool: CanvasTool) => void;
};

/**
 * Barra de herramientas flotante vertical derecha, fiel al diseño de Stitch.
 * Proporciona selección de herramientas de navegación y creación de clases.
 */
export function ProjectCanvasToolbar({
  activeTool,
  isTemporaryHand,
  canEdit = false,
  onSelectTool,
}: ProjectCanvasToolbarProps) {
  const isHandActive = isTemporaryHand || activeTool === "hand";
  const isCursorActive = !isTemporaryHand && activeTool === "cursor";
  const isSelectActive = !isTemporaryHand && activeTool === "select";
  const isCreateClassActive = !isTemporaryHand && activeTool === "create-class";

  const getButtonClass = (isActive: boolean) =>
    cn(
      "w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer select-none",
      isActive
        ? "bg-white text-[#191a1d] shadow-md"
        : "text-white hover:bg-white/10 hover:text-white"
    );

  return (
    <aside
      aria-label="Herramientas del lienzo"
      className="fixed right-5 top-1/2 -translate-y-1/2 z-30 pointer-events-auto"
    >
      <div className="bg-[#191a1d] border border-white/10 shadow-xl rounded-full p-1.5 flex flex-col items-center gap-1.5 flex-shrink-0">
        {/* Nueva Clase UML (Creación activa para editores) */}
        {canEdit && (
          <button
            type="button"
            onClick={() => onSelectTool("create-class")}
            className={getButtonClass(isCreateClassActive)}
            title="Nueva Clase UML (+)"
            aria-label="Nueva Clase UML (Herramienta +)"
            aria-pressed={isCreateClassActive}
          >
            <SquarePlus className="w-4 h-4" />
          </button>
        )}

        {/* Relaciones UML (Próximamente) */}
        <button
          type="button"
          onClick={() =>
            appToast.info("El catálogo de relaciones UML estará disponible próximamente.")
          }
          className={getButtonClass(false)}
          title="Relaciones UML (Próximamente)"
          aria-label="Relaciones UML (Próximamente)"
        >
          <Network className="w-4 h-4" />
        </button>

        {/* Separador */}
        <div className="w-5 h-[1px] bg-white/15 my-0.5 rounded-full" />

        {/* Herramienta 1: Puntero / Cursor (V) */}
        <button
          type="button"
          onClick={() => onSelectTool("cursor")}
          className={getButtonClass(isCursorActive)}
          title="Seleccionar / Puntero (V)"
          aria-label="Seleccionar / Puntero (Atajo: V)"
          aria-pressed={isCursorActive}
        >
          <MousePointer2 className="w-4 h-4" />
        </button>

        {/* Herramienta 2: Marco de selección (M) */}
        <button
          type="button"
          onClick={() => onSelectTool("select")}
          className={getButtonClass(isSelectActive)}
          title="Marco de selección (M)"
          aria-label="Marco de selección (Atajo: M)"
          aria-pressed={isSelectActive}
        >
          <BoxSelect className="w-4 h-4" />
        </button>

        {/* Herramienta 3: Mano / Mover lienzo (Espacio) */}
        <button
          type="button"
          onClick={() => onSelectTool("hand")}
          className={getButtonClass(isHandActive)}
          title="Mover lienzo (Espacio)"
          aria-label="Mover lienzo (Atajo: Espacio)"
          aria-pressed={isHandActive}
        >
          <Hand className="w-4 h-4" />
        </button>

        {/* Texto (Próximamente) */}
        <button
          type="button"
          onClick={() =>
            appToast.info("La herramienta de texto estará disponible próximamente.")
          }
          className={getButtonClass(false)}
          title="Insertar texto (Próximamente)"
          aria-label="Insertar texto (Próximamente)"
        >
          <Type className="w-4 h-4" />
        </button>

        {/* Imagen (Próximamente) */}
        <button
          type="button"
          onClick={() =>
            appToast.info("La inserción de imágenes estará disponible próximamente.")
          }
          className={getButtonClass(false)}
          title="Insertar imagen (Próximamente)"
          aria-label="Insertar imagen (Próximamente)"
        >
          <ImageIcon className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}
