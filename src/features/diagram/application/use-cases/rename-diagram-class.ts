import type { DiagramOperationDispatcherPort } from "../ports/diagram-operation-dispatcher.port.ts";

export const createRenameDiagramClass = (dispatcher: DiagramOperationDispatcherPort) =>
  (viewerId: string, projectId: string, classId: string, name: string) =>
    dispatcher.dispatch({ viewerId, projectId, kind: "RENAME_CLASS", classId, payload: { name } });
