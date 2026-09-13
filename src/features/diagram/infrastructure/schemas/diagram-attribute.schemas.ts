import { z } from "zod";
import {
  diagramAttributeDataTypeSchema,
  diagramAttributeReadSchema,
} from "./diagram.schemas";

/**
 * Esquemas Zod para peticiones y respuestas sobre atributos de diagrama.
 */

export const createDiagramAttributeRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  position: z.number().int().min(1),
});

export type CreateDiagramAttributeRequestDto = z.infer<
  typeof createDiagramAttributeRequestSchema
>;

export const updateDiagramAttributeRequestSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  data_type: diagramAttributeDataTypeSchema.nullable().optional(),
  is_nullable: z.boolean().optional(),
});

export type UpdateDiagramAttributeRequestDto = z.infer<
  typeof updateDiagramAttributeRequestSchema
>;

export const repositionDiagramAttributeRequestSchema = z.object({
  position: z.number().int().min(1),
});

export type RepositionDiagramAttributeRequestDto = z.infer<
  typeof repositionDiagramAttributeRequestSchema
>;

export { diagramAttributeReadSchema };


