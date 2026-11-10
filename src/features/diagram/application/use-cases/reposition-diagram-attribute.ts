import type { RepositionAttributePayload } from "../../domain/entities/diagram-operation.entity.ts";
import type { DiagramOperationDispatcherPort } from "../ports/diagram-operation-dispatcher.port.ts";

export const createRepositionDiagramAttribute = (dispatcher: DiagramOperationDispatcherPort) =>
  (viewerId: string, projectId: string, classId: string, payload: RepositionAttributePayload) =>
    dispatcher.dispatch({ viewerId, projectId, kind: "REPOSITION_ATTRIBUTE", classId, payload });
