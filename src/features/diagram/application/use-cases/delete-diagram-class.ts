import type { DiagramOperationDispatcherPort } from "../ports/diagram-operation-dispatcher.port.ts";

export const createDeleteDiagramClass = (dispatcher: DiagramOperationDispatcherPort) =>
  (viewerId: string, projectId: string, classId: string) =>
    dispatcher.dispatch({ viewerId, projectId, kind: "DELETE_CLASS", classId, payload: {} });
