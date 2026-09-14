import type { ApiActionResult } from "../../../shared/domain/types/api-results.ts";
import type {
  CreateRelationPayload,
  RenameRelationPayload,
} from "../entities/diagram-operation.entity";

/**
 * Contrato de Dominio para el acceso a datos y operaciones remotas de relaciones UML.
 */
export interface DiagramRelationRepository {
  /**
   * Crea una relación UML en el proyecto con su materialización relacional atómica.
   */
  createRelation(
    projectId: string,
    payload: CreateRelationPayload
  ): Promise<ApiActionResult>;

  /**
   * Renombra una relación existente (solo si no es N:M).
   */
  renameRelation(
    relationId: string,
    payload: RenameRelationPayload
  ): Promise<ApiActionResult>;

  /**
   * Elimina físicamente una relación y sus artefactos derivados en cascada.
   */
  deleteRelation(relationId: string): Promise<ApiActionResult>;
}
