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
}[] = [
  { type: null, label: "Sin tipo" },
  { type: "UUID", label: "UUID" },
  { type: "TEXT", label: "TEXT" },
  { type: "INTEGER", label: "INTEGER" },
  { type: "DECIMAL", label: "DECIMAL" },
  { type: "BOOLEAN", label: "BOOLEAN" },
  { type: "DATE", label: "DATE" },
  { type: "TIMESTAMP", label: "TIMESTAMP" },
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
        className="text-[11px] text-right text-slate-400 font-medium select-none"
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
        className="text-[11px] text-right text-slate-400 font-medium select-none"
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
          "text-[11px] text-right select-none",
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
            "group flex items-center gap-0.5 text-[11px] py-0.5 text-right transition-colors cursor-pointer outline-none focus-visible:ring-1 focus-visible:ring-indigo-400 nodrag nopan nowheel",
            attribute.dataType
              ? "text-slate-400 hover:text-indigo-300 font-medium"
              : "text-slate-500 hover:text-slate-300 italic"
          )}
          title="Cambiar tipo de dato y obligatoriedad"
          aria-label={`Tipo de dato de ${attribute.name}: ${attribute.dataType ?? "sin tipo"}`}
        >
          <span className="truncate max-w-[80px]">
            {attribute.dataType || "sin tipo"}
          </span>
          <ChevronDown className="w-2.5 h-2.5 opacity-0 group-hover:opacity-60 transition-opacity flex-shrink-0" />
        </button>
      </PopoverTrigger>

      <PopoverContent
        side="bottom"
        align="end"
        className="w-[280px] gap-0 rounded-xl border border-white/10 bg-[#1b1c22] p-3 text-white shadow-xl shadow-black/30 z-50 nodrag nopan nowheel"
        onKeyDown={(e) => e.stopPropagation()}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="px-2 pb-2 text-sm font-semibold tracking-tight text-slate-100 select-none">
          Tipo de dato
        </div>

        {/* Lista de tipos seleccionables */}
        <div
          role="listbox"
          aria-label="Tipos de dato"
          className="diagram-type-scroll max-h-60 space-y-0.5 overflow-y-auto pr-1"
        >
          {DATA_TYPES.map((item) => {
            const isCurrent = attribute.dataType === item.type;
            return (
              <button
                key={item.label}
                type="button"
                role="option"
                aria-selected={isCurrent}
                onClick={() => handleSelectType(item.type)}
                className={cn(
                  "w-full flex items-center justify-between px-2.5 py-2 text-sm rounded-lg transition-colors text-left cursor-pointer",
                  isCurrent
                    ? "bg-indigo-500/15 text-indigo-100 font-medium"
                    : "text-slate-300 hover:bg-white/[0.06] hover:text-white"
                )}
              >
                <span>{item.label}</span>
                {isCurrent && (
                  <Check className="w-4 h-4 text-indigo-300 flex-shrink-0" />
                )}
              </button>
            );
          })}
        </div>

        <div className="border-t border-white/10 my-2.5" />

        {/* Control de obligatoriedad (nulabilidad) */}
        <div className="px-2 py-1.5">
          <button
            type="button"
            onClick={handleToggleNullable}
          className="w-full flex items-center justify-between text-[13px] text-slate-200 hover:text-white group cursor-pointer"
            aria-label="Alternar obligatoriedad"
          >
            <span className="flex flex-col text-left">
              <span className="font-medium">Opcional (?)</span>
              <span className="text-xs text-slate-400 font-normal mt-0.5">
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
