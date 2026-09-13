"use client";

import { useEffect, useRef, useCallback } from "react";
import { useAppStore } from "@/features/shared/presentation/store/app-store";
import type { DiagramSnapshot } from "../../domain/entities/diagram-class.entity";
import type {
  CreateAttributePayload,
  CreateClassPayload,
  DeleteAttributePayload,
  MoveClassPayload,
  RenameClassPayload,
  RepositionAttributePayload,
  UpdateAttributePayload,
} from "../../domain/entities/diagram-operation.entity";
import { diagramClassRepositoryImpl } from "../../infrastructure/repositories/diagram-class.repository";
import { diagramAttributeRepositoryImpl } from "../../infrastructure/repositories/diagram-attribute.repository";
import { diagramOperationQueueRepositoryImpl } from "../../infrastructure/storage/diagram-operation-queue.repository";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";

const PERMANENT_ERROR_STATUSES = [400, 401, 403, 404, 409, 422];

type UseDiagramSynchronizerOptions = {
  projectId: string;
  viewerId: string;
  initialSnapshot?: DiagramSnapshot;
};

export function useDiagramSynchronizer({
  projectId,
  viewerId,
  initialSnapshot,
}: UseDiagramSynchronizerOptions) {
  const setDiagramContext = useAppStore((s) => s.setDiagramContext);
  const hydrateSnapshot = useAppStore((s) => s.hydrateSnapshot);
  const setSyncStatus = useAppStore((s) => s.setSyncStatus);
  const syncStatus = useAppStore((s) => s.syncStatus);

  const isProcessingRef = useRef(false);
  const retryTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const processQueue = useCallback(
    async (retryBlocked = false) => {
      if (isProcessingRef.current) return;
      if (!projectId || !viewerId) return;

      if (retryBlocked) {
        await diagramOperationQueueRepositoryImpl.resetBlockedOperations(
          viewerId,
          projectId
        );
        setSyncStatus("pending", null);
      }

      isProcessingRef.current = true;

      try {
        while (true) {
          const nextOp = await diagramOperationQueueRepositoryImpl.peekNext(
            viewerId,
            projectId
          );

          if (!nextOp) {
            setSyncStatus("idle", null);
            break;
          }

          if (nextOp.state === "blocked") {
            setSyncStatus("blocked", "Sincronización pausada por error previo.");
            break;
          }

          setSyncStatus("pending", null);
        nextOp.state = "processing";
        await diagramOperationQueueRepositoryImpl.update(nextOp);

        let result: { ok: boolean; statusCode?: number; errors?: string[] };

        try {
          switch (nextOp.kind) {
            case "CREATE":
              result = await diagramClassRepositoryImpl.createClass(
                projectId,
                nextOp.payload as CreateClassPayload
              );
              break;
            case "RENAME":
              result = await diagramClassRepositoryImpl.renameClass(
                nextOp.classId,
                nextOp.payload as RenameClassPayload
              );
              break;
            case "MOVE":
              result = await diagramClassRepositoryImpl.moveClass(
                nextOp.classId,
                nextOp.payload as MoveClassPayload
              );
              break;
            case "DELETE":
              result = await diagramClassRepositoryImpl.deleteClass(
                nextOp.classId
              );
              break;
            case "CREATE_ATTRIBUTE": {
              const payload = nextOp.payload as CreateAttributePayload;
              result = await diagramAttributeRepositoryImpl.createAttribute(
                nextOp.classId,
                {
                  id: payload.id,
                  name: payload.name,
                  position: payload.position,
                }
              );
              break;
            }
            case "UPDATE_ATTRIBUTE": {
              const payload = nextOp.payload as UpdateAttributePayload;
              result = await diagramAttributeRepositoryImpl.updateAttribute(
                payload.attributeId,
                {
                  name: payload.name,
                  dataType: payload.dataType,
                  isNullable: payload.isNullable,
                }
              );
              break;
            }
            case "REPOSITION_ATTRIBUTE": {
              const payload = nextOp.payload as RepositionAttributePayload;
              result = await diagramAttributeRepositoryImpl.repositionAttribute(
                payload.attributeId,
                {
                  position: payload.position,
                }
              );
              break;
            }
            case "DELETE_ATTRIBUTE": {
              const payload = nextOp.payload as DeleteAttributePayload;
              result = await diagramAttributeRepositoryImpl.deleteAttribute(
                payload.attributeId
              );
              break;
            }
            default:
              result = { ok: true };
              break;
          }
        } catch (err: unknown) {
          result = {
            ok: false,
            statusCode: 0,
            errors: [err instanceof Error ? err.message : "Error de red."],
          };
        }

        if (result.ok) {
          await diagramOperationQueueRepositoryImpl.dequeue(nextOp.operationId);
          continue;
        }

        const statusCode = result.statusCode ?? 0;
        const isDefinitive = PERMANENT_ERROR_STATUSES.includes(statusCode);

        if (isDefinitive) {
          nextOp.state = "blocked";
          await diagramOperationQueueRepositoryImpl.update(nextOp);
          const errorMsg =
            result.errors?.[0] || "Operación rechazada por el servidor.";
          setSyncStatus("blocked", errorMsg);
          appToast.error("Error de sincronización", errorMsg);
          break;
        } else {
          nextOp.attempts = (nextOp.attempts || 0) + 1;
          nextOp.state = "pending";
          const delayMs = Math.min(
            1000 * Math.pow(2, nextOp.attempts - 1),
            10000
          );
          nextOp.nextAttemptAt = new Date(Date.now() + delayMs).toISOString();
          await diagramOperationQueueRepositoryImpl.update(nextOp);
          setSyncStatus("pending", null);

          if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
          }
          retryTimeoutRef.current = setTimeout(() => {
            window.dispatchEvent(new CustomEvent("diagram:process-queue"));
          }, delayMs);
          break;
        }
      }
    } catch (err) {
      console.error("Error en sincronizador de cola:", err);
    } finally {
      isProcessingRef.current = false;
    }
  }, [projectId, viewerId, setSyncStatus]);

  // Hidratación inicial del snapshot servidor + IndexedDB
  useEffect(() => {
    let isCancelled = false;

    async function init() {
      setDiagramContext(
        projectId,
        viewerId,
        true
      );

      try {
        const pendingOps =
          await diagramOperationQueueRepositoryImpl.getAllPending(
            viewerId,
            projectId
          );

        if (isCancelled) return;

        hydrateSnapshot(
          initialSnapshot ?? { classes: [] },
          pendingOps
        );

        if (pendingOps.length > 0) {
          processQueue();
        }
      } catch (err) {
        console.error("Error hidratando desde IndexedDB:", err);
        if (!isCancelled) {
          hydrateSnapshot(initialSnapshot ?? { classes: [] });
        }
      }
    }

    init();

    return () => {
      isCancelled = true;
      if (retryTimeoutRef.current) {
        clearTimeout(retryTimeoutRef.current);
      }
    };
  }, [projectId, viewerId, initialSnapshot, setDiagramContext, hydrateSnapshot, processQueue]);

  // Listener para evento custom diagram:process-queue y online
  useEffect(() => {
    const handleTrigger = (event?: Event) => {
      const customEvt = event as CustomEvent<{ retryBlocked?: boolean }> | undefined;
      processQueue(customEvt?.detail?.retryBlocked);
    };

    window.addEventListener("diagram:process-queue", handleTrigger);
    window.addEventListener("online", handleTrigger);

    return () => {
      window.removeEventListener("diagram:process-queue", handleTrigger);
      window.removeEventListener("online", handleTrigger);
    };
  }, [processQueue]);

  // Advertencia beforeunload si hay sincronizaciones pendientes o bloqueadas
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (syncStatus === "pending" || syncStatus === "blocked") {
        e.preventDefault();
      }
    };

    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [syncStatus]);

  return { processQueue };
}
