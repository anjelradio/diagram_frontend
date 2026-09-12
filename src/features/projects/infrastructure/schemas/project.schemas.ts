import { z } from "zod";

/**
 * Esquemas Zod para validar las respuestas HTTP en snake_case del backend
 * y las entradas de actualización de un proyecto.
 */

export const projectItemResponseSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().nullable(),
  thumbnail_url: z.string().nullable(),
  is_owner: z.boolean(),
});

export const projectListResponseSchema = z.object({
  items: z.array(projectItemResponseSchema),
});

export const projectCreatedResponseSchema = z.object({
  id: z.string(),
});

export const updateProjectInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "El nombre debe tener al menos 1 caracter")
    .max(255, "El nombre no puede superar 255 caracteres")
    .optional(),
  description: z
    .string()
    .trim()
    .max(1000, "La descripción no puede superar 1000 caracteres")
    .nullable()
    .optional(),
});

export const updateProjectRequestSchema = z.object({
  name: z.string().optional(),
  description: z.string().nullable().optional(),
});

export type ProjectItemResponse = z.infer<typeof projectItemResponseSchema>;
export type ProjectListResponse = z.infer<typeof projectListResponseSchema>;
export type ProjectCreatedResponse = z.infer<typeof projectCreatedResponseSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectInputSchema>;
export type UpdateProjectRequest = z.infer<typeof updateProjectRequestSchema>;
