import type { CreateClassPayload } from "../../domain/entities/diagram-operation.entity.ts";
import type { DiagramOperationDispatcherPort } from "../ports/diagram-operation-dispatcher.port.ts";

export const createCreateDiagramClass = (dispatcher: DiagramOperationDispatcherPort) =>
  (viewerId: string, projectId: string, payload: CreateClassPayload) =>
    dispatcher.dispatch({ viewerId, projectId, kind: "CREATE_CLASS", classId: payload.id, payload });
