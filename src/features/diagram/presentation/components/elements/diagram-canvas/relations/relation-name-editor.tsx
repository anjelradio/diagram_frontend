"use client";

import { memo, useState, useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { createRenameDiagramRelation } from "@/features/diagram/application/use-cases/rename-diagram-relation";

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
  const relations = useAppStore((s) => s.relations);
  const setSelectedRelationId = useAppStore((s) => s.setSelectedRelationId);
  const dispatchDiagramOperation = useAppStore((s) => s.dispatchDiagramOperation);

  const relation = relations.find((r) => r.id === relationId);
  const isRelationReserved = useAppStore((s) =>
    s.isComponentReservedByAgent(relationId, "relation")
  );
  const isSourceReserved = useAppStore((s) =>
    relation ? s.isComponentReservedByAgent(relation.source.classId, "class") : false
  );
  const isTargetReserved = useAppStore((s) =>
    relation ? s.isComponentReservedByAgent(relation.target.classId, "class") : false
  );
  const isBridgeReserved = useAppStore((s) =>
    relation?.bridge ? s.isComponentReservedByAgent(relation.bridge.classId, "class") : false
  );
  const isAgentReserved =
    isRelationReserved || isSourceReserved || isTargetReserved || isBridgeReserved;
  const isEffectiveDisabled = disabled || !canEdit || isAgentReserved;

  const [isEditing, setIsEditing] = useState(false);
  const [nameValue, setNameValue] = useState(name);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAgentReserved && isEditing) {
      setIsEditing(false);
      setNameValue(name);
    }
  }, [isAgentReserved, isEditing, name]);

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
    if (isEffectiveDisabled) {
      setNameValue(name);
      setIsEditing(false);
      return;
    }
    const trimmed = nameValue.trim();
    setIsEditing(false);

    if (!trimmed || trimmed === name) {
      setNameValue(name);
      return;
    }

    if (projectId && viewerId) {
      try {
        await createRenameDiagramRelation({ dispatch: dispatchDiagramOperation })(
          viewerId,
          projectId,
          relationId,
          trimmed
        );
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
          className="bg-[#1b1c22]/95 border border-indigo-500 text-white text-[11px] font-medium px-2 py-1 rounded-md outline-none focus:ring-1 focus:ring-indigo-400 shadow-md nodrag nopan nowheel text-center min-w-[88px] max-w-[220px]"
          size={Math.max(8, nameValue.length + 2)}
        />
      ) : (
        <span
          className={cn(
            "inline-flex items-center px-2 py-1 rounded-md text-[11px] font-medium tracking-tight shadow-sm select-none transition-colors border",
            isEffectiveDisabled ? "cursor-default opacity-80" : "cursor-pointer",
            isSelected
              ? "bg-indigo-500/15 text-indigo-100 border-indigo-400/60 ring-1 ring-indigo-400/25"
              : "bg-[#1b1c22]/95 text-slate-300 border-white/10 hover:border-slate-400/60 hover:text-white"
          )}
          title={isEffectiveDisabled ? undefined : "Doble clic para renombrar"}
        >
          {name || (isSelected ? "Sin nombre" : "")}
        </span>
      )}
    </div>
  );
});
