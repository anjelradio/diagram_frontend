import type { ApiActionResult } from "@/features/shared/domain/types/api-results";
import type { DiagramAttributeDataType } from "../entities/diagram-attribute.entity";

/**
 * Entrada específica para crear un nuevo atributo secundario.
 */
export type CreateDiagramAttributeInput = {
  id: string;
  name: string;
  position: number;
};

/**
 * Entrada específica para actualizar detalles editables de un atributo.
 */
export type UpdateDiagramAttributeInput = {
  name?: string;
  dataType?: DiagramAttributeDataType | null;
  isNullable?: boolean;
};

/**
 * Entrada específica para reposicionar un atributo secundario.
 */
export type RepositionDiagramAttributeInput = {
  position: number;
};

/**
 * Contrato de Dominio para operaciones remotas de atributos de clases de diagrama.
 */
export interface DiagramAttributeRepository {
  /**
   * Crea un atributo secundario en la clase especificada.
   */
  createAttribute(
    classId: string,
    input: CreateDiagramAttributeInput
  ): Promise<ApiActionResult>;

  /**
   * Actualiza detalles editables de un atributo.
   */
  updateAttribute(
    attributeId: string,
    input: UpdateDiagramAttributeInput
  ): Promise<ApiActionResult>;

  /**
   * Reposiciona un atributo secundario.
   */
  repositionAttribute(
    attributeId: string,
    input: RepositionDiagramAttributeInput
  ): Promise<ApiActionResult>;

  /**
   * Elimina físicamente un atributo secundario.
   */
  deleteAttribute(attributeId: string): Promise<ApiActionResult>;
}



