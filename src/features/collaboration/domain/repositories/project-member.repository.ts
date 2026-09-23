import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type { ProjectMemberList } from "../entities/project-member.entity";

/**
 * Contrato de Dominio para el repositorio de Miembros de Proyecto.
 */
export interface ProjectMemberRepository {
  listActiveMembers(projectId: string): Promise<ApiResult<ProjectMemberList>>;
  promoteMember(projectId: string, memberId: string): Promise<ApiActionResult>;
  demoteMember(projectId: string, memberId: string): Promise<ApiActionResult>;
  removeMember(projectId: string, memberId: string): Promise<ApiActionResult>;
}
