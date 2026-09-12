import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type {
  ProjectCreated,
  ProjectList,
  ProjectUpdate,
} from "../entities/project.entity";

/**
 * Contrato de Dominio para el repositorio de Projects.
 */
export interface ProjectRepository {
  listProjects(): Promise<ApiResult<ProjectList>>;
  createProject(): Promise<ApiResult<ProjectCreated>>;
  updateProject(projectId: string, update: ProjectUpdate): Promise<ApiActionResult>;
  deleteProject(projectId: string): Promise<ApiActionResult>;
}
