"use client";

import { memo } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import { diagramOperationQueueRepositoryImpl } from "@/features/diagram/infrastructure/storage/diagram-operation-queue.repository";
import type { DiagramAttribute } from "@/features/diagram/domain/entities/diagram-attribute.entity";
import { AttributeRow, type AttributeRowProps } from "./attribute-row";

export type AttributeListProps = {
  classId: string;
  attributes: DiagramAttribute[];
  selectedAttributeId?: string | null;
  onSelectAttribute?: (attributeId: string) => void;
  renderTypeTrigger?: (attribute: DiagramAttribute) => React.ReactNode;
  canEdit?: boolean;
};

const SortableAttributeRow = memo(function SortableAttributeRow({
  attribute,
  ...props
}: AttributeRowProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: attribute.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    position: "relative",
    zIndex: isDragging ? 30 : "auto",
  };

  return (
    <div ref={setNodeRef} style={style} className="nodrag">
      <AttributeRow
        attribute={attribute}
        dragHandleProps={{ ...attributes, ...listeners }}
        {...props}
      />
    </div>
  );
});

/**
 * Lista ordenada de atributos dentro de una clase de diagrama.
 * Garantiza que la llave primaria (PK) siempre se ubique en la primera fila (posición 0),
 * seguida por los atributos secundarios en orden secuencial estricto con soporte DnD (@dnd-kit).
 */
export const AttributeList = memo(function AttributeList({
  classId,
  attributes,
  selectedAttributeId,
  onSelectAttribute,
  renderTypeTrigger,
  canEdit: canEditOverride,
}: AttributeListProps) {
  const projectId = useAppStore((s) => s.projectId);
  const viewerId = useAppStore((s) => s.viewerId);
  const storeCanEdit = useAppStore((s) => s.canEdit);
  const canEdit = canEditOverride ?? storeCanEdit;
  const repositionAttributeOptimistic = useAppStore(
    (s) => s.repositionAttributeOptimistic
  );

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 4,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Ordenar atributos por position ascendente
  const sortedAttributes = [...attributes].sort((a, b) => a.position - b.position);
  const pkAttribute = sortedAttributes.find((a) => a.isPrimaryKey);
  const secondaryAttributes = sortedAttributes.filter((a) => !a.isPrimaryKey);

  const handleDragEnd = async (event: DragEndEvent) => {
    if (!canEdit) return;
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const movingAttr = secondaryAttributes.find((a) => a.id === active.id);
    if (!movingAttr || movingAttr.isForeignKey) return;
    const overAttr = secondaryAttributes.find((a) => a.id === over.id);
    if (overAttr?.isForeignKey) return;

    const oldIndex = secondaryAttributes.findIndex((a) => a.id === active.id);
    const newIndex = secondaryAttributes.findIndex((a) => a.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const targetPosition = newIndex + 1;
    const movingAttrId = String(active.id);

    // 1. Reordenamiento optimista en el cliente
    repositionAttributeOptimistic(classId, movingAttrId, targetPosition);

    // 2. Encolar operación durable REPOSITION_ATTRIBUTE en IndexedDB
    if (projectId && viewerId) {
      try {
        await diagramOperationQueueRepositoryImpl.enqueue({
          operationId: crypto.randomUUID(),
          viewerId,
          projectId,
          kind: "REPOSITION_ATTRIBUTE",
          classId,
          payload: {
            attributeId: movingAttrId,
            position: targetPosition,
          },
          createdAt: new Date().toISOString(),
          attempts: 0,
          state: "pending",
        });

        window.dispatchEvent(new CustomEvent("diagram:process-queue"));
      } catch (err) {
        console.error("Error al encolar reposición de atributo:", err);
      }
    }
  };

  return (
    <div className="pt-1 select-none">
      {/* Divisor estético entre cabecera y atributos */}
      <div className="border-t border-white/10 mb-1.5" />

      {/* Título de sección de atributos y contador */}
      <div className="px-1 pb-1 flex items-center justify-between text-[10px] font-semibold text-slate-400 tracking-wider uppercase select-none">
        <span>Atributos</span>
        <span className="text-[9px] font-mono text-slate-500 font-normal">
          ({sortedAttributes.length})
        </span>
      </div>

      {/* Filas de atributos */}
      <div className="space-y-0.5">
        {/* Fila fija e inamovible de la Llave Primaria (PK) */}
        {pkAttribute && (
          <AttributeRow
            key={pkAttribute.id}
            classId={classId}
            attribute={pkAttribute}
            isSelected={false}
          />
        )}

        {/* Filas reordenables de atributos secundarios */}
        {canEdit ? (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={secondaryAttributes.map((a) => a.id)}
              strategy={verticalListSortingStrategy}
            >
              {secondaryAttributes.map((attr) => {
                const isSelected = selectedAttributeId === attr.id;

                return (
                  <SortableAttributeRow
                    key={attr.id}
                    classId={classId}
                    attribute={attr}
                    isSelected={isSelected}
                    onSelect={onSelectAttribute}
                    renderTypeTrigger={renderTypeTrigger}
                  />
                );
              })}
            </SortableContext>
          </DndContext>
        ) : (
          secondaryAttributes.map((attr) => (
            <AttributeRow
              key={attr.id}
              classId={classId}
              attribute={attr}
              isSelected={false}
              renderTypeTrigger={renderTypeTrigger}
            />
          ))
        )}

        {sortedAttributes.length === 0 && (
          <div className="text-[11px] text-slate-500 italic px-2 py-1 select-none">
            Sin atributos
          </div>
        )}
      </div>
    </div>
  );
});
