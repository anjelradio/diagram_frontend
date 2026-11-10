import type { ApiActionResult } from "@/features/shared/domain/types/api-results";
import type {
  DiagramOperation,
} from "../../domain/entities/diagram-operation.entity";
import type { DiagramAttributeRepository } from "../../domain/repositories/diagram-attribute.repository";
import type { DiagramClassRepository } from "../../domain/repositories/diagram-class.repository";
import type { DiagramRelationRepository } from "../../domain/repositories/diagram-relation.repository";

export type DiagramOperationExecutor = {
  execute(operation: DiagramOperation, projectId: string): Promise<ApiActionResult>;
};

type Dependencies = {
  classes: DiagramClassRepository;
  attributes: DiagramAttributeRepository;
  relations: DiagramRelationRepository;
};

/** Traduce un kind durable a la mutación remota correspondiente. */
export function createExecuteDiagramOperation({
  classes,
  attributes,
  relations,
}: Dependencies): DiagramOperationExecutor {
  return {
    execute(operation, projectId) {
      switch (operation.kind) {
        case "CREATE_CLASS":
          return classes.createClass(projectId, operation.payload);
        case "RENAME_CLASS":
          return classes.renameClass(operation.classId, operation.payload);
        case "MOVE_CLASS":
          return classes.moveClass(operation.classId, operation.payload);
        case "DELETE_CLASS":
          return classes.deleteClass(operation.classId);
        case "CREATE_ATTRIBUTE":
          return attributes.createAttribute(operation.classId, operation.payload);
        case "UPDATE_ATTRIBUTE": {
          const { attributeId, ...input } = operation.payload;
          return attributes.updateAttribute(attributeId, input);
        }
        case "REPOSITION_ATTRIBUTE": {
          const { attributeId, position } = operation.payload;
          return attributes.repositionAttribute(attributeId, { position });
        }
        case "DELETE_ATTRIBUTE":
          return attributes.deleteAttribute(operation.payload.attributeId);
        case "CREATE_RELATION":
          return relations.createRelation(projectId, operation.payload);
        case "RENAME_RELATION":
          return relations.renameRelation(
            operation.relationId ?? operation.payload.relationId,
            operation.payload
          );
        case "DELETE_RELATION":
          return relations.deleteRelation(
            operation.relationId ?? operation.payload.relationId
          );
      }
    },
  };
}
