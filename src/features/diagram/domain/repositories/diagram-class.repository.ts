import type { ApiActionResult } from "@/features/shared/domain/types/api-results";
import type {
  CreateClassPayload,
  MoveClassPayload,
  RenameClassPayload,
} from "../entities/diagram-operation.entity";

/**
 * Contrato de Dominio para el acceso a datos y operaciones remotas de clases de diagrama.
 */
export interface DiagramClassRepository {
  /**
   * Crea una clase en el proyecto con un identificador UUID generado por el cliente.
   */
  createClass(
    projectId: string,
    payload: CreateClassPayload
  ): Promise<ApiActionResult>;

  /**
   * Renombra una clase de diagrama.
   */
  renameClass(
    classId: string,
    payload: RenameClassPayload
  ): Promise<ApiActionResult>;

  /**
   * Actualiza las coordenadas de una clase de diagrama.
   */
  moveClass(
    classId: string,
    payload: MoveClassPayload
  ): Promise<ApiActionResult>;

  /**
   * Elimina físicamente una clase de diagrama.
   */
  deleteClass(classId: string): Promise<ApiActionResult>;
}
