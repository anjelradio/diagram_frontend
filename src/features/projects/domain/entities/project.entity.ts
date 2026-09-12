/**
 * Entidades de Dominio para el feature de Projects.
 * Define la estructura de datos independiente de infraestructura y transporte HTTP.
 */

export type Project = {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  isOwner: boolean;
};

export type ProjectUpdate = Partial<Pick<Project, "name" | "description">>;

export type ProjectList = {
  items: Project[];
};

export type ProjectCreated = {
  id: string;
};

export type ProjectListItem = Project;

export type ProjectTab = "owned" | "shared";

export type ProjectSearchTerm = string;
