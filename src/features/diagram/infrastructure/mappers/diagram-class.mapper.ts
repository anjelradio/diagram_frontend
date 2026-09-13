import type {
  DiagramClass,
} from "../../domain/entities/diagram-class.entity";
import type {
  CreateClassPayload,
  MoveClassPayload,
  RenameClassPayload,
} from "../../domain/entities/diagram-operation.entity";
import type {
  CreateDiagramClassRequestDto,
  DiagramClassReadDto,
  MoveDiagramClassRequestDto,
  RenameDiagramClassRequestDto,
} from "../schemas/diagram-class.schemas";

/**
 * Mapeador puro para transformar las respuestas HTTP de la API (snake_case)
 * a las entidades de dominio tipadas en el cliente (camelCase).
 */
export function mapDiagramClassToEntity(raw: DiagramClassReadDto): DiagramClass {
  return {
    id: raw.id,
    name: raw.name,
    positionX: raw.position_x,
    positionY: raw.position_y,
  };
}

export function mapCreateClassPayloadToRequest(
  payload: CreateClassPayload
): CreateDiagramClassRequestDto {
  return {
    id: payload.id,
    name: payload.name,
    position_x: payload.positionX,
    position_y: payload.positionY,
    primary_attribute: {
      id: payload.primaryAttribute.id,
      name: payload.primaryAttribute.name,
      data_type: payload.primaryAttribute.dataType,
      position: payload.primaryAttribute.position,
      is_primary_key: payload.primaryAttribute.isPrimaryKey,
      is_nullable: payload.primaryAttribute.isNullable,
    },
  };
}

export function mapMoveClassPayloadToRequest(
  payload: MoveClassPayload
): MoveDiagramClassRequestDto {
  return {
    position_x: payload.positionX,
    position_y: payload.positionY,
  };
}

export function mapRenameClassPayloadToRequest(
  payload: RenameClassPayload
): RenameDiagramClassRequestDto {
  return {
    name: payload.name,
  };
}

