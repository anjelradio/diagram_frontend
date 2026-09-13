"use client";

import { memo } from "react";
import { Plus } from "lucide-react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { diagramOperationQueueRepositoryImpl } from "@/features/diagram/infrastructure/storage/diagram-operation-queue.repository";
import type { DiagramAttribute } from "@/features/diagram/domain/entities/diagram-attribute.entity";
import type { CreateAttributePayload } from "@/features/diagram/domain/entities/diagram-operation.entity";

type AddAttributeButtonProps = {
  classId: string;
  currentAttributesCount: number;
  onAdded?: (newAttributeId: string) => void;
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
}: AddAttributeButtonProps) {
  const projectId = useAppStore((s) => s.projectId);
  const viewerId = useAppStore((s) => s.viewerId);
  const addAttributeOptimistic = useAppStore((s) => s.addAttributeOptimistic);
  const setSelectedAttribute = useAppStore((s) => s.setSelectedAttribute);

  const handleAddAttribute = async (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();

    if (!projectId || !viewerId) return;

    const newAttributeId = crypto.randomUUID();
    // La PK ocupa la posición 0, los secundarios inician en position >= 1
    const nextPosition = Math.max(currentAttributesCount, 1);

    const newAttribute: DiagramAttribute = {
      id: newAttributeId,
      name: "atributo",
      dataType: null,
      position: nextPosition,
      isPrimaryKey: false,
      isNullable: true,
    };

    const payload: CreateAttributePayload = {
      id: newAttributeId,
      name: "atributo",
      position: nextPosition,
    };

    try {
      // 1. Encolar en IndexedDB antes de la mutación optimista
      await diagramOperationQueueRepositoryImpl.enqueue({
        operationId: crypto.randomUUID(),
        viewerId,
        projectId,
        kind: "CREATE_ATTRIBUTE",
        classId,
        payload,
        createdAt: new Date().toISOString(),
        attempts: 0,
        state: "pending",
      });

      // 2. Aplicar optimismo en la tarjeta del lienzo
      addAttributeOptimistic(classId, newAttribute);
      setSelectedAttribute({ classId, attributeId: newAttributeId });

      // 3. Disparar proceso de la cola
      window.dispatchEvent(new CustomEvent("diagram:process-queue"));

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
