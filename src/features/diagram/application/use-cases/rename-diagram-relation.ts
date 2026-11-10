import type { DiagramOperationDispatcherPort } from "../ports/diagram-operation-dispatcher.port";

export function createRenameDiagramRelation(
  dispatcher: DiagramOperationDispatcherPort
) {
  return (viewerId: string, projectId: string, relationId: string, name: string) =>
    dispatcher.dispatch({
      viewerId,
      projectId,
      kind: "RENAME_RELATION",
      relationId,
      payload: { relationId, name },
    });
}
