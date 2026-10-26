import { z } from "zod";

export const agentActivityStateWireSchema = z.enum([
  "IN_PROGRESS",
  "FINISHED",
  "FAILED",
  "CANCELLED",
]);


export const voiceCommandActionResultWireSchema = z.object({
  type: z.string(),
  status: z.string(),
  summary: z.string(),
});

export const voiceCommandResultWireSchema = z.object({
  activity_id: z.string(),
  state: agentActivityStateWireSchema,
  transcription: z.string().nullable().optional(),
  resume: z.string().nullable().optional(),
  actions_count: z.number(),
  actions: z.array(voiceCommandActionResultWireSchema).default([]),
});

export const imageCommandResultWireSchema = z.object({
  activity_id: z.string(),
  state: agentActivityStateWireSchema,
  transcription: z.string().nullable().optional(),
  resume: z.string().nullable().optional(),
  image_url: z.string().nullable().optional(),
  actions_count: z.number(),
  actions: z.array(voiceCommandActionResultWireSchema).default([]),
});

export type VoiceCommandResultWire = z.infer<
  typeof voiceCommandResultWireSchema
>;
export type ImageCommandResultWire = z.infer<
  typeof imageCommandResultWireSchema
>;
