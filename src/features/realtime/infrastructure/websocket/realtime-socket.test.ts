import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { RealtimeSocket } from "./realtime-socket.ts";

describe("RealtimeSocket - Throttling, Trailing Edge y Generación", () => {
  it("limita class_drag a 40fps y despacha la posición final con trailing edge", async () => {
    const originalNow = performance.now;
    let mockTime = 1000;
    performance.now = () => mockTime;

    try {
      const socket = new RealtimeSocket({
        projectId: "proj-1",
        role: "EDITOR",
        onMessage: () => {},
      });

      const sentPayloads: string[] = [];
      const mockWs = {
        readyState: 1, // WebSocket.OPEN
        send: (data: string) => {
          sentPayloads.push(data);
        },
        close: () => {},
      };

      (socket as unknown as { socket: typeof mockWs }).socket = mockWs;

      // Enviar primer evento de arrastre (t=1000): debe enviarse inmediatamente
      const res1 = socket.send({ type: "class_drag", class_id: "c1", x: 10, y: 10 });
      assert.equal(res1, true);
      assert.equal(sentPayloads.length, 1);
      assert.deepEqual(JSON.parse(sentPayloads[0]), { type: "class_drag", class_id: "c1", x: 10, y: 10 });

      // Enviar eventos rápidos dentro de la ventana de 25ms (t=1005): deben acumularse en trailing edge
      mockTime = 1005;
      socket.send({ type: "class_drag", class_id: "c1", x: 20, y: 20 });
      socket.send({ type: "class_drag", class_id: "c1", x: 30, y: 30 });
      socket.send({ type: "class_drag", class_id: "c1", x: 50, y: 50 });

      // En este instante no se debieron enviar más mensajes sincrónicos
      assert.equal(sentPayloads.length, 1);

      // Avanzar tiempo para que cuando se ejecute el temporizador esté después de 25ms
      mockTime = 1040;
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Debe haberse emitido exactamente el último valor (x: 50, y: 50)
      assert.equal(sentPayloads.length, 2);
      assert.deepEqual(JSON.parse(sentPayloads[1]), { type: "class_drag", class_id: "c1", x: 50, y: 50 });

      socket.close();
    } finally {
      performance.now = originalNow;
    }
  });

  it("limita cursor_move de forma desacoplada a class_drag", async () => {
    const originalNow = performance.now;
    let mockTime = 2000;
    performance.now = () => mockTime;

    try {
      const socket = new RealtimeSocket({
        projectId: "proj-1",
        role: "EDITOR",
        onMessage: () => {},
      });

      const sentPayloads: string[] = [];
      const mockWs = {
        readyState: 1,
        send: (data: string) => {
          sentPayloads.push(data);
        },
        close: () => {},
      };

      (socket as unknown as { socket: typeof mockWs }).socket = mockWs;

      // Enviar un cursor y un drag casi al mismo tiempo: ambos primeros deben salir de inmediato
      socket.send({ type: "cursor_move", x: 100, y: 100 });
      socket.send({ type: "class_drag", class_id: "c1", x: 10, y: 10 });

      assert.equal(sentPayloads.length, 2);
      assert.equal(JSON.parse(sentPayloads[0]).type, "cursor_move");
      assert.equal(JSON.parse(sentPayloads[1]).type, "class_drag");

      // Enviar ráfaga de cursores dentro de ventana: deben agruparse con trailing edge
      mockTime = 2005;
      socket.send({ type: "cursor_move", x: 110, y: 110 });
      socket.send({ type: "cursor_move", x: 120, y: 120 });
      assert.equal(sentPayloads.length, 2);

      mockTime = 2050;
      await new Promise((resolve) => setTimeout(resolve, 50));

      assert.equal(sentPayloads.length, 3);
      assert.deepEqual(JSON.parse(sentPayloads[2]), { type: "cursor_move", x: 120, y: 120 });

      socket.close();
    } finally {
      performance.now = originalNow;
    }
  });

  it("descarta mensajes y callbacks cuando la conexión o generación queda obsoleta", async () => {
    const receivedMessages: unknown[] = [];
    const socket = new RealtimeSocket({
      projectId: "proj-1",
      role: "EDITOR",
      onMessage: (msg) => {
        receivedMessages.push(msg);
      },
      getToken: async () => "mock-jwt-token",
    });

    let messageCallback: ((e: { data: string }) => void) | null = null;
    let openCallback: (() => void) | null = null;

    class MockWebSocket {
      readyState = 1;
      set onopen(cb: () => void) {
        openCallback = cb;
      }
      set onmessage(cb: (e: { data: string }) => void) {
        messageCallback = cb;
      }
      set onclose(_cb: () => void) {}
      set onerror(_cb: () => void) {}
      send() {}
      close() {}
    }

    const originalWs = globalThis.WebSocket;
    (globalThis as unknown as { WebSocket: unknown }).WebSocket = MockWebSocket;

    try {
      await socket.connect();
      assert.ok(openCallback);
      assert.ok(messageCallback);

      // Despachar pong con conexión activa
      (messageCallback as (e: { data: string }) => void)({
        data: JSON.stringify({ type: "pong" }),
      });
      assert.equal(receivedMessages.length, 1);

      // Cerrar socket (avanza generación interna)
      socket.close();

      // Despachar nuevo mensaje en la conexión vieja: debe ser descartado
      (messageCallback as (e: { data: string }) => void)({
        data: JSON.stringify({ type: "pong" }),
      });
      assert.equal(receivedMessages.length, 1);
    } finally {
      globalThis.WebSocket = originalWs;
    }
  });

  it("limpia timers de heartbeat y throttle al cerrar el socket", () => {
    const socket = new RealtimeSocket({
      projectId: "proj-1",
      role: "EDITOR",
      onMessage: () => {},
    });

    const mockWs = {
      readyState: 1,
      send: () => {},
      close: () => {},
    };
    (socket as unknown as { socket: typeof mockWs }).socket = mockWs;

    socket.send({ type: "cursor_move", x: 1, y: 1 });
    socket.send({ type: "cursor_move", x: 2, y: 2 });
    socket.send({ type: "class_drag", class_id: "c1", x: 10, y: 10 });
    socket.send({ type: "class_drag", class_id: "c1", x: 20, y: 20 });

    socket.close();

    const internal = socket as unknown as {
      pendingCursorTimer: unknown;
      pendingDragTimer: unknown;
      heartbeatTimer: unknown;
      retryTimer: unknown;
      socket: unknown;
    };
    assert.equal(internal.pendingCursorTimer, null);
    assert.equal(internal.pendingDragTimer, null);
    assert.equal(internal.heartbeatTimer, null);
    assert.equal(internal.retryTimer, null);
    assert.equal(internal.socket, null);
  });
});
