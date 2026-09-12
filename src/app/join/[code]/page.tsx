import { ProjectJoinView } from "@/features/projects/presentation/components/elements/project-join/project-join-view";

type JoinPageProps = {
  params: Promise<{
    code: string;
  }>;
};

/**
 * Ruta dinámica /join/[code] para aceptar invitaciones a proyectos.
 * Valida la autenticación perimetral en el middleware (proxy.ts) y renderiza la vista de unión.
 */
export default async function JoinPage({ params }: JoinPageProps) {
  const { code } = await params;

  return <ProjectJoinView code={code} />;
}
