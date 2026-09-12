import type { ReactNode } from "react";

/**
 * Layout neutralizado para /projects.
 * Permite que el catálogo (/projects) y el lienzo dinámico (/projects/[projectId])
 * gestionen independientemente su viewport, encabezados y fondos.
 */
export default function ProjectsLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
