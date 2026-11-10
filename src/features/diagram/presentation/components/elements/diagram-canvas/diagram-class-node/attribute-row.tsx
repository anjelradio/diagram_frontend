"use client";

import { memo, useRef, useState, useEffect } from "react";
import { GripVertical, KeyRound, Pencil } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiagramAttribute } from "@/features/diagram/domain/entities/diagram-attribute.entity";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { deriveDiagramAttributeCapabilities } from "@/features/diagram/domain/services/diagram-attribute-capabilities";
import { sendRealtimeMessage } from "@/features/realtime/infrastructure/websocket/realtime-socket";
import { AttributeTypePopover } from "./attribute-type-popover";
import { createUpdateDiagramAttribute } from "@/features/diagram/application/use-cases/update-diagram-attribute";

export type AttributeRowProps = {
  classId: string;
  attribute: DiagramAttribute;
  isSelected?: boolean;
  onSelect?: (attributeId: string) => void;
  // Selector accesible de tipo/nulabilidad
  renderTypeTrigger?: (attribute: DiagramAttribute) => React.ReactNode;
  // Drag and Drop (US3)
  dragHandleProps?: Record<string, unknown>;
  canEdit?: boolean;
};

/**
 * Fila de visualización de un atributo individual dentro de una clase de diagrama.
 * Distingue la llave primaria (PK) con KeyRound y bloquea cualquier edición sobre ella.
 * Permite edición inline por doble clic (Enter/blur/Escape) y configuración de tipo/nulabilidad,
 * con el mismo formato y experiencia de usuario que la cabecera de la clase.
 */
