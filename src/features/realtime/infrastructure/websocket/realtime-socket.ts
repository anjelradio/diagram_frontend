import type {
  RealtimeConnectionStatus,
  RealtimeRole,
  RealtimeServerMessage,
} from "../../domain/entities/realtime.entity.ts";
import { realtimeMapper } from "../mappers/realtime.mapper.ts";
import { RealtimeMessageSchema } from "../schemas/realtime.schemas.ts";

export type RealtimeClientMessage =
  | { type: "ping" }
  | { type: "cursor_move"; x: number; y: number }
  | { type: "class_drag"; class_id: string; x: number; y: number }
  | { type: "class_lock_acquire"; class_id: string }
  | { type: "class_lock_release"; class_id: string };

export type RealtimeSocketOptions = {
  projectId: string;
  role: RealtimeRole;
  onMessage: (message: RealtimeServerMessage) => void;
  onStatus?: (status: RealtimeConnectionStatus) => void;
  getToken?: () => Promise<string | null>;
};

export class RealtimeSocket {
  private socket: WebSocket | null = null;
  private retryTimer: ReturnType<typeof setTimeout> | null = null;
  private stopped = false;
  private retry = 0;
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null;
  private generation = 0;

  // Throttling independiente para cursor (30ms -> ~33 fps)
  private lastCursorAt = 0;
  private pendingCursorTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingCursorMessage: RealtimeClientMessage | null = null;

  // Throttling independiente para arrastre de clases (25ms -> ~40 fps)
  private lastDragAt = 0;
  private pendingDragTimer: ReturnType<typeof setTimeout> | null = null;
  private pendingDragMessage: RealtimeClientMessage | null = null;

  private readonly options: RealtimeSocketOptions;

  constructor(options: RealtimeSocketOptions) {
    this.options = options;
  }

  async connect(): Promise<void> {
    this.stopped = false;
    const currentGen = ++this.generation;

    const token = this.options.getToken
      ? await this.options.getToken()
      : await (async () => {
          const mod = await import(
            "@/features/shared/infrastructure/http/jwt-manager"
          );
          return mod.getJWT();
        })();

    if (!token || this.stopped || currentGen !== this.generation) return;

    this.options.onStatus?.("connecting");
    const raw =
      process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000/api";
    const wsBase = raw.replace(/^http/, "ws").replace(/\/$/, "");
    const url = `${wsBase}/ws/projects/${this.options.projectId}?token=${encodeURIComponent(
      token
    )}`;

    const ws = new WebSocket(url);
    this.socket = ws;

    ws.onopen = () => {
      if (this.stopped || currentGen !== this.generation) {
        ws.close();
        return;
      }
      this.retry = 0;
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = setInterval(
        () => this.send({ type: "ping" }),
        25000
      );
      this.options.onStatus?.("connected");
    };

    ws.onmessage = (event) => {
      if (this.stopped || currentGen !== this.generation) return;
      try {
        const parsed: unknown = JSON.parse(event.data);
        const result = RealtimeMessageSchema.safeParse(parsed);
        if (result.success) {
          this.options.onMessage(realtimeMapper.toDomain(result.data));
        }
      } catch {
        // Ignorar mensajes no JSON sin romper la sesión.
      }
    };

    ws.onclose = () => {
      if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
      if (this.socket === ws) {
        this.socket = null;
      }
      if (currentGen === this.generation) {
        this.options.onStatus?.("disconnected");
        if (!this.stopped) this.scheduleReconnect();
      }
    };

    ws.onerror = () => {
      if (this.socket === ws) {
        this.socket.close();
      }
    };
  }

  private scheduleReconnect(): void {
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    const delay = Math.min(1000 * 2 ** this.retry, 10000);
    this.retry += 1;
    this.retryTimer = setTimeout(() => void this.connect(), delay);
  }

  private sendRaw(message: RealtimeClientMessage): boolean {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) return false;
    this.socket.send(JSON.stringify(message));
    return true;
  }

  private sendCursorMove(message: RealtimeClientMessage): boolean {
    const now = performance.now();
    const elapsed = now - this.lastCursorAt;
    const INTERVAL = 30; // ~33 fps

    if (elapsed >= INTERVAL) {
      if (this.pendingCursorTimer) {
        clearTimeout(this.pendingCursorTimer);
        this.pendingCursorTimer = null;
      }
      this.pendingCursorMessage = null;
      this.lastCursorAt = now;
      return this.sendRaw(message);
    }

    this.pendingCursorMessage = message;
    if (!this.pendingCursorTimer) {
      this.pendingCursorTimer = setTimeout(() => {
        this.pendingCursorTimer = null;
        if (this.pendingCursorMessage) {
          const msg = this.pendingCursorMessage;
          this.pendingCursorMessage = null;
          this.lastCursorAt = performance.now();
          this.sendRaw(msg);
        }
      }, Math.max(0, INTERVAL - elapsed));
    }
    return true;
  }

  private sendClassDrag(message: RealtimeClientMessage): boolean {
    const now = performance.now();
    const elapsed = now - this.lastDragAt;
    const INTERVAL = 25; // ~40 fps

    if (elapsed >= INTERVAL) {
      if (this.pendingDragTimer) {
        clearTimeout(this.pendingDragTimer);
        this.pendingDragTimer = null;
      }
      this.pendingDragMessage = null;
      this.lastDragAt = now;
      return this.sendRaw(message);
    }

    this.pendingDragMessage = message;
    if (!this.pendingDragTimer) {
      this.pendingDragTimer = setTimeout(() => {
        this.pendingDragTimer = null;
        if (this.pendingDragMessage) {
          const msg = this.pendingDragMessage;
          this.pendingDragMessage = null;
          this.lastDragAt = performance.now();
          this.sendRaw(msg);
        }
      }, Math.max(0, INTERVAL - elapsed));
    }
    return true;
  }

  send(message: RealtimeClientMessage): boolean {
    if (message.type === "cursor_move") {
      return this.sendCursorMove(message);
    }
    if (message.type === "class_drag") {
      return this.sendClassDrag(message);
    }
    return this.sendRaw(message);
  }

  close(): void {
    this.stopped = true;
    this.generation++;
    if (this.retryTimer) clearTimeout(this.retryTimer);
    if (this.heartbeatTimer) clearInterval(this.heartbeatTimer);
    if (this.pendingCursorTimer) clearTimeout(this.pendingCursorTimer);
    if (this.pendingDragTimer) clearTimeout(this.pendingDragTimer);
    this.pendingCursorTimer = null;
    this.pendingDragTimer = null;
    this.pendingCursorMessage = null;
    this.pendingDragMessage = null;
    this.socket?.close();
    this.socket = null;
  }
}

let activeSocket: RealtimeSocket | null = null;
export function setActiveRealtimeSocket(socket: RealtimeSocket | null): void {
  activeSocket = socket;
}
export function sendRealtimeMessage(message: RealtimeClientMessage): boolean {
  return activeSocket?.send(message) ?? false;
}
