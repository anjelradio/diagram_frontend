import { z } from "zod";

/**
 * Esquemas Zod para validar las respuestas HTTP de miembros de un proyecto.
 */

export const projectMemberRoleSchema = z.enum(["READER", "EDITOR"]);

export const projectMemberStatusSchema = z.enum(["ACTIVE", "REMOVED", "BANNED"]);

export const projectMemberItemResponseSchema = z.object({
  id: z.string(),
  user_id: z.string(),
  name: z.string(),
  email: z.string(),
  image: z.string().nullable(),
  role: projectMemberRoleSchema,
  status: projectMemberStatusSchema,
});

export const projectMemberListResponseSchema = z.object({
  items: z.array(projectMemberItemResponseSchema),
});

export type ProjectMemberItemResponse = z.infer<
  typeof projectMemberItemResponseSchema
>;
export type ProjectMemberListResponse = z.infer<
  typeof projectMemberListResponseSchema
>;
