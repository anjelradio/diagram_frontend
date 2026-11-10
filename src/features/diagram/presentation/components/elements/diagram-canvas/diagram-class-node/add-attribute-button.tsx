"use client";

import { memo } from "react";
import { Plus } from "lucide-react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { sendRealtimeMessage } from "@/features/realtime/infrastructure/websocket/realtime-socket";
import { createCreateDiagramAttribute } from "@/features/diagram/application/use-cases/create-diagram-attribute";

type AddAttributeButtonProps = {
  classId: string;
  currentAttributesCount: number;
  onAdded?: (newAttributeId: string) => void;
  canEdit?: boolean;
};

/**
 * Botón flotante para añadir un nuevo atributo secundario a una clase seleccionada.
 * Se muestra únicamente cuando la clase está seleccionada y la herramienta activa es cursor.
 * Genera inmediatamente un atributo con valores por defecto y aísla los eventos del canvas.
 */
export const AddAttributeButton = memo(function AddAttributeButton({
  classId,
  currentAttributesCount,
  onAdded,
  canEdit: canEditOverride,
}: AddAttributeButtonProps) {
  const projectId = useAppStore((s) => s.projectId);
  const viewerId = useAppStore((s) => s.viewerId);
  const storeCanEdit = useAppStore((s) => s.canEdit);
  const isAgentReserved = useAppStore((s) => s.isComponentReservedByAgent(classId, "class"));
  const canEdit = (canEditOverride ?? storeCanEdit) && !isAgentReserved;
  const dispatchDiagramOperation = useAppStore((s) => s.dispatchDiagramOperation);
  const setSelectedAttribute = useAppStore((s) => s.setSelectedAttribute);

  if (!canEdit) return null;

  const handleAddAttribute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!projectId || !viewerId || !canEdit || isAgentReserved) return;

    const state = useAppStore.getState();
    if (!state.classLocks[classId] || state.classLocks[classId]?.userId !== viewerId) {
      sendRealtimeMessage({ type: "class_lock_acquire", class_id: classId });
    }

    const newAttributeId = crypto.randomUUID();
    // La PK ocupa la posición 0, los secundarios inician en position >= 1
    const nextPosition = Math.max(currentAttributesCount, 1);

    try {
      await createCreateDiagramAttribute({ dispatch: dispatchDiagramOperation })(
        viewerId,
        projectId,
        classId,
        { id: newAttributeId, name: "atributo", position: nextPosition }
      );
      setSelectedAttribute({ classId, attributeId: newAttributeId });

      onAdded?.(newAttributeId);
    } catch (err) {
      console.error("Error al crear atributo secundario:", err);
    }
  };

  return (
    <button
      type="button"
      onClick={handleAddAttribute}
      className="nodrag nopan nowheel absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center justify-center w-6 h-6 rounded-full bg-[#1e2025] hover:bg-indigo-600 text-slate-300 hover:text-white border border-white/20 hover:border-indigo-400 shadow-md shadow-black/50 transition-all duration-150 active:scale-95 z-20 cursor-pointer"
      title="Añadir atributo"
      aria-label="Añadir atributo a la clase"
    >
      <Plus className="w-3.5 h-3.5" />
    </button>
  );
});
