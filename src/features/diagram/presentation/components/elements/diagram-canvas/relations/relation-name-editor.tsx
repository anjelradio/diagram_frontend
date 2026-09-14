"use client";

import { memo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { diagramOperationQueueRepositoryImpl } from "@/features/diagram/infrastructure/storage/diagram-operation-queue.repository";

export type RelationNameEditorProps = {
  relationId: string;
  name: string;
  isSelected?: boolean;
  disabled?: boolean;
  labelX: number;
  labelY: number;
};

/**
 * Editor inline para el nombre central de una relación UML en el lienzo de React Flow.
 * Soporta activación por doble clic, confirmación por Enter o blur, y cancelación por Escape.
 * Encola operaciones durables RENAME_RELATION y proyecta el cambio de forma optimista.
 */
export const RelationNameEditor = memo(function RelationNameEditor({
  relationId,
  name,
  isSelected = false,
  disabled = false,
  labelX,
  labelY,
}: RelationNameEditorProps) {
  const projectId = useAppStore((s) => s.projectId);
  const viewerId = useAppStore((s) => s.viewerId);
  const canEdit = useAppStore((s) => s.canEdit);
  const setSelectedRelationId = useAppStore((s) => s.setSelectedRelationId);
  const renameRelationOptimistic = useAppStore(
    (s) => s.renameRelationOptimistic
  );

  const isEffectiveDisabled = disabled || !canEdit;

  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setNameValue(name);
  }, [name]);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleSelect = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) return;
    setSelectedRelationId(relationId);
  };

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isEffectiveDisabled) return;
    setIsEditing(true);
  };

  const handleCommit = async () => {
    const trimmed = nameValue.trim();
    setIsEditing(false);

    if (!trimmed || trimmed === name) {
      setNameValue(name);
      return;
    }

    // 1. Proyección optimista
    renameRelationOptimistic(relationId, trimmed);

    // 2. Persistencia duradera en cola IndexedDB
    if (projectId && viewerId) {
      try {
        await diagramOperationQueueRepositoryImpl.enqueue({
          operationId: crypto.randomUUID(),
          viewerId,
          projectId,
          kind: "RENAME_RELATION",
          relationId,
          payload: {
            relationId,
            name: trimmed,
          },
          createdAt: new Date().toISOString(),
          attempts: 0,
          state: "pending",
        });
        window.dispatchEvent(new CustomEvent("diagram:process-queue"));
      } catch (err) {
        console.error("Error al encolar renombrado de relación:", err);
      }
    }
  };

  const handleCancel = () => {
    setNameValue(name);
    setIsEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    e.stopPropagation();
    if (e.key === "Enter") {
      handleCommit();
    } else if (e.key === "Escape") {
      handleCancel();
    }
  };

  return (
    <div
      style={{
        position: "absolute",
        transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
        pointerEvents: "all",
      }}
      className="nodrag nopan"
      onClick={handleSelect}
      onDoubleClick={handleDoubleClick}
    >
      {isEditing ? (
        <input
          ref={inputRef}
          type="text"
          value={nameValue}
          onChange={(e) => setNameValue(e.target.value)}
          onBlur={handleCommit}
          onKeyDown={handleKeyDown}
          className="bg-[#18191c]/95 border border-indigo-500 text-white text-[11px] font-medium px-2 py-0.5 rounded-full outline-none focus:ring-1 focus:ring-indigo-400 shadow-md nodrag nopan nowheel text-center min-w-[80px] max-w-[220px]"
          size={Math.max(8, nameValue.length + 2)}
        />
      ) : (
        <span
          className={cn(
            "inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium tracking-tight shadow-md select-none transition-all border",
            isEffectiveDisabled ? "cursor-default opacity-80" : "cursor-pointer",
            isSelected
              ? "bg-indigo-500/20 text-indigo-200 border-indigo-500/50 shadow-indigo-500/10 ring-1 ring-indigo-400/30"
              : "bg-[#18191c]/95 text-slate-300 border-white/10 hover:border-white/20 hover:text-white"
          )}
          title={isEffectiveDisabled ? undefined : "Doble clic para renombrar"}
        >
          {name || (isSelected ? "Sin nombre" : "")}
        </span>
      )}
    </div>
  );
});
