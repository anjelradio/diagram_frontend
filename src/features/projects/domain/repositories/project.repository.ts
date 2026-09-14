import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type {
  ProjectCreated,
  ProjectDetail,
  ProjectList,
  ProjectUpdate,
} from "../entities/project.entity";

/**
 * Contrato de Dominio para el repositorio de Projects.
 */
export interface ProjectRepository {
  listProjects(): Promise<ApiResult<ProjectList>>;
  getProject(projectId: string): Promise<ApiResult<ProjectDetail>>;
  createProject(): Promise<ApiResult<ProjectCreated>>;
  updateProject(projectId: string, update: ProjectUpdate): Promise<ApiActionResult>;
  deleteProject(projectId: string): Promise<ApiActionResult>;
}
