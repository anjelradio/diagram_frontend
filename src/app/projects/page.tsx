import { AppHeader } from "@/features/shared/presentation/components/layout/app-header";
import { InteractiveDotPattern } from "@/features/shared/presentation/components/layout/interactive-dot-pattern";
import { projectRepositoryImpl } from "@/features/projects/infrastructure/repositories/project.repository";
import { ProjectsView } from "@/features/projects/presentation/components/elements/projects-list/projects-view";

/**
 * Controlador para la página principal del catálogo de proyectos (/projects).
 * Proporciona el fondo y encabezado exclusivos del listado, obtiene los proyectos en el servidor
 * y delega la renderización a ProjectsView.
 */
export default async function ProjectsPage() {
  const result = await projectRepositoryImpl.listProjects();

  const content = !result.ok ? (
    <ProjectsView
      projects={[]}
      errorMessage={
        result.errors?.[0] ||
        "No fue posible cargar tus proyectos. Por favor, intenta de nuevo."
      }
    />
  ) : (
    <ProjectsView projects={result.data.items} />
  );

  return (
    <div className="relative min-h-svh flex flex-col antialiased selection:bg-indigo-500/30 selection:text-indigo-200 bg-[#121316] text-slate-200 overflow-x-hidden">
      {/* Cuadrícula de puntos interactiva reactiva al cursor */}
      <InteractiveDotPattern />

      {/* Sombra / degradado superior translúcido de Stitch */}
      <div className="fixed top-0 inset-x-0 h-28 bg-gradient-to-b from-black/70 via-black/25 to-transparent pointer-events-none z-30" />

      {/* Encabezado minimalista */}
      <AppHeader />

      {/* Contenido del catálogo */}
      <div className="relative z-10 flex-1 flex flex-col">{content}</div>
    </div>
  );
}
