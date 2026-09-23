/**
 * Entidades de Dominio para los miembros de un proyecto.
 */

export type ProjectMemberRole = "READER" | "EDITOR";

export type ProjectMemberStatus = "ACTIVE" | "REMOVED" | "BANNED";

export type ProjectMember = {
  id: string;
  userId: string;
  name: string;
  email: string;
  image: string | null;
  role: ProjectMemberRole;
  status: ProjectMemberStatus;
};

export type ProjectMemberList = {
  items: ProjectMember[];
};
