import type {
  Project,
  ProjectCreated,
  ProjectDetail,
  ProjectList,
  ProjectThumbnailUpdated,
  ProjectUpdate,
} from "../../domain/entities/project.entity";
import type {
  ProjectCreatedResponse,
  ProjectDetailResponse,
  ProjectItemResponse,
  ProjectListResponse,
  ProjectThumbnailResponse,
  UpdateProjectRequest,
} from "../schemas/project.schemas";

/**
 * Mapeador puro para transformar las respuestas del backend (snake_case)
 * a las entidades de dominio (camelCase) y viceversa para actualizaciones.
 */

export function mapProjectItemToEntity(raw: ProjectItemResponse): Project {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    thumbnailUrl: raw.thumbnail_url,
    thumbnailUpdatedAt: raw.thumbnail_updated_at ?? null,
    isOwner: raw.is_owner,
    modifiedDate: raw.modified_date,
  };
}

export function mapProjectDetailToEntity(raw: ProjectDetailResponse): ProjectDetail {
  return {
    id: raw.id,
    name: raw.name,
    description: raw.description,
    thumbnailUrl: raw.thumbnail_url,
    thumbnailUpdatedAt: raw.thumbnail_updated_at ?? null,
    accessRole: raw.access_role,
  };
}

export function mapProjectThumbnailToEntity(
  raw: ProjectThumbnailResponse
): ProjectThumbnailUpdated {
  return {
    projectId: raw.project_id,
    thumbnailUrl: raw.thumbnail_url,
    thumbnailUpdatedAt: raw.thumbnail_updated_at ?? null,
    updated: raw.updated,
  };
}

export function mapProjectListToEntity(raw: ProjectListResponse): ProjectList {
  return {
    items: raw.items.map(mapProjectItemToEntity),
  };
}

export function mapProjectCreatedToEntity(
  raw: ProjectCreatedResponse,
): ProjectCreated {
  return {
    id: raw.id,
  };
}

export function mapProjectUpdateToRequest(
  update: ProjectUpdate,
): UpdateProjectRequest {
  return {
    ...(update.name !== undefined ? { name: update.name } : {}),
    ...(update.description !== undefined
      ? { description: update.description }
      : {}),
  };
}
