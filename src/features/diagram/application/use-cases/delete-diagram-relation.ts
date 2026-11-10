import type { DiagramOperationDispatcherPort } from "../ports/diagram-operation-dispatcher.port";

export function createDeleteDiagramRelation(
  dispatcher: DiagramOperationDispatcherPort
) {
  return (viewerId: string, projectId: string, relationId: string) =>
    dispatcher.dispatch({
      viewerId,
      projectId,
      kind: "DELETE_RELATION",
      relationId,
      payload: { relationId },
    });
}
