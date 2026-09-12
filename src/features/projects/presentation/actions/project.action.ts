"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import type {
  ApiActionResult,
  ApiResult,
} from "@/features/shared/domain/types/api-results";
import type { ProjectCreated } from "../../domain/entities/project.entity";
import { projectRepositoryImpl } from "../../infrastructure/repositories/project.repository";
import { updateProjectInputSchema } from "../../infrastructure/schemas/project.schemas";

// Validador de entrada para asegurar que no se envíen datos inesperados al crear
const createProjectInputSchema = z.union([
  z.undefined(),
  z.null(),
  z.object({}).strict(),
  z.record(z.string(), z.never()),
]);

/**
 * Server Action para crear un proyecto en blanco.
 * Valida la entrada vacía, invoca el repositorio y revalida la ruta /projects solo al éxito.
 */
export async function createProjectAction(
  data?: unknown,
): Promise<ApiResult<ProjectCreated>> {
  const parsed = createProjectInputSchema.safeParse(data);
  if (!parsed.success) {
    return {
      ok: false,
      statusCode: 422,
      errors: ["Entrada no válida para crear un proyecto en blanco."],
    };
  }

  const result = await projectRepositoryImpl.createProject();
  if (result.ok) {
    revalidatePath("/projects");
  }

  return result;
}

/**
 * Server Action para actualizar el nombre y/o descripción de un proyecto.
 */
export async function updateProjectAction(
  projectId: string,
  data: unknown,
): Promise<ApiActionResult> {
  const parsed = updateProjectInputSchema.safeParse(data);
  if (!parsed.success) {
    const errorMessages = parsed.error.issues.map((issue) => issue.message);
    return {
      ok: false,
      statusCode: 422,
      errors: errorMessages.length > 0 ? errorMessages : ["Datos de actualización no válidos."],
    };
  }

  const result = await projectRepositoryImpl.updateProject(projectId, parsed.data);
  if (result.ok) {
    revalidatePath("/projects");
    revalidatePath(`/projects/${projectId}`);
  }

  return result;
}

/**
 * Server Action para eliminar un proyecto.
 */
export async function deleteProjectAction(
  projectId: string,
): Promise<ApiActionResult> {
  const result = await projectRepositoryImpl.deleteProject(projectId);
  if (result.ok) {
    revalidatePath("/projects");
  }

  return result;
}
