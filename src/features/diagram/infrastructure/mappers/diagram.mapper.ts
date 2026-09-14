import type { DiagramAttribute } from "../../domain/entities/diagram-attribute.entity";
import type {
  DiagramClassWithAttributes,
  DiagramSnapshot,
} from "../../domain/entities/diagram-class.entity";
import type {
  DiagramAttributeReadDto,
  DiagramClassWithAttributesReadDto,
  DiagramReadDto,
} from "../schemas/diagram.schemas";
import { mapDiagramRelationToEntity } from "./diagram-relation.mapper";

/**
 * Mapeadores entre DTOs de transporte HTTP y entidades de dominio para el diagrama.
 */

export function mapDiagramAttributeToEntity(
  dto: DiagramAttributeReadDto
): DiagramAttribute {
  return {
    id: dto.id,
    name: dto.name,
    dataType: dto.data_type,
    position: dto.position,
    isPrimaryKey: dto.is_primary_key,
    isNullable: dto.is_nullable,
    isForeignKey: dto.is_foreign_key,
    referencedClassId: dto.referenced_class_id,
    relationId: dto.relation_id,
  };
}

export function mapDiagramClassWithAttributesToEntity(
  dto: DiagramClassWithAttributesReadDto
): DiagramClassWithAttributes {
  return {
    id: dto.id,
    name: dto.name,
    positionX: dto.position_x,
    positionY: dto.position_y,
    attributes: dto.attributes.map(mapDiagramAttributeToEntity),
  };
}

export function mapDiagramSnapshotToEntity(
  dto: DiagramReadDto
): DiagramSnapshot {
  return {
    classes: dto.classes.map(mapDiagramClassWithAttributesToEntity),
    relations: (dto.relations || []).map(mapDiagramRelationToEntity),
  };
}
