import type { AgentMessage, AgentMessagePage } from "../../domain/entities/agent-message.entity";
import type {
  AgentMessageActiveWire,
  AgentMessagePageWire,
  AgentMessageWire,
} from "../schemas/assistant.schemas";

export function mapAgentMessageToEntity(wire: AgentMessageWire): AgentMessage {
  return {
    id: wire.message_id,
    projectId: wire.project_id,
    userId: wire.user_id,
    authorName: wire.author_name ?? wire.user_id,
    authorAvatarUrl: wire.author_avatar_url ?? null,
    prompt: wire.prompt,
    imageUrl: wire.image_url,
    status: wire.status,
    cancelRequested: wire.cancel_requested,
    responseMarkdown: wire.response_markdown,
    createdAt: wire.created_at,
  };
}

export function mapAgentMessagePageToEntity(wire: AgentMessagePageWire): AgentMessagePage {
  return {
    items: wire.items.map(mapAgentMessageToEntity),
    limit: wire.limit,
    offset: wire.offset,
    nextOffset: wire.next_offset,
    hasMore: wire.has_more,
    snapshotAt: wire.snapshot_at,
  };
}

export function mapActiveAgentMessageToEntity(
  wire: AgentMessageActiveWire,
): AgentMessage | null {
  return wire.message ? mapAgentMessageToEntity(wire.message) : null;
}
