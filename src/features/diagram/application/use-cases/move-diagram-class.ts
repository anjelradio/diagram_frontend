import type { DiagramOperationDispatcherPort } from "../ports/diagram-operation-dispatcher.port.ts";

export const createMoveDiagramClass = (dispatcher: DiagramOperationDispatcherPort) =>
  (viewerId: string, projectId: string, classId: string, positionX: number, positionY: number) =>
    dispatcher.dispatch({ viewerId, projectId, kind: "MOVE_CLASS", classId, payload: { positionX, positionY } });
