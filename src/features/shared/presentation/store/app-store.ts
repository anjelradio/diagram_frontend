import { create } from "zustand";
import { createDispatchDiagramOperation } from "@/features/diagram/application/use-cases/dispatch-diagram-operation";
import { diagramOperationQueueRepositoryImpl } from "@/features/diagram/infrastructure/storage/diagram-operation-queue.repository";
import {
  createDiagramSlice,
  type DiagramSlice,
} from "@/features/diagram/presentation/store/diagram-slice";
import {
  createRealtimeSlice,
  type RealtimeSlice,
} from "@/features/realtime/presentation/store/realtime-slice";
import {
  createAgentChatSlice,
  type AgentChatSlice,
} from "@/features/assistant/presentation/store/agent-chat-slice";

/**
 * Agregador global de Zustand para la aplicación.
 * Combina los slices de cada feature en una única fuente de verdad controlada.
 * No se usa persist para los nodos del diagrama para garantizar integridad con el servidor.
 */
export type AppStore = DiagramSlice & RealtimeSlice & AgentChatSlice;

export const useAppStore = create<AppStore>((set, get, store) => {
  const diagramDispatcher = createDispatchDiagramOperation({
    queue: diagramOperationQueueRepositoryImpl,
    projection: { apply: (operation) => get().applyDiagramOperation(operation) },
    runtime: {
      createId: () => crypto.randomUUID(),
      now: () => new Date().toISOString(),
      requestSync: () => {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("diagram:process-queue"));
        }
      },
    },
  });

  return {
    ...createDiagramSlice(diagramDispatcher)(set, get, store),
    ...createRealtimeSlice(set, get, store),
    ...createAgentChatSlice(set, get, store),
  };
});

