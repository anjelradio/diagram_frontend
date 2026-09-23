import type {
  ProjectMember,
  ProjectMemberList,
} from "../../domain/entities/project-member.entity";
import type {
  ProjectMemberItemResponse,
  ProjectMemberListResponse,
} from "../schemas/project-member.schemas";

/**
 * Mapeador puro para miembros de un proyecto entre snake_case y camelCase.
 */

export function mapProjectMemberItemToEntity(
  raw: ProjectMemberItemResponse,
): ProjectMember {
  return {
    id: raw.id,
    userId: raw.user_id,
    name: raw.name,
    email: raw.email,
    image: raw.image,
    role: raw.role,
    status: raw.status,
  };
}

export function mapProjectMemberListToEntity(
  raw: ProjectMemberListResponse,
): ProjectMemberList {
  return {
    items: raw.items.map(mapProjectMemberItemToEntity),
  };
}
