"use client";

import { memo, useRef, useEffect } from "react";
import { Box } from "lucide-react";
import { cn } from "@/lib/utils";

export type ClassNodeHeaderProps = {
  classId: string;
  name: string;
  isEditing: boolean;
  nameValue: string;
  canEdit?: boolean;
  onStartEdit: () => void;
  onNameChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

/**
 * Cabecera de la tarjeta de clase UML.
 * Muestra el nombre de la clase,
 * con soporte de edición inline por doble clic condicionado a canEdit.
 */
export const ClassNodeHeader = memo(function ClassNodeHeader({
  name,
  isEditing,
  nameValue,
  canEdit = false,
  onStartEdit,
  onNameChange,
  onCommit,
  onCancel,
}: ClassNodeHeaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing) {
      inputRef.current?.focus();
      inputRef.current?.select();
    }
  }, [isEditing]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!canEdit) return;
    onStartEdit();
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="min-w-0 select-none px-2.5 py-2.5"
    >
      <div className="flex min-w-0 items-center gap-2">
        {!isEditing && (
          <Box
            aria-hidden="true"
            className="h-3.5 w-3.5 shrink-0 text-indigo-400"
            strokeWidth={1.8}
          />
        )}
        <div className="min-w-0 flex-1">
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={nameValue}
            onChange={(e) => onNameChange(e.target.value)}
            onBlur={onCommit}
            onKeyDown={(e) => {
              e.stopPropagation();
              if (e.key === "Enter") {
                onCommit();
              } else if (e.key === "Escape") {
                onCancel();
              }
            }}
            className="w-full bg-white/10 border border-indigo-500 text-white text-base font-bold px-1.5 py-0.5 rounded-md outline-none focus:ring-1 focus:ring-indigo-400 nodrag nopan nowheel"
          />
        ) : (
          <h4
            className={cn(
              "text-[16px] font-bold text-white tracking-[-0.015em] truncate leading-tight select-none",
              canEdit && "cursor-pointer hover:text-indigo-200 transition-colors"
            )}
            title={canEdit ? `Doble clic para renombrar: ${name}` : name}
          >
            {name}
          </h4>
        )}
        </div>
      </div>
    </div>
  );
});
