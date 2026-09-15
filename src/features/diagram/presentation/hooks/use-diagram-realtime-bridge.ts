"use client";

import { useCallback, useRef } from "react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import type {
  RealtimeRole,
  RealtimeServerMessage,
} from "@/features/realtime/domain/entities/realtime.entity";
import { useRealtimeSession } from "@/features/realtime/presentation/hooks/use-realtime-session";
import { diagramRepositoryImpl } from "../../infrastructure/repositories/diagram.repository";
import { diagramOperationQueueRepositoryImpl } from "../../infrastructure/storage/diagram-operation-queue.repository";

export type UseDiagramRealtimeBridgeOptions = {
  projectId: string;
  viewerId: string;
  role: RealtimeRole;
  enabled?: boolean;
  onRoleChanged?: (role: RealtimeRole) => void;
};

export function useDiagramRealtimeBridge({
  projectId,
  viewerId,
  role,
  enabled = true,
  onRoleChanged,
}: UseDiagramRealtimeBridgeOptions) {
  const generationRef = useRef(0);

  const refreshSnapshot = useCallback(
    async (targetProjectId: string, targetViewerId: string, gen?: number) => {
      const currentGen = gen ?? ++generationRef.current;
      const [result, pending] = await Promise.all([
        diagramRepositoryImpl.getDiagram(targetProjectId),
        diagramOperationQueueRepositoryImpl.getAllPending(
          targetViewerId,
          targetProjectId
        ),
      ]);

      // Descartar respuestas de snapshots obsoletos tras nueva reconexión
      if (currentGen !== generationRef.current) return;

      if (result.ok) {
        useAppStore.getState().hydrateSnapshot(result.data, pending);
      }
    },
    []
  );

  const handleRealtimeMessage = useCallback(
    (message: RealtimeServerMessage) => {
      const store = useAppStore.getState();

      switch (message.type) {
        case "presenceSnapshot": {
          const gen = ++generationRef.current;
          const myLock = message.classLocks.find(
            (lock) => lock.userId === viewerId
          );
          store.setLocalClassLock(myLock?.classId ?? null);
          void refreshSnapshot(projectId, viewerId, gen);
          break;
        }

        case "classDragged":
          if (message.userId !== viewerId) {
            store.updateClassPositionOptimistic(message.classId, {
              x: message.x,
              y: message.y,
            });
          }
          break;

        case "diagramMutation":
          if (message.mutation.senderId !== viewerId) {
            store.applyRemoteMutation(
              message.mutation.operationType,
              message.mutation.data
            );
            if (
              [
                "REPOSITION_ATTRIBUTE",
                "CREATE_RELATION",
                "DELETE_RELATION",
              ].includes(message.mutation.operationType)
            ) {
              void refreshSnapshot(projectId, viewerId, generationRef.current);
            }
          }
          break;

        default:
          break;
      }
    },
    [projectId, refreshSnapshot, viewerId]
  );

  const session = useRealtimeSession({
    projectId,
    viewerId,
    role,
    enabled,
    onMessage: handleRealtimeMessage,
    onRoleChanged,
  });

  return {
    ...session,
    refreshSnapshot: () => refreshSnapshot(projectId, viewerId),
  };
}
