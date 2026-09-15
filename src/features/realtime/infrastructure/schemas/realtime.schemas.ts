import { z } from "zod";

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

/** Esquema canónico en snake_case de eventos entrantes vía WebSocket */
export const RealtimeMessageSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("pong") }),
  z.object({
    type: z.literal("presence_snapshot"),
    peers: z.array(realtimeUserWireSchema),
    class_locks: z.array(realtimeClassLockWireSchema),
    agent_lock: z.object({ user_id: z.string(), activity_id: z.string() }).nullable().optional(),
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
    type: z.literal("agent_lock"),
    user_id: z.string(),
    activity_id: z.string(),
  }),
  z.object({
    type: z.literal("agent_finished"),
    user_id: z.string(),
    activity_id: z.string(),
    state: z.string(),
  }),
]);

export type RealtimeMessageWire = z.infer<typeof RealtimeMessageSchema>;
