import type {
  ApiActionResult,
  ApiFileResult,
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
  importProject(file: File): Promise<ApiResult<ProjectCreated>>;
  exportProject(projectId: string): Promise<ApiFileResult>;
  updateProject(projectId: string, update: ProjectUpdate): Promise<ApiActionResult>;
  deleteProject(projectId: string): Promise<ApiActionResult>;
}

