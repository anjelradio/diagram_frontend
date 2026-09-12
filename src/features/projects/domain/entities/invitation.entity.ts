/**
 * Entidades de Dominio para las invitaciones a un proyecto.
 */

export type Invitation = {
  code: string;
  expiresAt: string;
};

export type JoinProjectResult = {
  projectId: string;
};

