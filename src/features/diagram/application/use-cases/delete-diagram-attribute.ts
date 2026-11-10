import type { DeleteAttributePayload } from "../../domain/entities/diagram-operation.entity.ts";
import type { DiagramOperationDispatcherPort } from "../ports/diagram-operation-dispatcher.port.ts";

export const createDeleteDiagramAttribute = (dispatcher: DiagramOperationDispatcherPort) =>
  (viewerId: string, projectId: string, classId: string, payload: DeleteAttributePayload) =>
    dispatcher.dispatch({ viewerId, projectId, kind: "DELETE_ATTRIBUTE", classId, payload });
