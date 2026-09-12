import type { ApiResult } from "@/features/shared/domain/types/api-results";
import type { Invitation, JoinProjectResult } from "../entities/invitation.entity";

/**
 * Contrato de Dominio para el repositorio de Invitaciones a Proyecto.
 */
export interface InvitationRepository {
  createInvitation(projectId: string): Promise<ApiResult<Invitation>>;
  join(code: string): Promise<ApiResult<JoinProjectResult>>;
}

