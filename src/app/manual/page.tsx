import type { Metadata } from "next";
import { ManualView } from "@/features/manual/presentation/components/layout/manual-view";

export const metadata: Metadata = {
  title: "Manual de Usuario y Documentación | Diagram",
  description:
    "Aprende a usar Diagram: modelado visual de diagramas de clases UML, colaboración en tiempo real, asistente de inteligencia artificial y generación de código Spring Boot.",
};

/**
 * Thin Route Controller para la ruta pública /manual.
 * Permite el acceso tanto a usuarios autenticados como no autenticados.
 * Delega la presentación íntegra a ManualView.
 */
export default function ManualPage() {
  return <ManualView />;
}
