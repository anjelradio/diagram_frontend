import type {
  CreateDiagramAttributeInput,
  RepositionDiagramAttributeInput,
  UpdateDiagramAttributeInput,
} from "../../domain/repositories/diagram-attribute.repository";
import type {
  CreateDiagramAttributeRequestDto,
  RepositionDiagramAttributeRequestDto,
  UpdateDiagramAttributeRequestDto,
} from "../schemas/diagram-attribute.schemas";

/**
 * Mapeadores entre entradas de dominio y DTOs de peticiones de atributos.
 */

export function mapCreateDiagramAttributeInputToRequest(
  input: CreateDiagramAttributeInput
): CreateDiagramAttributeRequestDto {
  return {
    id: input.id,
    name: input.name,
    position: input.position,
  };
}

export function mapUpdateDiagramAttributeInputToRequest(
  input: UpdateDiagramAttributeInput
): UpdateDiagramAttributeRequestDto {
  const dto: UpdateDiagramAttributeRequestDto = {};
  if (input.name !== undefined) {
    dto.name = input.name;
  }
  if (input.dataType !== undefined) {
    dto.data_type = input.dataType;
  }
  if (input.isNullable !== undefined) {
    dto.is_nullable = input.isNullable;
  }
  return dto;
}

export function mapRepositionDiagramAttributeInputToRequest(
  input: RepositionDiagramAttributeInput
): RepositionDiagramAttributeRequestDto {
  return {
    position: input.position,
  };
}


