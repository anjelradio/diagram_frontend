import { notFound } from "next/navigation";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { projectRepositoryImpl } from "@/features/projects/infrastructure/repositories/project.repository";
import { projectMemberRepositoryImpl } from "@/features/projects/infrastructure/repositories/project-member.repository";
import { diagramRepositoryImpl } from "@/features/diagram/infrastructure/repositories/diagram.repository";
import { assistantRepositoryImpl } from "@/features/assistant/infrastructure/repositories/http-assistant.repository";
import { ProjectCanvasView } from "@/features/projects/presentation/components/elements/project-canvas/project-canvas-view";
import type { ProjectMember } from "@/features/projects/domain/entities/project-member.entity";
import type { AgentActivity } from "@/features/assistant/domain/entities/agent-activity.entity";

type ProjectPageProps = {
  params: Promise<{
    projectId: string;
  }>;
};

/**
 * Controlador delgado para la ruta dinámica /projects/[projectId].
 * Resuelve el proyecto y el rol efectivo mediante GET /api/projects/{projectId}.
 * Si el proyecto es inexistente, eliminado o inaccesible, invoca notFound().
 * Carga colaboradores activos para cualquier rol autorizado (OWNER, EDITOR, READER).
 * Si el diagrama no es accesible, invoca notFound().
 * Delega el lienzo a ProjectCanvasView con el detalle y las capacidades efectivas.
 */
export default async function ProjectPage({ params }: ProjectPageProps) {
  const { projectId } = await params;

  const session = await auth.api.getSession({
    headers: await headers(),
  });
  const viewerId = session?.user?.id ?? "";

  const projectResult = await projectRepositoryImpl.getProject(projectId);
  if (!projectResult.ok) {
    notFound();
  }
  const project = projectResult.data;

  let initialMembers: ProjectMember[] = [];
  const membersResult =
    await projectMemberRepositoryImpl.listActiveMembers(projectId);
  if (membersResult.ok) {
    initialMembers = membersResult.data.items;
  }

  const diagramResult = await diagramRepositoryImpl.getDiagram(projectId);
  if (!diagramResult.ok) {
    notFound();
  }
  const initialSnapshot = diagramResult.data;

  let initialActivities: AgentActivity[] = [];
  const activitiesResult = await assistantRepositoryImpl.listActivities(projectId);
  if (activitiesResult.ok) {
    initialActivities = activitiesResult.data;
  }

  return (
    <ProjectCanvasView
      project={project}
      initialMembers={initialMembers}
      initialSnapshot={initialSnapshot}
      initialActivities={initialActivities}
      viewerId={viewerId}
    />
  );
}
