import {
  ProjectAccessRole,
  type ProjectCanvasCapabilities,
} from "../entities/project.entity.ts";

/**
 * Deriva la matriz pura de capacidades de interacción del lienzo a partir del rol de acceso efectivo.
 *
 * Reglas por rol:
 * - OWNER: Control total sobre el proyecto, lienzo, diagramación, miembros y administración.
 * - EDITOR: Edición del diagrama, herramientas y exportación. No gestiona invitaciones, miembros ni proyecto.
 * - READER: Solo lectura. Navegación, desplazamiento y zoom. Sin edición, toolbar, exportación ni gestión.
 */
export function deriveProjectCanvasCapabilities(
  role: ProjectAccessRole
): ProjectCanvasCapabilities {
  switch (role) {
    case ProjectAccessRole.OWNER:
      return {
        canViewProject: true,
        canPanAndZoom: true,
        canEditDiagram: true,
        canViewToolbar: true,
        canExportOrGenerate: true,
        canShareInvitation: true,
        canEditProjectDetails: true,
        canManageMembers: true,
        canViewHistoricalMembers: true,
        canDuplicateOrDeleteProject: true,
      };

    case ProjectAccessRole.EDITOR:
      return {
        canViewProject: true,
        canPanAndZoom: true,
        canEditDiagram: true,
        canViewToolbar: true,
        canExportOrGenerate: true,
        canShareInvitation: false,
        canEditProjectDetails: false,
        canManageMembers: false,
        canViewHistoricalMembers: false,
        canDuplicateOrDeleteProject: false,
      };

    case ProjectAccessRole.READER:
      return {
        canViewProject: true,
        canPanAndZoom: true,
        canEditDiagram: false,
        canViewToolbar: false,
        canExportOrGenerate: false,
        canShareInvitation: false,
        canEditProjectDetails: false,
        canManageMembers: false,
        canViewHistoricalMembers: false,
        canDuplicateOrDeleteProject: false,
      };
  }
}
