import type { DiagramOperationDispatcherPort } from "../ports/diagram-operation-dispatcher.port.ts";
import {
  planRelationCreation,
  type PlanRelationParams,
  type PlannedRelationAggregate,
} from "../../domain/services/diagram-relation-planner.ts";

export type CreateDiagramRelationCommand = PlanRelationParams & {
  viewerId: string;
  projectId: string;
};

export function createCreateDiagramRelation(
  dispatcher: DiagramOperationDispatcherPort
): (command: CreateDiagramRelationCommand) => Promise<PlannedRelationAggregate> {
  return async ({ viewerId, projectId, ...plan }) => {
    const aggregate = planRelationCreation(plan);
    await dispatcher.dispatch({
      viewerId,
      projectId,
      kind: "CREATE_RELATION",
      classId: aggregate.relation.source.classId,
      relationId: aggregate.relation.id,
      payload: aggregate.createRelationPayload,
    });
    return aggregate;
  };
}
