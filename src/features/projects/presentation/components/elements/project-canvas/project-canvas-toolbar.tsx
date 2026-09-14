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
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { RelationPickerPopover } from "@/features/diagram/presentation/components/elements/diagram-canvas/relations/relation-picker-popover";

export type CanvasTool =
  | "cursor"
  | "select"
  | "hand"
  | "create-class"
  | "relation";

type ProjectCanvasToolbarProps = {
  activeTool: CanvasTool;
  isTemporaryHand: boolean;
  canEdit?: boolean;
  onSelectTool: (tool: CanvasTool) => void;
};

/**
 * Barra de herramientas flotante vertical derecha, fiel al diseño de Stitch.
 * Proporciona selección de herramientas de navegación, creación de clases y relaciones UML.
 */
export function ProjectCanvasToolbar({
  activeTool,
  isTemporaryHand,
  canEdit = false,
  onSelectTool,
}: ProjectCanvasToolbarProps) {
  const isRelationPickerOpen = useAppStore((s) => s.isRelationPickerOpen);
  const setRelationPickerOpen = useAppStore((s) => s.setRelationPickerOpen);
  const activeRelationPreset = useAppStore((s) => s.activeRelationPreset);

  if (!canEdit) {
    return null;
  }

  const isHandActive = isTemporaryHand || activeTool === "hand";
  const isCursorActive = !isTemporaryHand && activeTool === "cursor";
  const isSelectActive = !isTemporaryHand && activeTool === "select";
  const isCreateClassActive = !isTemporaryHand && activeTool === "create-class";
  const isRelationActive =
    !isTemporaryHand &&
    (activeTool === "relation" ||
      isRelationPickerOpen ||
      activeRelationPreset !== null);

  const getButtonClass = (isActive: boolean) =>
    cn(
      "w-9 h-9 rounded-full flex items-center justify-center transition active:scale-95 cursor-pointer select-none",
      isActive
        ? "bg-white text-[#191a1d] shadow-md"
        : "text-white hover:bg-white/10 hover:text-white"
    );

  return (
    <div className="fixed right-5 top-1/2 -translate-y-1/2 z-30 flex items-center gap-3 pointer-events-auto">
      {/* Panel Flotante de Relaciones UML */}
      <RelationPickerPopover />

      {/* Barra vertical de herramientas (Pill) */}
      <aside aria-label="Herramientas del lienzo">
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

          {/* Relaciones UML */}
          {canEdit && (
            <button
              type="button"
              data-relation-toolbar-button="true"
              onClick={() => {
                setRelationPickerOpen(!isRelationPickerOpen);
              }}
              className={getButtonClass(isRelationActive)}
              title="Relaciones UML (R)"
              aria-label="Relaciones UML (R)"
              aria-pressed={isRelationActive}
            >
              <Network className="w-4 h-4" />
            </button>
          )}

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
    </div>
  );
}
