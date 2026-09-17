"use client";

import { memo, useState } from "react";
import { Check, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { diagramOperationQueueRepositoryImpl } from "@/features/diagram/infrastructure/storage/diagram-operation-queue.repository";
import { sendRealtimeMessage } from "@/features/realtime/infrastructure/websocket/realtime-socket";
import type {
  DiagramAttribute,
  DiagramAttributeDataType,
} from "@/features/diagram/domain/entities/diagram-attribute.entity";
import type { UpdateAttributePayload } from "@/features/diagram/domain/entities/diagram-operation.entity";

type AttributeTypePopoverProps = {
  classId: string;
  attribute: DiagramAttribute;
  canEdit?: boolean;
};

const DATA_TYPES: {
  type: DiagramAttributeDataType | null;
  label: string;
  desc: string;
}[] = [
  { type: null, label: "Sin tipo", desc: "Sin tipo de dato asignado" },
  { type: "UUID", label: "UUID", desc: "Identificador universal" },
  { type: "TEXT", label: "TEXT", desc: "Cadena de texto" },
  { type: "INTEGER", label: "INTEGER", desc: "Número entero" },
  { type: "DECIMAL", label: "DECIMAL", desc: "Número decimal" },
  { type: "BOOLEAN", label: "BOOLEAN", desc: "Verdadero o falso" },
  { type: "DATE", label: "DATE", desc: "Fecha sin hora" },
  { type: "TIMESTAMP", label: "TIMESTAMP", desc: "Fecha y hora" },
];

/**
 * Selector accesible de tipo de dato y nulabilidad para atributos secundarios.
 * Implementado con Popover de Radix y despachando actualizaciones optimistas
 * junto con la operación serializable UPDATE_ATTRIBUTE a la cola de IndexedDB.
 */
export const AttributeTypePopover = memo(function AttributeTypePopover({
  classId,
  attribute,
  canEdit: canEditProp,
}: AttributeTypePopoverProps) {
  const [open, setOpen] = useState(false);

  const projectId = useAppStore((s) => s.projectId);
  const viewerId = useAppStore((s) => s.viewerId);
  const storeCanEdit = useAppStore((s) => s.canEdit);
  const classLock = useAppStore((s) => s.classLocks[classId]);
  const isLockedByOther = Boolean(classLock && classLock.userId !== viewerId);
  const canEdit = (canEditProp ?? storeCanEdit) && !isLockedByOther;
  const updateAttributeOptimistic = useAppStore(
    (s) => s.updateAttributeOptimistic
  );

  const ensureClassLock = () => {
    if (!canEdit) return;
    const state = useAppStore.getState();
    if (!state.classLocks[classId] || state.classLocks[classId]?.userId !== viewerId) {
      sendRealtimeMessage({ type: "class_lock_acquire", class_id: classId });
    }
  };

  // La llave primaria es completamente inmutable
  if (attribute.isPrimaryKey) {
    return (
      <span
        className="font-mono text-[11px] px-1.5 py-0.5 rounded text-right text-amber-300/80 font-medium select-none"
        title={
          attribute.isForeignKey
            ? "Llave primaria compartida (UUID inmutable)"
            : "Llave primaria (UUID inmutable)"
        }
      >
        UUID
      </span>
    );
  }

  // La llave foránea derivada conserva tipo UUID estático e inmutable (RF-020)
  if (attribute.isForeignKey) {
    return (
      <span
        className="font-mono text-[11px] px-1.5 py-0.5 rounded text-right text-indigo-300/80 font-medium select-none"
        title="Llave foránea derivada (UUID inmutable)"
      >
        UUID
      </span>
    );
  }

  // Para modo reader, renderizar tipo estático sin popover ni interacción
  if (!canEdit) {
    return (
      <span
        className={cn(
          "font-mono text-[11px] px-1.5 py-0.5 rounded text-right select-none",
          attribute.dataType
            ? "text-indigo-400 font-medium"
            : "text-slate-500 italic"
        )}
        title={attribute.dataType || "sin tipo"}
      >
        {attribute.dataType || "sin tipo"}
      </span>
    );
  }

  const dispatchUpdate = async (patch: Partial<UpdateAttributePayload>) => {
    ensureClassLock();
    // 1. Actualización optimista en el estado de React
    updateAttributeOptimistic(classId, attribute.id, {
      dataType: patch.dataType !== undefined ? patch.dataType : attribute.dataType,
      isNullable: patch.isNullable !== undefined ? patch.isNullable : attribute.isNullable,
    });

    // 2. Encolar operación durable UPDATE_ATTRIBUTE en IndexedDB
    if (projectId && viewerId) {
      try {
        const payload: UpdateAttributePayload = {
          attributeId: attribute.id,
          ...patch,
        };

        await diagramOperationQueueRepositoryImpl.enqueue({
          operationId: crypto.randomUUID(),
          viewerId,
          projectId,
          kind: "UPDATE_ATTRIBUTE",
          classId,
          payload,
          createdAt: new Date().toISOString(),
          attempts: 0,
          state: "pending",
        });

        window.dispatchEvent(new CustomEvent("diagram:process-queue"));
      } catch (err) {
        console.error("Error al encolar actualización de atributo:", err);
      }
    }
  };

  const handleSelectType = (newType: DiagramAttributeDataType | null) => {
    if (newType === attribute.dataType) return;
    dispatchUpdate({ dataType: newType });
  };

  const handleToggleNullable = () => {
    dispatchUpdate({ isNullable: !attribute.isNullable });
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (nextOpen) {
      if (!canEdit) return;
      ensureClassLock();
    }
    setOpen(nextOpen);
  };

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            if (canEdit) {
              ensureClassLock();
            }
          }}
          className={cn(
            "flex items-center gap-0.5 font-mono text-[11px] px-1.5 py-0.5 rounded text-right transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 nodrag nopan nowheel",
            attribute.dataType
              ? "text-indigo-400 bg-indigo-500/10 hover:bg-indigo-500/20 font-medium"
              : "text-slate-500 hover:text-slate-300 italic hover:bg-white/5"
          )}
          title="Cambiar tipo de dato y obligatoriedad"
          aria-label={`Tipo de dato de ${attribute.name}: ${attribute.dataType ?? "sin tipo"}`}
        >
          <span className="truncate max-w-[80px]">
            {attribute.dataType || "sin tipo"}
          </span>
          <ChevronDown className="w-2.5 h-2.5 opacity-60 flex-shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        className="w-56 p-2 bg-[#1b1c22] border border-white/10 text-white rounded-xl shadow-2xl z-50 nodrag nopan nowheel"
        onKeyDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase px-2 py-1 select-none">
          Tipo de dato
        </div>

        {/* Lista de tipos seleccionables */}
        <div className="space-y-0.5 max-h-44 overflow-y-auto pr-1">
          {DATA_TYPES.map((item) => {
            const isCurrent = attribute.dataType === item.type;
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => handleSelectType(item.type)}
                className={cn(
                  "w-full flex items-center justify-between px-2 py-1 text-xs rounded-md transition-colors text-left font-mono cursor-pointer",
                  isCurrent
                    ? "bg-indigo-600/30 text-indigo-300 font-semibold"
                    : "hover:bg-white/5 text-slate-300 hover:text-white"
                )}
              >
                <span className="flex flex-col">
                  <span>{item.label}</span>
                  <span className="text-[10px] font-sans text-slate-400 font-normal">
                    {item.desc}
                  </span>
                </span>
                {isCurrent && (
                  <Check className="w-3.5 h-3.5 text-indigo-400 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-white/10 my-1.5" />

        {/* Control de obligatoriedad (nulabilidad) */}
        <div className="px-2 py-1">
          <button
            type="button"
            onClick={handleToggleNullable}
            className="w-full flex items-center justify-between text-xs text-slate-300 hover:text-white group cursor-pointer"
            aria-label="Alternar obligatoriedad"
          >
            <span className="flex flex-col text-left">
              <span className="font-medium">Opcional (?)</span>
              <span className="text-[10px] text-slate-400 font-normal">
                {attribute.isNullable
                  ? "Admite valores vacíos"
                  : "Valor obligatorio (*)"}
              </span>
            </span>
            <div
              className={cn(
                "w-8 h-4 rounded-full transition-colors flex items-center p-0.5",
                attribute.isNullable
                  ? "bg-indigo-600 justify-end"
                  : "bg-slate-700 justify-start"
              )}
            >
              <div className="w-3 h-3 rounded-full bg-white shadow-sm" />
            </div>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
});
