import { z } from "zod";
import { diagramRelationReadSchema } from "./diagram-relation.schemas";

/**
 * Esquemas Zod para validación y tipado del transporte HTTP del diagrama completo y sus atributos.
 */

export const diagramAttributeDataTypeSchema = z.enum([
  "UUID",
  "TEXT",
  "INTEGER",
  "DECIMAL",
  "BOOLEAN",
  "DATE",
  "TIMESTAMP",
]);

export const diagramAttributeReadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  data_type: diagramAttributeDataTypeSchema.nullable(),
  position: z.number().int().min(0),
  is_primary_key: z.boolean(),
  is_nullable: z.boolean(),
  is_foreign_key: z.boolean().default(false),
  referenced_class_id: z.string().uuid().nullable().default(null),
  relation_id: z.string().uuid().nullable().default(null),
});

export const diagramClassWithAttributesReadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  position_x: z.number(),
  position_y: z.number(),
  attributes: z.array(diagramAttributeReadSchema),
});

export const diagramReadSchema = z.object({
  classes: z.array(diagramClassWithAttributesReadSchema),
  relations: z.array(diagramRelationReadSchema).default([]),
});

export type DiagramAttributeDataTypeDto = z.infer<typeof diagramAttributeDataTypeSchema>;
export type DiagramAttributeReadDto = z.infer<typeof diagramAttributeReadSchema>;
export type DiagramClassWithAttributesReadDto = z.infer<typeof diagramClassWithAttributesReadSchema>;
export type DiagramReadDto = z.infer<typeof diagramReadSchema>;
