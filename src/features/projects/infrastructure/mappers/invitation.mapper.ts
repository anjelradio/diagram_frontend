import type {
  Invitation,
  JoinProjectResult,
} from "../../domain/entities/invitation.entity";
import type {
  InvitationResponse,
  JoinProjectResponse,
} from "../schemas/invitation.schemas";

/**
 * Mapeador puro para invitaciones a un proyecto entre snake_case y camelCase.
 */

export function mapInvitationToEntity(raw: InvitationResponse): Invitation {
  return {
    code: raw.code,
    expiresAt: raw.expires_at,
  };
}

export function mapJoinProjectToEntity(
  raw: JoinProjectResponse,
): JoinProjectResult {
  return {
    projectId: raw.project_id,
  };
}

