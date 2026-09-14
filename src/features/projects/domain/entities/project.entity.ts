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

export const ProjectAccessRole = {
  OWNER: "OWNER",
  EDITOR: "EDITOR",
  READER: "READER",
} as const;

export type ProjectAccessRole =
  (typeof ProjectAccessRole)[keyof typeof ProjectAccessRole];


export type ProjectDetail = {
  id: string;
  name: string;
  description: string | null;
  thumbnailUrl: string | null;
  accessRole: ProjectAccessRole;
};

export type ProjectCanvasCapabilities = {
  canViewProject: boolean;
  canPanAndZoom: boolean;
  canEditDiagram: boolean;
  canViewToolbar: boolean;
  canExportOrGenerate: boolean;
  canShareInvitation: boolean;
  canEditProjectDetails: boolean;
  canManageMembers: boolean;
  canViewHistoricalMembers: boolean;
  canDuplicateOrDeleteProject: boolean;
};

