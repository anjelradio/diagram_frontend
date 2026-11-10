import { z } from "zod";

export const agentActivityCodeSchema = z.enum([
  "preparing_context",
  "analyzing_prompt",
  "planning",
  "analyzing_image",
  "reading_diagram",
  "reading_classes",
  "reading_attributes",
  "reading_relations",
  "creating_class",
  "editing_class",
  "deleting_class",
  "creating_attribute",
  "editing_attribute",
  "deleting_attribute",
  "creating_relation",
  "editing_relation",
  "deleting_relation",
  "recalling_conversation",
  "finalizing",
]);

export const agentActivityTypeSchema = z.enum([
  "query",
  "edit",
  "analysis",
  "planning",
]);

export const realtimeUserWireSchema = z.object({
  user_id: z.string(),
  user_name: z.string(),
  role: z.enum(["OWNER", "EDITOR", "READER"]),
});

export const realtimeClassLockWireSchema = z.object({
  class_id: z.string(),
  user_id: z.string(),
  user_name: z.string(),
  locked_at: z.number(),
  expires_at: z.number(),
});

export const realtimeAgentReservationWireSchema = z.object({
  project_id: z.string().uuid(),
  message_id: z.string().uuid(),
  sequence: z.number().int().nonnegative(),
  component_type: z.enum(["class", "relation"]),
  component_id: z.string().uuid(),
  activity_type: z.enum(["query", "edit"]),
  attribute_id: z.string().uuid().nullable().optional().default(null),
});

/** Esquema canónico en snake_case de eventos entrantes vía WebSocket */
export const RealtimeMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pong") }),
  z.object({
    type: z.literal("presence_snapshot"),
    peers: z.array(realtimeUserWireSchema),
    class_locks: z.array(realtimeClassLockWireSchema),
    agent_component_reservations: z
      .array(realtimeAgentReservationWireSchema)
      .optional()
      .default([]),
  }),
  z.object({ type: z.literal("user_joined"), ...realtimeUserWireSchema.shape }),
  z.object({ type: z.literal("user_left"), user_id: z.string() }),
  z.object({
    type: z.literal("cursor_moved"),
    user_id: z.string(),
    user_name: z.string(),
    x: z.number(),
    y: z.number(),
  }),
  z.object({
    type: z.literal("class_dragged"),
    class_id: z.string(),
    user_id: z.string(),
    user_name: z.string(),
    x: z.number(),
    y: z.number(),
  }),
  z.object({ type: z.literal("class_locked"), ...realtimeClassLockWireSchema.shape }),
  z.object({
    type: z.literal("class_lock_denied"),
    class_id: z.string(),
    user_id: z.string().nullable().optional(),
    user_name: z.string().nullable().optional(),
  }),
  z.object({ type: z.literal("class_unlocked"), class_id: z.string(), user_id: z.string() }),
  z.object({
    type: z.literal("diagram_mutation"),
    operation_type: z.string(),
    data: z.record(z.string(), z.unknown()),
    sender_id: z.string(),
  }),
  z.object({ type: z.literal("role_changed"), role: z.enum(["OWNER", "EDITOR", "READER"]) }),
  z.object({
    type: z.literal("agent_message_accepted"),
    project_id: z.string().uuid(),
    message_id: z.string().uuid(),
    user_id: z.string(),
    author_name: z.string(),
    author_avatar_url: z.string().nullable().optional().default(null),
    prompt: z.string().min(1),
    image_url: z.string().nullable(),
    created_at: z.string(),
    status: z.enum(["queued", "running"]),
    cancel_requested: z.boolean().optional().default(false),
    response_markdown: z.string().nullable().optional().default(null),
  }),
  z.object({
    type: z.literal("agent_message_finished"),
    project_id: z.string().uuid(),
    message_id: z.string().uuid(),
    user_id: z.string(),
    author_name: z.string().optional(),
    author_avatar_url: z.string().nullable().optional().default(null),
    prompt: z.string(),
    image_url: z.string().nullable(),
    created_at: z.string(),
    status: z.enum(["completed", "partial", "failed", "cancelled"]),
    response_markdown: z.string().min(1),
  }),
  z.object({
    type: z.literal("agent_message_activity"),
    project_id: z.string().uuid(),
    message_id: z.string().uuid(),
    attempt_id: z.string().uuid(),
    sequence: z.number().int().positive(),
    activity_code: agentActivityCodeSchema,
    activity_type: agentActivityTypeSchema.optional(),
    occurred_at: z.string(),
  }),
  z.object({
    type: z.literal("agent_component_reserved"),
    ...realtimeAgentReservationWireSchema.shape,
  }),
  z.object({
    type: z.literal("agent_component_reservations_released"),
    project_id: z.string().uuid(),
    message_id: z.string().uuid(),
  }),
]);

export type RealtimeMessageWire = z.infer<typeof RealtimeMessageSchema>;
