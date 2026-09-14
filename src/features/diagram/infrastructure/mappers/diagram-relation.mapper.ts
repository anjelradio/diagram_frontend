import type {
  CreateRelationPayload,
  RenameRelationPayload,
} from "../../domain/entities/diagram-operation.entity";
import type { DiagramRelation } from "../../domain/entities/diagram-relation.entity";
import type {
  CreateRelationRequestDto,
  DiagramRelationReadDto,
  RenameRelationRequestDto,
} from "../schemas/diagram-relation.schemas";

export function mapDiagramRelationToEntity(
  dto: DiagramRelationReadDto
): DiagramRelation {
  return {
    id: dto.id,
    name: dto.name,
    relationType: dto.relation_type,
    source: {
      classId: dto.source.class_id,
      handle: dto.source.handle,
      cardinality: dto.source_cardinality,
    },
    target: {
      classId: dto.target.class_id,
      handle: dto.target.handle,
      cardinality: dto.target_cardinality,
    },
    bridge: dto.bridge
      ? {
          classId: dto.bridge.class_id,
          handle: dto.bridge.handle,
        }
      : null,
  };
}

export function mapCreateRelationPayloadToRequest(
  payload: CreateRelationPayload
): CreateRelationRequestDto {
  const normalizedName =
    payload.relationType === "ASSOCIATION"
      ? payload.name?.trim() || "Nueva relación"
      : "";

  return {
    id: payload.id,
    name: normalizedName,
    relation_type: payload.relationType,
    source: {
      class_id: payload.source.classId,
      handle: payload.source.handle,
      cardinality: payload.source.cardinality,
    },
    target: {
      class_id: payload.target.classId,
      handle: payload.target.handle,
      cardinality: payload.target.cardinality,
    },
    materialization: {
      strategy: payload.materialization.strategy,
      foreign_attributes: payload.materialization.foreignAttributes.map((fa) => ({
        id: fa.id,
        class_id: fa.classId,
        name: fa.name,
        data_type: fa.dataType,
        position: fa.position,
        is_primary_key: fa.isPrimaryKey,
        is_nullable: fa.isNullable,
        is_foreign_key: fa.isForeignKey,
        referenced_class_id: fa.referencedClassId,
        relation_id: fa.relationId,
      })),
      shared_primary_key: payload.materialization.sharedPrimaryKey
        ? {
            attribute_id: payload.materialization.sharedPrimaryKey.attributeId,
            class_id: payload.materialization.sharedPrimaryKey.classId,
            referenced_class_id:
              payload.materialization.sharedPrimaryKey.referencedClassId,
            relation_id: payload.materialization.sharedPrimaryKey.relationId,
          }
        : null,
      bridge_class: payload.materialization.bridgeClass
        ? {
            id: payload.materialization.bridgeClass.id,
            name: payload.materialization.bridgeClass.name,
            position_x: payload.materialization.bridgeClass.positionX,
            position_y: payload.materialization.bridgeClass.positionY,
            handle: payload.materialization.bridgeClass.handle,
            primary_attribute: {
              id: payload.materialization.bridgeClass.primaryAttribute.id,
              name: payload.materialization.bridgeClass.primaryAttribute.name,
              data_type: payload.materialization.bridgeClass.primaryAttribute.dataType,
              position: payload.materialization.bridgeClass.primaryAttribute.position,
              is_primary_key:
                payload.materialization.bridgeClass.primaryAttribute.isPrimaryKey,
              is_nullable:
                payload.materialization.bridgeClass.primaryAttribute.isNullable,
            },
            foreign_attributes:
              payload.materialization.bridgeClass.foreignAttributes.map((fa) => ({
                id: fa.id,
                class_id: fa.classId,
                name: fa.name,
                data_type: fa.dataType,
                position: fa.position,
                is_primary_key: fa.isPrimaryKey,
                is_nullable: fa.isNullable,
                is_foreign_key: fa.isForeignKey,
                referenced_class_id: fa.referencedClassId,
                relation_id: fa.relationId,
              })),
          }
        : null,
    },
  };
}

export function mapRenameRelationPayloadToRequest(
  payload: RenameRelationPayload
): RenameRelationRequestDto {
  return {
    name: payload.name,
  };
}