export const AttributeRow = memo(function AttributeRow({
  classId,
  attribute,
  isSelected = false,
  onSelect,
  renderTypeTrigger,
  dragHandleProps,
  canEdit: canEditProp,
}: AttributeRowProps) {
  const storeCanEdit = useAppStore((s) => s.canEdit);
  const classLock = useAppStore((s) => s.classLocks[classId]);
  const viewerId = useAppStore((s) => s.viewerId);
  const classReservation = useAppStore((s) =>
    s.getEffectiveComponentReservation(classId, "class")
  );
  const isAgentReserved = Boolean(classReservation?.isReserved);
  const isAttributeEditedByAgent = Boolean(
    isAgentReserved &&
    classReservation.activityType === "edit" &&
    classReservation.attributeId === attribute.id
  );
  const isLockedByOther = Boolean(classLock && classLock.userId !== viewerId);
  const canEdit = (canEditProp ?? storeCanEdit) && !isLockedByOther && !isAgentReserved;
  const isPk = attribute.isPrimaryKey;
  const isFk = Boolean(attribute.isForeignKey);
  const capabilities = deriveDiagramAttributeCapabilities(attribute, canEdit);

  const projectId = useAppStore((s) => s.projectId);
  const selectedAttribute = useAppStore((s) => s.selectedAttribute);
  const setSelectedAttribute = useAppStore((s) => s.setSelectedAttribute);
  const dispatchDiagramOperation = useAppStore((s) => s.dispatchDiagramOperation);

  // Estado para edición inline del nombre del atributo
  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(attribute.name);
  const inputRef = useRef<HTMLInputElement>(null);

  // Referencias y estado para efecto hover scroll en nombres largos desbordados
  const nameContainerRef = useRef<HTMLDivElement>(null);
  const nameTextRef = useRef<HTMLSpanElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const [overflowDistance, setOverflowDistance] = useState(0);

  useEffect(() => {
    if (isAgentReserved && isEditing) {
      setIsEditing(false);
      setNameValue(attribute.name);
    }
  }, [isAgentReserved, isEditing, attribute.name]);

  useEffect(() => {
    setNameValue(attribute.name);
    setIsHovered(false);
    setOverflowDistance(0);
  }, [attribute.name]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleMouseEnter = () => {
    if (isEditing) return;
    const container = nameContainerRef.current;
    const text = nameTextRef.current;
    if (!container || !text) return;

    const overflow = text.scrollWidth - container.clientWidth;
    if (overflow > 1) {
      setOverflowDistance(overflow);
      setIsHovered(true);
    } else {
      setOverflowDistance(0);
      setIsHovered(false);
    }
  };

  const handleMouseLeave = () => {
    setIsHovered(false);
  };

  const isMarqueeActive = isHovered && overflowDistance > 0 && !isEditing;
  const marqueeDuration = Math.min(Math.max(3, overflowDistance / 18), 8);

  const ensureClassLock = () => {
    if (!canEdit) return;
    const state = useAppStore.getState();
    if (!state.classLocks[classId] || state.classLocks[classId]?.userId !== viewerId) {
      sendRealtimeMessage({ type: "class_lock_acquire", class_id: classId });
    }
  };

  const isRowSelected =
    canEdit &&
    capabilities.canDelete &&
    (isSelected ||
      (selectedAttribute?.classId === classId &&
        selectedAttribute?.attributeId === attribute.id));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (capabilities.canDelete) {
      ensureClassLock();
      setSelectedAttribute({ classId, attributeId: attribute.id });
      onSelect?.(attribute.id);
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!capabilities.canRename) return;
    ensureClassLock();
    setIsEditing(true);
  };

  const handleCommit = async () => {
    if (!canEdit) {
      setNameValue(attribute.name);
      setIsEditing(false);
      return;
    }
    const trimmed = nameValue.trim();
    setIsEditing(false);

    if (!trimmed || trimmed === attribute.name) {
      setNameValue(attribute.name);
      return;
    }

    if (projectId && viewerId) {
      try {
        await createUpdateDiagramAttribute({ dispatch: dispatchDiagramOperation })(
          viewerId,
          projectId,
          classId,
          { attributeId: attribute.id, name: trimmed }
        );
      } catch (err) {
        console.error("Error al encolar renombrado de atributo:", err);
      }
    }
  };

  const handleCancel = () => {
    setNameValue(attribute.name);
    setIsEditing(false);
  };

  return (
    <div
      onClick={handleClick}
      onDoubleClick={(e) => {
        if (!capabilities.canRename) return;
        const target = e.target as HTMLElement | null;
        if (
          !target?.closest("button") &&
          !target?.closest('[role="button"]') &&
          !target?.closest('[data-slot="popover-trigger"]')
        ) {
          handleStartEdit(e);
        }
      }}
      className={cn(
        "group/attr flex items-center justify-between text-xs py-1.5 px-2.5 rounded-md transition-colors select-none",
        isRowSelected
          ? "bg-indigo-500/15 ring-1 ring-inset ring-indigo-500/45"
          : isAttributeEditedByAgent
            ? "bg-purple-950/40 ring-1 ring-inset ring-purple-500/50 text-purple-200"
          : canEdit ? "hover:bg-white/[0.045]" : "",
        capabilities.canRename || capabilities.canDelete ? "cursor-pointer" : "cursor-default"
      )}
      role="row"
      aria-label={`Atributo ${attribute.name}${isPk ? " Llave Primaria" : isFk ? " Llave Foránea" : ""}${isAttributeEditedByAgent ? " (Editando por el asistente)" : ""}`}
      tabIndex={capabilities.canDelete ? 0 : -1}
      onKeyDown={(e) => {
        if (capabilities.canDelete && (e.key === "Enter" || e.key === " ")) {
          e.stopPropagation();
          ensureClassLock();
          setSelectedAttribute({ classId, attributeId: attribute.id });
          onSelect?.(attribute.id);
        }
      }}
    >
      {/* Zona izquierda: estado de clave y nombre */}
      <div className="flex items-center gap-1.5 min-w-0 flex-1 mr-3">
        {isAttributeEditedByAgent && (
          <span
            title="Atributo en edición por el asistente"
            className="inline-flex items-center gap-1 text-[9px] font-medium text-purple-300 bg-purple-950/80 px-1 py-0.5 rounded border border-purple-500/40 select-none flex-shrink-0"
          >
            <Pencil className="h-2 w-2 text-purple-400 motion-reduce:animate-none animate-pulse" aria-hidden="true" />
            <span>Editando</span>
          </span>
        )}
        {isPk ? (
          <span
            title="Llave primaria (UUID inmutable)"
            className="inline-flex h-[18px] items-center justify-center gap-1 rounded-md px-1.5 text-[9px] font-sans font-semibold tracking-[-0.01em] flex-shrink-0 select-none shadow-sm bg-orange-500/30 text-amber-300 shadow-orange-950/20"
          >
            <KeyRound className="h-2.5 w-2.5" strokeWidth={2} />
            <span>PK</span>
          </span>
        ) : isFk ? (
          <span
            title="Llave foránea secundaria (inmutable salvo nombre)"
            className="inline-flex h-[18px] items-center justify-center gap-1 rounded-md bg-indigo-500/30 px-1.5 text-[9px] font-sans font-semibold tracking-[-0.01em] text-indigo-300 flex-shrink-0 select-none shadow-sm shadow-indigo-950/20"
          >
            <KeyRound className="h-2.5 w-2.5" strokeWidth={2} />
            <span>FK</span>
          </span>
        ) : capabilities.canReposition ? (
          <button
            type="button"
            className="text-slate-600 group-hover/attr:text-slate-400 transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 -ml-1 nodrag touch-none"
            aria-label={`Reordenar atributo ${attribute.name}`}
            {...dragHandleProps}
          >
            <GripVertical className="w-3.5 h-3.5" />
          </button>
        ) : null}

        {/* Nombre del atributo con edición inline por doble clic y efecto hover scroll */}
        <div
          ref={nameContainerRef}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          className="min-w-0 flex-1 overflow-hidden"
          onDoubleClick={handleStartEdit}
        >
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              onBlur={handleCommit}
              onKeyDown={(e) => {
                e.stopPropagation();
                if (e.key === "Enter") {
                  handleCommit();
                } else if (e.key === "Escape") {
                  handleCancel();
                }
              }}
            className="w-full bg-white/10 border border-indigo-500 text-white text-xs px-1.5 py-0.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-400 nodrag nopan nowheel"
            />
          ) : (
            <span
              ref={nameTextRef}
              title={
                isPk && isFk
                  ? "Llave primaria compartida (inmutable por generalización)"
                  : isPk
                    ? "Identificador único inmutable"
                    : isFk
                      ? capabilities.canRename
                        ? `Doble clic para renombrar llave foránea: ${attribute.name}`
                        : "Llave foránea no modificable"
                      : capabilities.canRename
                        ? `Doble clic para renombrar: ${attribute.name}`
                        : attribute.name
              }
              style={
                isMarqueeActive
                  ? ({
                      "--marquee-distance": `-${overflowDistance}px`,
                      animation: `marquee-pingpong ${marqueeDuration}s ease-in-out infinite`,
                      willChange: "transform",
                    } as React.CSSProperties)
                  : {
                      transform: "translate3d(0, 0, 0)",
                      transition: "transform 0.25s ease-out",
                    }
              }
              className={cn(
                "text-xs inline-block transition-colors select-none",
                isMarqueeActive
                  ? "whitespace-nowrap max-w-none animate-marquee-pingpong"
                  : "truncate max-w-full block",
                isPk
                  ? "text-slate-100 font-semibold cursor-default"
                  : isFk
                    ? capabilities.canRename
                      ? "text-slate-100 font-medium hover:text-indigo-100 cursor-pointer"
                      : "text-slate-100 font-medium cursor-default"
                    : capabilities.canRename
                      ? "text-slate-200 hover:text-white cursor-pointer"
                      : "text-slate-200 cursor-default"
              )}
            >
              {attribute.name}
            </span>
          )}
        </div>
      </div>

      {/* Zona derecha: Selector accesible de tipo de dato y condición de obligatoriedad */}
      <div className="flex items-center gap-1 flex-shrink-0 nodrag">
        {renderTypeTrigger ? (
          renderTypeTrigger(attribute)
        ) : (
          <AttributeTypePopover classId={classId} attribute={attribute} canEdit={canEdit} />
        )}

        {/* Indicador de obligatoriedad */}
        {isPk ? (
          <span
            title="Obligatorio (No admite valores nulos)"
            className="text-amber-300/80 text-[10px] font-bold select-none px-0.5"
            aria-label="Obligatorio"
          >
            *
          </span>
        ) : isFk ? (
          <span
            title={
              attribute.isNullable
                ? "Opcional (definido por relación)"
                : "Obligatorio (definido por relación)"
            }
            className={cn(
              "text-[10px] font-bold select-none px-0.5",
              attribute.isNullable ? "text-slate-400" : "text-indigo-400/90"
            )}
            aria-label={attribute.isNullable ? "Opcional" : "Obligatorio"}
          >
            {attribute.isNullable ? "?" : "*"}
          </span>
        ) : attribute.isNullable ? (
          <span
            title="Opcional (Admite valores vacíos)"
            className="text-slate-500 text-[10px] font-medium select-none px-0.5"
            aria-label="Opcional"
          >
            ?
          </span>
        ) : (
          <span
            title="Obligatorio (Requerido)"
            className="text-amber-300/80 text-[10px] font-bold select-none px-0.5"
            aria-label="Obligatorio"
          >
            *
          </span>
        )}
      </div>
    </div>
  );
});
