import { z } from "zod";

/**
 * Esquemas Zod para validación y tipado del transporte HTTP de clases de diagrama.
 */

export const diagramClassReadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  position_x: z.number(),
  position_y: z.number(),
});

export const primaryAttributeRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.literal("id"),
  data_type: z.literal("UUID"),
  position: z.literal(0),
  is_primary_key: z.literal(true),
  is_nullable: z.literal(false),
});

export const createDiagramClassRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  position_x: z.number(),
  position_y: z.number(),
  primary_attribute: primaryAttributeRequestSchema,
});

export const renameDiagramClassRequestSchema = z.object({
  name: z.string().min(1).max(255),
});

export const moveDiagramClassRequestSchema = z.object({
  position_x: z.number(),
  position_y: z.number(),
});

export type DiagramClassReadDto = z.infer<typeof diagramClassReadSchema>;
export type CreateDiagramClassRequestDto = z.infer<typeof createDiagramClassRequestSchema>;
export type RenameDiagramClassRequestDto = z.infer<typeof renameDiagramClassRequestSchema>;
export type MoveDiagramClassRequestDto = z.infer<typeof moveDiagramClassRequestSchema>;
