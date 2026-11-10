import type { UpdateAttributePayload } from "../../domain/entities/diagram-operation.entity.ts";
import type { DiagramOperationDispatcherPort } from "../ports/diagram-operation-dispatcher.port.ts";

export const createUpdateDiagramAttribute = (dispatcher: DiagramOperationDispatcherPort) =>
  (viewerId: string, projectId: string, classId: string, payload: UpdateAttributePayload) =>
    dispatcher.dispatch({ viewerId, projectId, kind: "UPDATE_ATTRIBUTE", classId, payload });
