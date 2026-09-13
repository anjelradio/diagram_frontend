"use client";

import { memo, useRef, useEffect } from "react";
import { Box } from "lucide-react";

export type ClassNodeHeaderProps = {
  classId: string;
  name: string;
  isEditing: boolean;
  nameValue: string;
  onStartEdit: () => void;
  onNameChange: (value: string) => void;
  onCommit: () => void;
  onCancel: () => void;
};

/**
 * Cabecera de la tarjeta de clase UML.
 * Muestra el ícono representativo y el nombre de la clase,
 * con soporte de edición inline por doble clic.
 */
export const ClassNodeHeader = memo(function ClassNodeHeader({
  name,
  isEditing,
  nameValue,
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
    onStartEdit();
  };

  return (
    <div
      onDoubleClick={handleDoubleClick}
      className="flex items-center gap-2.5 min-w-0 select-none pb-2"
    >
      <div className="w-7 h-7 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400 flex-shrink-0 shadow-sm">
        <Box className="w-4 h-4" />
      </div>

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
            className="w-full bg-white/10 border border-indigo-500 text-white text-sm font-bold px-1.5 py-0.5 rounded outline-none focus:ring-1 focus:ring-indigo-400 nodrag nopan nowheel"
          />
        ) : (
          <h4
            className="text-sm font-bold text-white tracking-tight truncate leading-tight cursor-pointer hover:text-indigo-200 transition-colors"
            title={`Doble clic para renombrar: ${name}`}
          >
            {name}
          </h4>
        )}
      </div>
    </div>
  );
});
