"use client";

import { memo, useState, useEffect } from "react";
import { type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import type { DiagramClassNodeType } from "@/features/diagram/presentation/store/diagram-slice";
import { diagramOperationQueueRepositoryImpl } from "@/features/diagram/infrastructure/storage/diagram-operation-queue.repository";
import { ClassNodeHeader } from "./class-node-header";
import { AttributeList } from "./attribute-list";
import { AddAttributeButton } from "./add-attribute-button";

/**
 * Componente principal de tarjeta de clase UML para el lienzo de Diagrama.
 * Compone la cabecera con renombrado por doble clic y la lista ordenada de atributos
 * con llave primaria destacada e inmutable.
 */
export const DiagramClassNode = memo(function DiagramClassNode({
  id,
  data,
  selected,
}: NodeProps<DiagramClassNodeType>) {
  const projectId = useAppStore((s) => s.projectId);
  const viewerId = useAppStore((s) => s.viewerId);
  const activeTool = useAppStore((s) => s.activeTool);
  const updateClassNameOptimistic = useAppStore(
    (s) => s.updateClassNameOptimistic
  );

  // Estado para renombrado inline de la clase
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.name);

  useEffect(() => {
    setNameValue(data.name);
  }, [data.name]);

  const handleStartEditName = () => {
    setIsEditingName(true);
  };

  const handleCommitName = async () => {
    const trimmed = nameValue.trim();
    setIsEditingName(false);

    if (!trimmed || trimmed === data.name) {
      setNameValue(data.name);
      return;
    }

    // Actualización optimista en el lienzo
    updateClassNameOptimistic(id, trimmed);

    // Encolar operación durable RENAME en IndexedDB
    if (projectId && viewerId) {
      try {
        await diagramOperationQueueRepositoryImpl.enqueue({
          operationId: crypto.randomUUID(),
          viewerId,
          projectId,
          kind: "RENAME",
          classId: id,
          payload: { name: trimmed },
          createdAt: new Date().toISOString(),
          attempts: 0,
          state: "pending",
        });
        window.dispatchEvent(new CustomEvent("diagram:process-queue"));
      } catch (err) {
        console.error("Error al encolar renombrado de clase:", err);
      }
    }
  };

  const handleCancelEditName = () => {
    setNameValue(data.name);
    setIsEditingName(false);
  };

  return (
    <div
      className={cn(
        "group relative min-w-[220px] max-w-[320px] bg-[#17181d]/95 backdrop-blur-md rounded-xl border transition-all duration-150 select-none shadow-xl p-3 cursor-move",
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500/40 shadow-indigo-500/20"
          : "border-white/10 hover:border-white/20 shadow-black/60"
      )}
      role="region"
      aria-label={`Clase ${data.name}`}
    >
      {/* Cabecera con ícono de clase y nombre */}
      <ClassNodeHeader
        classId={id}
        name={data.name}
        isEditing={isEditingName}
        nameValue={nameValue}
        onStartEdit={handleStartEditName}
        onNameChange={setNameValue}
        onCommit={handleCommitName}
        onCancel={handleCancelEditName}
      />

      {/* Lista ordenada de atributos: PK en posición 0, secundarios a continuación */}
      <AttributeList
        classId={id}
        attributes={data.attributes || []}
      />

      {/* Botón flotante para añadir atributo: visible solo con cursor y si la tarjeta está seleccionada */}
      {selected && activeTool === "cursor" && (
        <AddAttributeButton
          classId={id}
          currentAttributesCount={data.attributes?.length ?? 1}
        />
      )}
    </div>
  );
});
