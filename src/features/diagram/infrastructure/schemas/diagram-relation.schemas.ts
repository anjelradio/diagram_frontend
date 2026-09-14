import { z } from "zod";

export const relationTypeSchema = z.enum([
  "ASSOCIATION",
  "AGGREGATION",
  "COMPOSITION",
  "GENERALIZATION",
  "REALIZATION",
  "DEPENDENCY",
]);

export const cardinalitySchema = z.enum(["0..1", "1", "0..*", "1..*"]);

export const relationHandleSchema = z.enum([
  "TOP_LEFT",
  "TOP_CENTER",
  "TOP_RIGHT",
  "RIGHT_TOP",
  "RIGHT_CENTER",
  "RIGHT_BOTTOM",
  "BOTTOM_RIGHT",
  "BOTTOM_CENTER",
  "BOTTOM_LEFT",
  "LEFT_BOTTOM",
  "LEFT_CENTER",
  "LEFT_TOP",
]);

export const relationEndpointRequestSchema = z.object({
  class_id: z.string().uuid(),
  handle: relationHandleSchema,
  cardinality: cardinalitySchema.nullable(),
});

export const relationEndpointReadSchema = z.object({
  class_id: z.string().uuid(),
  handle: relationHandleSchema,
});

export const foreignAttributeRequestSchema = z.object({
  id: z.string().uuid(),
  class_id: z.string().uuid(),
  name: z.string().min(1).max(255),
  data_type: z.literal("UUID"),
  position: z.number().int().min(1),
  is_primary_key: z.literal(false),
  is_nullable: z.boolean(),
  is_foreign_key: z.literal(true),
  referenced_class_id: z.string().uuid(),
  relation_id: z.string().uuid(),
});

export const sharedPrimaryKeyRequestSchema = z.object({
  attribute_id: z.string().uuid(),
  class_id: z.string().uuid(),
  referenced_class_id: z.string().uuid(),
  relation_id: z.string().uuid(),
});

export const primaryAttributeRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.literal("id"),
  data_type: z.literal("UUID"),
  position: z.literal(0),
  is_primary_key: z.literal(true),
  is_nullable: z.literal(false),
});

export const bridgeClassRequestSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  position_x: z.number(),
  position_y: z.number(),
  handle: relationHandleSchema,
  primary_attribute: primaryAttributeRequestSchema,
  foreign_attributes: z.array(foreignAttributeRequestSchema).length(2),
});

export const relationMaterializationRequestSchema = z.object({
  strategy: z.enum(["FOREIGN_KEY", "SHARED_PRIMARY_KEY", "BRIDGE_CLASS"]),
  foreign_attributes: z.array(foreignAttributeRequestSchema).max(2),
  shared_primary_key: sharedPrimaryKeyRequestSchema.nullable(),
  bridge_class: bridgeClassRequestSchema.nullable(),
});

export const createRelationRequestSchema = z
  .object({
    id: z.string().uuid(),
    name: z.string().max(255),
    relation_type: relationTypeSchema,
    source: relationEndpointRequestSchema,
    target: relationEndpointRequestSchema,
    materialization: relationMaterializationRequestSchema,
  })
  .superRefine((val, ctx) => {
    if (val.relation_type !== "ASSOCIATION" && val.name.trim() !== "") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Non-associative relations must have an empty name",
        path: ["name"],
      });
    }
  });

export const renameRelationRequestSchema = z.object({
  name: z.string().min(1).max(255),
});

export const diagramRelationReadSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  relation_type: relationTypeSchema,
  source: relationEndpointReadSchema,
  target: relationEndpointReadSchema,
  source_cardinality: cardinalitySchema.nullable(),
  target_cardinality: cardinalitySchema.nullable(),
  bridge: z
    .object({
      class_id: z.string().uuid(),
      handle: relationHandleSchema,
    })
    .nullable(),
});

export type RelationTypeDto = z.infer<typeof relationTypeSchema>;
export type CardinalityDto = z.infer<typeof cardinalitySchema>;
export type RelationHandleDto = z.infer<typeof relationHandleSchema>;
export type CreateRelationRequestDto = z.infer<typeof createRelationRequestSchema>;
export type RenameRelationRequestDto = z.infer<typeof renameRelationRequestSchema>;
export type DiagramRelationReadDto = z.infer<typeof diagramRelationReadSchema>;
