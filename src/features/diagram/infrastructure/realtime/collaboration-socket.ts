import { getJWT } from "@/features/shared/infrastructure/http/jwt-manager";
import type { CollaborationRole } from "../../domain/entities/collaboration.entity";

export type CollaborationMessage = {
  type: string;
  [key: string]: unknown;
};

type CollaborationSocketOptions = {
  projectId: string;
  role: CollaborationRole;
  onMessage: (message: CollaborationMessage) => void;
  onStatus?: (status: "connecting" | "connected" | "disconnected") => void;
};

export class CollaborationSocket {
  private socket: WebSocket | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private retry = 0;

  constructor(private readonly options: CollaborationSocketOptions) {}

  async connect(): Promise<void> {
    this.stopped = false;
    const token = await getJWT();
    if (!token || this.stopped) return;
    this.options.onStatus?.("connecting");
    const raw = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
    const wsBase = raw.replace(/^http/, "ws").replace(/\/$/, "");
    const url = `${wsBase}/ws/projects/${this.options.projectId}?token=${encodeURIComponent(token)}`;
    this.socket = new WebSocket(url);
    this.socket.onopen = () => {
      this.retry = 0;
      this.options.onStatus?.("connected");
    };
    this.socket.onmessage = (event) => {
      try {
        const parsed = JSON.parse(event.data) as CollaborationMessage;
        this.options.onMessage(parsed);
      } catch {
        // Ignorar mensajes no JSON sin romper la sesión.
      }
    };
    this.socket.onclose = () => {
      this.socket = null;
      this.options.onStatus?.("disconnected");
      if (!this.stopped) this.scheduleReconnect();
    };
    this.socket.onerror = () => this.socket?.close();
  }

  private scheduleReconnect(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    const delay = Math.min(1000 * 2 ** this.retry, 10000);
    this.retry += 1;
    this.retryTimer = setTimeout(() => void this.connect(), delay);
  }

  send(message: CollaborationMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(message));
    return true;
  }

  close(): void {
    this.stopped = true;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    this.socket?.close();
    this.socket = null;
  }
}

let activeSocket: CollaborationSocket | null = null;
export function setActiveCollaborationSocket(socket: CollaborationSocket | null): void {
  activeSocket = socket;
}
export function sendCollaborationMessage(message: CollaborationMessage): boolean {
  return activeSocket?.send(message) ?? false;
}
