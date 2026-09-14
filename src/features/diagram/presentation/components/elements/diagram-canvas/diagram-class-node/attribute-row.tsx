"use client";

import { memo, useRef, useState, useEffect } from "react";
import { KeyRound, GripVertical } from "lucide-react";
import { cn } from "@/lib/utils";
import type { DiagramAttribute } from "@/features/diagram/domain/entities/diagram-attribute.entity";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { diagramOperationQueueRepositoryImpl } from "@/features/diagram/infrastructure/storage/diagram-operation-queue.repository";
import { deriveDiagramAttributeCapabilities } from "@/features/diagram/domain/services/diagram-attribute-capabilities";
import { AttributeTypePopover } from "./attribute-type-popover";

export type AttributeRowProps = {
  classId: string;
  attribute: DiagramAttribute;
  isSelected?: boolean;
  onSelect?: (attributeId: string) => void;
  // Selector accesible de tipo/nulabilidad
  renderTypeTrigger?: (attribute: DiagramAttribute) => React.ReactNode;
  // Drag and Drop (US3)
  dragHandleProps?: Record<string, unknown>;
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
}: AttributeRowProps) {
  const canEdit = useAppStore((s) => s.canEdit);
  const isPk = attribute.isPrimaryKey;
  const isFk = Boolean(attribute.isForeignKey);
  const capabilities = deriveDiagramAttributeCapabilities(attribute, canEdit);

  const projectId = useAppStore((s) => s.projectId);
  const viewerId = useAppStore((s) => s.viewerId);
  const selectedAttribute = useAppStore((s) => s.selectedAttribute);
  const setSelectedAttribute = useAppStore((s) => s.setSelectedAttribute);
  const updateAttributeOptimistic = useAppStore(
    (s) => s.updateAttributeOptimistic
  );

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

  const isRowSelected =
    canEdit &&
    capabilities.canDelete &&
    (isSelected ||
      (selectedAttribute?.classId === classId &&
        selectedAttribute?.attributeId === attribute.id));

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (capabilities.canDelete) {
      setSelectedAttribute({ classId, attributeId: attribute.id });
      onSelect?.(attribute.id);
    }
  };

  const handleStartEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!capabilities.canRename) return;
    setIsEditing(true);
  };

  const handleCommit = async () => {
    const trimmed = nameValue.trim();
    setIsEditing(false);

    if (!trimmed || trimmed === attribute.name) {
      setNameValue(attribute.name);
      return;
    }

    // Actualización optimista en el cliente
    updateAttributeOptimistic(classId, attribute.id, { name: trimmed });

    // Encolar operación durable UPDATE_ATTRIBUTE en IndexedDB
    if (projectId && viewerId) {
      try {
        await diagramOperationQueueRepositoryImpl.enqueue({
          operationId: crypto.randomUUID(),
          viewerId,
          projectId,
          kind: "UPDATE_ATTRIBUTE",
          classId,
          payload: {
            attributeId: attribute.id,
            name: trimmed,
          },
          createdAt: new Date().toISOString(),
          attempts: 0,
          state: "pending",
        });

        window.dispatchEvent(new CustomEvent("diagram:process-queue"));
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
        "group/attr flex items-center justify-between text-xs py-1.5 px-2 rounded-lg transition-colors select-none",
        isRowSelected
          ? "bg-indigo-500/20 ring-1 ring-indigo-500/50"
          : canEdit ? "hover:bg-white/5" : "",
        capabilities.canRename || capabilities.canDelete ? "cursor-pointer" : "cursor-default"
      )}
      role="row"
      aria-label={`Atributo ${attribute.name}${isPk ? " Llave Primaria" : isFk ? " Llave Foránea" : ""}`}
      tabIndex={capabilities.canDelete ? 0 : -1}
      onKeyDown={(e) => {
        if (capabilities.canDelete && (e.key === "Enter" || e.key === " ")) {
          e.stopPropagation();
          setSelectedAttribute({ classId, attributeId: attribute.id });
          onSelect?.(attribute.id);
        }
      }}
    >
      {/* Zona izquierda: Grip / Icono PK / Badge FK y Nombre */}
      <div className="flex items-center gap-2 min-w-0 flex-1 mr-2">
        {isPk ? (
          <span
            title={
              isFk
                ? "Llave primaria compartida (UUID inmutable por generalización)"
                : "Llave primaria (UUID inmutable)"
            }
            className="inline-flex items-center gap-1 text-[9px] font-sans font-semibold text-amber-400 bg-amber-400/10 border border-amber-400/30 px-1.5 py-0.5 rounded flex-shrink-0 select-none shadow-sm"
          >
            <KeyRound className="w-2.5 h-2.5" />
            <span>{isFk ? "PK / FK" : "PK"}</span>
          </span>
        ) : isFk ? (
          <span
            title="Llave foránea secundaria (inmutable salvo nombre)"
            className="inline-flex items-center gap-1 text-[9px] font-sans font-semibold text-indigo-400 bg-indigo-400/10 border border-indigo-400/30 px-1.5 py-0.5 rounded flex-shrink-0 select-none shadow-sm"
          >
            <span>FK</span>
          </span>
        ) : capabilities.canReposition ? (
          <button
            type="button"
            className="text-slate-500 group-hover/attr:text-slate-300 transition-colors flex-shrink-0 cursor-grab active:cursor-grabbing p-0.5 -ml-1 nodrag touch-none"
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
              className="w-full bg-white/10 border border-indigo-500 text-white font-mono text-xs px-1.5 py-0.5 rounded outline-none focus:ring-1 focus:ring-indigo-400 nodrag nopan nowheel"
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
                "font-mono text-xs inline-block transition-colors select-none",
                isMarqueeActive
                  ? "whitespace-nowrap max-w-none animate-marquee-pingpong"
                  : "truncate max-w-full block",
                isPk
                  ? "text-amber-200/90 font-semibold cursor-default"
                  : isFk
                    ? capabilities.canRename
                      ? "text-indigo-200/90 font-medium hover:text-indigo-100 cursor-pointer"
                      : "text-indigo-200/90 font-medium cursor-default"
                    : capabilities.canRename
                      ? "text-slate-200 font-medium hover:text-indigo-200 cursor-pointer"
                      : "text-slate-200 font-medium cursor-default"
              )}
            >
              {attribute.name}
            </span>
          )}
        </div>
      </div>

      {/* Zona derecha: Selector accesible de tipo de dato y condición de obligatoriedad */}
      <div className="flex items-center gap-1.5 flex-shrink-0 nodrag">
        {renderTypeTrigger ? (
          renderTypeTrigger(attribute)
        ) : (
          <AttributeTypePopover classId={classId} attribute={attribute} />
        )}

        {/* Indicador de obligatoriedad */}
        {isPk ? (
          <span
            title="Obligatorio (No admite valores nulos)"
            className="text-amber-400 font-mono text-[10px] font-bold select-none px-0.5"
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
              "font-mono text-[10px] font-bold select-none px-0.5",
              attribute.isNullable ? "text-slate-400" : "text-indigo-400/90"
            )}
            aria-label={attribute.isNullable ? "Opcional" : "Obligatorio"}
          >
            {attribute.isNullable ? "?" : "*"}
          </span>
        ) : attribute.isNullable ? (
          <span
            title="Opcional (Admite valores vacíos)"
            className="text-slate-400 font-mono text-[10px] font-medium select-none px-0.5"
            aria-label="Opcional"
          >
            ?
          </span>
        ) : (
          <span
            title="Obligatorio (Requerido)"
            className="text-amber-400/90 font-mono text-[10px] font-bold select-none px-0.5"
            aria-label="Obligatorio"
          >
            *
          </span>
        )}
      </div>
    </div>
  );
});
