import { z } from "zod";

export const agentMessageWireSchema = z.object({
  message_id: z.string().uuid(),
  project_id: z.string().uuid(),
  user_id: z.string(),
  author_name: z.string().optional(),
  author_avatar_url: z.string().nullable().optional().default(null),
  prompt: z.string(),
  image_url: z.string().nullable(),
  status: z.enum(["running", "completed", "failed", "cancelled", "queued"]),
  cancel_requested: z.boolean().optional().default(false),
  response_markdown: z.string().nullable().optional().default(null),
  created_at: z.string(),
});

export const agentMessagePageWireSchema = z.object({
  items: z.array(agentMessageWireSchema),
  limit: z.number().int(),
  offset: z.number().int(),
  next_offset: z.number().int().nullable(),
  has_more: z.boolean(),
  snapshot_at: z.string(),
});

export const agentMessageActiveWireSchema = z.object({
  message: agentMessageWireSchema.nullable(),
});

export type AgentMessageWire = z.infer<typeof agentMessageWireSchema>;
export type AgentMessagePageWire = z.infer<typeof agentMessagePageWireSchema>;
export type AgentMessageActiveWire = z.infer<typeof agentMessageActiveWireSchema>;
