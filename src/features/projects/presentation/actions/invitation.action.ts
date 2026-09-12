"use server";

import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type {
  Invitation,
  JoinProjectResult,
} from "../../domain/entities/invitation.entity";
import { invitationRepositoryImpl } from "../../infrastructure/repositories/invitation.repository";

/**
 * Server Action para generar o reutilizar un código de invitación a un proyecto.
 */
export async function createInvitationAction(
  projectId: string,
): Promise<ApiResult<Invitation>> {
  return invitationRepositoryImpl.createInvitation(projectId);
}

/**
 * Server Action para unirse a un proyecto mediante un código de invitación.
 */
export async function joinProjectAction(
  code: string,
): Promise<ApiResult<JoinProjectResult>> {
  return invitationRepositoryImpl.join(code);
}

