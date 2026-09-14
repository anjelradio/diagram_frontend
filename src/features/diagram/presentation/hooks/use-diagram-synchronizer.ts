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
  CreateRelationPayload,
  RenameRelationPayload,
  DeleteRelationPayload,
} from "../../domain/entities/diagram-operation.entity";
import { diagramClassRepositoryImpl } from "../../infrastructure/repositories/diagram-class.repository";
import { diagramAttributeRepositoryImpl } from "../../infrastructure/repositories/diagram-attribute.repository";
import { diagramRelationRepositoryImpl } from "../../infrastructure/repositories/diagram-relation.repository";
import { diagramOperationQueueRepositoryImpl } from "../../infrastructure/storage/diagram-operation-queue.repository";
import { appToast } from "@/features/shared/presentation/components/notifications/toast";

const PERMANENT_ERROR_STATUSES = [400, 401, 403, 404, 409, 422];

type UseDiagramSynchronizerOptions = {
  projectId: string;
  viewerId: string;
  initialSnapshot?: DiagramSnapshot;
  canEdit?: boolean;
};

export function useDiagramSynchronizer({
  projectId,
  viewerId,
  initialSnapshot,
  canEdit = false,
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
      if (!canEdit) return;

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
            case "CREATE_CLASS":
              result = await diagramClassRepositoryImpl.createClass(
                projectId,
                nextOp.payload as CreateClassPayload
              );
              break;
            case "RENAME":
            case "RENAME_CLASS":
              result = await diagramClassRepositoryImpl.renameClass(
                nextOp.classId,
                nextOp.payload as RenameClassPayload
              );
              break;
            case "MOVE":
            case "MOVE_CLASS":
              result = await diagramClassRepositoryImpl.moveClass(
                nextOp.classId,
                nextOp.payload as MoveClassPayload
              );
              break;
            case "DELETE":
            case "DELETE_CLASS":
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

            case "CREATE_RELATION": {
              const payload = nextOp.payload as CreateRelationPayload;
              result = await diagramRelationRepositoryImpl.createRelation(
                projectId,
                payload
              );
              break;
            }
            case "RENAME_RELATION": {
              const payload = nextOp.payload as RenameRelationPayload;
              const relationId = nextOp.relationId || payload.relationId;
              result = await diagramRelationRepositoryImpl.renameRelation(
                relationId,
                payload
              );
              break;
            }
            case "DELETE_RELATION": {
              const payload = nextOp.payload as DeleteRelationPayload;
              const relationId = nextOp.relationId || payload.relationId;
              result = await diagramRelationRepositoryImpl.deleteRelation(
                relationId
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

          if (statusCode === 403 || statusCode === 404) {
            window.dispatchEvent(new CustomEvent("diagram:access-revoked"));
          }
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
          const retryMsg = `Reintentando en ${Math.ceil(delayMs / 1000)}s...`;
          setSyncStatus("pending", retryMsg);

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
  }, [projectId, viewerId, canEdit, setSyncStatus]);

  // Hidratación inicial del snapshot servidor + IndexedDB
  useEffect(() => {
    let isCancelled = false;

    async function init() {
      setDiagramContext(
        projectId,
        viewerId,
        canEdit
      );

      try {
        const pendingOps =
          await diagramOperationQueueRepositoryImpl.getAllPending(
            viewerId,
            projectId
          );

        if (isCancelled) return;

        // Si canEdit es false (READER), no proyectar operaciones locales no confirmadas en el store;
        // mantenerlas en IndexedDB pero sin aplicar cambios.
        hydrateSnapshot(
          initialSnapshot ?? { classes: [], relations: [] },
          canEdit ? pendingOps : []
        );

        if (canEdit && pendingOps.length > 0) {
          processQueue();
        }
      } catch (err) {
        console.error("Error hidratando desde IndexedDB:", err);
        if (!isCancelled) {
          hydrateSnapshot(initialSnapshot ?? { classes: [], relations: [] });
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
  }, [projectId, viewerId, initialSnapshot, canEdit, setDiagramContext, hydrateSnapshot, processQueue]);

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
