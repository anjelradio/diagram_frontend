import { z } from "zod";

/**
 * Esquemas Zod para validar las respuestas HTTP de invitaciones a un proyecto.
 */

export const invitationResponseSchema = z.object({
  code: z.string(),
  expires_at: z.string(),
});

export type InvitationResponse = z.infer<typeof invitationResponseSchema>;

export const joinProjectResponseSchema = z.object({
  project_id: z.string(),
});

export type JoinProjectResponse = z.infer<typeof joinProjectResponseSchema>;
