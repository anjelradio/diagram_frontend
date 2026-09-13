import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { projectRepositoryImpl } from "@/features/projects/infrastructure/repositories/project.repository";
import { projectMemberRepositoryImpl } from "@/features/projects/infrastructure/repositories/project-member.repository";
import { diagramRepositoryImpl } from "@/features/diagram/infrastructure/repositories/diagram.repository";
import { ProjectCanvasView } from "@/features/projects/presentation/components/elements/project-canvas/project-canvas-view";
import type { ProjectMember } from "@/features/projects/domain/entities/project-member.entity";
import type { DiagramSnapshot } from "@/features/diagram/domain/entities/diagram-class.entity";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

/**
 * Controlador delgado para la ruta dinámica /projects/[projectId].
 * Resuelve el proyecto solicitado a partir de los proyectos accesibles por el usuario.
 * Si el identificador no pertenece a proyectos accesibles, invoca notFound().
 * Si la persona es la propietaria del proyecto, recupera los colaboradores con estado ACTIVE.
 * Carga la instantánea inicial del diagrama y delega el lienzo a ProjectCanvasView.
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const viewerId = session?.user?.id ?? "";

  const projectsResult = await projectRepositoryImpl.listProjects();
  if (!projectsResult.ok) {
    notFound();
  }

  const project = projectsResult.data.items.find((p) => p.id === projectId);
  if (!project) {
    notFound();
  }

  let initialMembers: ProjectMember[] = [];
  if (project.isOwner) {
    const membersResult =
      await projectMemberRepositoryImpl.listActiveMembers(projectId);
    if (membersResult.ok) {
      initialMembers = membersResult.data.items;
    }
  }

  const diagramResult = await diagramRepositoryImpl.getDiagram(projectId);
  const initialSnapshot: DiagramSnapshot = diagramResult.ok
    ? diagramResult.data
    : { classes: [] };

  return (
    <ProjectCanvasView
      project={project}
      initialMembers={initialMembers}
      initialSnapshot={initialSnapshot}
      viewerId={viewerId}
    />
  );
}
