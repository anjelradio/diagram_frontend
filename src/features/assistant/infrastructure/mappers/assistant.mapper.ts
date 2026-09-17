import type {
  AgentActivity,
  ImageCommandResult,
  VoiceCommandResult,
} from "../../domain/entities/agent-activity.entity";
import type {
  AgentActivityListItemWire,
  ImageCommandResultWire,
  VoiceCommandResultWire,
} from "../schemas/assistant.schemas";

export function mapAgentActivityListItemToEntity(
  wire: AgentActivityListItemWire
): AgentActivity {
  return {
    id: wire.id,
    projectId: wire.project_id,
    transcription: wire.transcription ?? null,
    resume: wire.resume ?? null,
    imageUrl: wire.image_url ?? null,
    state: wire.state,
    createdDate: wire.created_date,
  };
}

export function mapAgentActivityListToEntities(
  wires: AgentActivityListItemWire[]
): AgentActivity[] {
  return wires.map(mapAgentActivityListItemToEntity);
}

export function mapVoiceCommandResultToEntity(
  wire: VoiceCommandResultWire
): VoiceCommandResult {
  return {
    activityId: wire.activity_id,
    state: wire.state,
    transcription: wire.transcription ?? null,
    resume: wire.resume ?? null,
    actionsCount: wire.actions_count,
    actions: wire.actions.map((a) => ({
      type: a.type,
      status: a.status,
      summary: a.summary,
    })),
  };
}

export function mapImageCommandResultToEntity(
  wire: ImageCommandResultWire
): ImageCommandResult {
  return {
    activityId: wire.activity_id,
    state: wire.state,
    transcription: wire.transcription ?? null,
    resume: wire.resume ?? null,
    imageUrl: wire.image_url ?? null,
    actionsCount: wire.actions_count,
    actions: wire.actions.map((a) => ({
      type: a.type,
      status: a.status,
      summary: a.summary,
    })),
  };
}
