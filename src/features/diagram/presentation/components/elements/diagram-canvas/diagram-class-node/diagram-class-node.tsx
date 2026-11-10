"use client";

import { memo, useState, useEffect, useMemo } from "react";
import { type NodeProps } from "@xyflow/react";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import type { DiagramClassNodeType } from "@/features/diagram/presentation/store/diagram-slice";
import { sendRealtimeMessage } from "@/features/realtime/infrastructure/websocket/realtime-socket";
import { ClassNodeHeader } from "./class-node-header";
import { AttributeList } from "./attribute-list";
import { AddAttributeButton } from "./add-attribute-button";
import { RelationHandles } from "./relation-handles";
import { ClassLockIndicator } from "@/features/realtime/presentation/components/elements/class-lock-indicator";
import { AgentReservationIndicator } from "@/features/realtime/presentation/components/elements/agent-reservation-indicator";
import { createRenameDiagramClass } from "@/features/diagram/application/use-cases/rename-diagram-class";

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
  const canEdit = useAppStore((s) => s.canEdit);
  const classLock = useAppStore((s) => s.classLocks[id]);
  const dispatchDiagramOperation = useAppStore((s) => s.dispatchDiagramOperation);
  const effectiveReservation = useAppStore((s) =>
    s.getEffectiveComponentReservation(id, "class")
  );
  const canEditDiagramComponent = useAppStore((s) => s.canEditDiagramComponent);
  const editDecision = useMemo(
    () => canEditDiagramComponent(id, "class", viewerId, canEdit),
    [canEditDiagramComponent, id, viewerId, canEdit, classLock, effectiveReservation]
  );
  const canEditClass = editDecision.allowed;

  // Estado para renombrado inline de la clase
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameValue, setNameValue] = useState(data.name);

  useEffect(() => {
    if ((effectiveReservation?.isReserved || !canEditClass) && isEditingName) {
      setIsEditingName(false);
      setNameValue(data.name);
    }
  }, [effectiveReservation?.isReserved, canEditClass, isEditingName, data.name]);

  useEffect(() => {
    setNameValue(data.name);
  }, [data.name]);

  const handleStartEditName = () => {
    if (!canEditClass) return;
    setIsEditingName(true);
    const state = useAppStore.getState();
    if (!state.classLocks[id] || state.classLocks[id]?.userId !== viewerId) {
      sendRealtimeMessage({ type: "class_lock_acquire", class_id: id });
    }
  };

  const handleCommitName = async () => {
    if (!canEditClass) {
      setNameValue(data.name);
      setIsEditingName(false);
      return;
    }
    const trimmed = nameValue.trim();
    setIsEditingName(false);

    if (!trimmed || trimmed === data.name) {
      setNameValue(data.name);
      return;
    }

    if (projectId && viewerId) {
      try {
        await createRenameDiagramClass({ dispatch: dispatchDiagramOperation })(
          viewerId,
          projectId,
          id,
          trimmed
        );
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
        "group relative min-w-[236px] max-w-[336px] bg-[#17181d]/95 backdrop-blur-md rounded-xl border transition-[border-color,box-shadow] duration-150 select-none shadow-[0_8px_18px_rgba(0,0,0,0.2)] p-2",
        canEditClass ? "cursor-move" : "cursor-default",
        selected
          ? "border-indigo-500 ring-2 ring-indigo-500/40"
          : classLock && classLock.userId !== viewerId
            ? "border-amber-400/80 ring-2 ring-amber-400/20"
          : effectiveReservation?.isReserved && effectiveReservation.activityType === "edit"
            ? "border-purple-500/80 ring-2 ring-purple-500/25 shadow-[0_0_12px_rgba(168,85,247,0.15)]"
          : effectiveReservation?.isReserved && effectiveReservation.activityType === "query"
            ? "border-sky-500/60 ring-2 ring-sky-500/25 shadow-[0_0_12px_rgba(56,189,248,0.12)]"
          : "border-white/10 hover:border-white/20"
      )}
      role="region"
      aria-label={`Clase ${data.name}${effectiveReservation?.isReserved ? ` (Reservada en ${effectiveReservation.activityType === "edit" ? "edición" : "consulta"} por el asistente)` : ""}`}
    >
      {classLock && classLock.userId !== viewerId && (
        <ClassLockIndicator userName={classLock.userName} color={classLock.color} />
      )}
      {effectiveReservation?.isReserved && effectiveReservation.activityType && (
        <AgentReservationIndicator
          activityType={effectiveReservation.activityType}
          className="absolute -top-6 right-2"
        />
      )}
      {/* Cabecera de la entidad */}
      <ClassNodeHeader
        classId={id}
        name={data.name}
        isEditing={isEditingName}
        nameValue={nameValue}
        canEdit={canEditClass}
        onStartEdit={handleStartEditName}
        onNameChange={setNameValue}
        onCommit={handleCommitName}
        onCancel={handleCancelEditName}
      />

      {/* Lista ordenada de atributos: PK en posición 0, secundarios a continuación */}
      <AttributeList
        classId={id}
        attributes={data.attributes || []}
        canEdit={canEditClass}
      />

      {/* Puntos de anclaje (12 handles) para relaciones UML */}
      <RelationHandles classId={id} />

      {/* Botón flotante para añadir atributo: visible solo si canEdit, con cursor y si la tarjeta está seleccionada */}
      {canEditClass && selected && activeTool === "cursor" && (
        <AddAttributeButton
          classId={id}
          currentAttributesCount={data.attributes?.length ?? 1}
          canEdit={canEditClass}
        />
      )}
    </div>
  );
});
