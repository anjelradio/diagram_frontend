import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { DiagramSnapshot } from "../entities/diagram-class.entity";

/**
 * Contrato de Dominio para consultar el snapshot agregado del diagrama completo.
 */
export interface DiagramRepository {
  /**
   * Obtiene el diagrama completo de un proyecto (clases con atributos y permisos).
   */
  getDiagram(projectId: string): Promise<ApiResult<DiagramSnapshot>>;
}
