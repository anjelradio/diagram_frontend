import type { CreateAttributePayload } from "../../domain/entities/diagram-operation.entity.ts";
import type { DiagramOperationDispatcherPort } from "../ports/diagram-operation-dispatcher.port.ts";

export const createCreateDiagramAttribute = (dispatcher: DiagramOperationDispatcherPort) =>
  (viewerId: string, projectId: string, classId: string, payload: CreateAttributePayload) =>
    dispatcher.dispatch({ viewerId, projectId, kind: "CREATE_ATTRIBUTE", classId, payload });
