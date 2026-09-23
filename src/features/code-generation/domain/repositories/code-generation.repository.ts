import type { ApiFileResult } from "../../../shared/domain/types/api-results.ts";
import type { SpringBootConfigInput } from "../entities/code-generation.entity.ts";

export interface CodeGenerationRepository {
  /**
   * Genera el backend Spring Boot para un proyecto y retorna el resultado binario con el archivo ZIP.
   * @param projectId Identificador del proyecto.
   * @param config Opciones opcionales de personalización del paquete Java.
   */
  generateSpringBootBackend(
    projectId: string,
    config?: SpringBootConfigInput
  ): Promise<ApiFileResult>;
}
