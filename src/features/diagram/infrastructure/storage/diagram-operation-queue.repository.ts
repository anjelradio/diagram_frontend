import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  CreateClassPayload,
  DiagramOperation,
  DiagramOperationInput,
} from "../../domain/entities/diagram-operation.entity";
import type { DiagramOperationQueueRepository } from "../../domain/repositories/diagram-operation-queue.repository";

interface DiagramOperationsDB extends DBSchema {
  operations: {
    key: string;
    value: DiagramOperation;
    indexes: {
      by_project_sequence: [string, string, number];
    };
  };
}

const DB_NAME = "diagram_operations_db";
const DB_VERSION = 1;
const STORE_NAME = "operations";
const INDEX_NAME = "by_project_sequence";

let dbPromise: Promise<IDBPDatabase<DiagramOperationsDB>> | null = null;

function getDb(): Promise<IDBPDatabase<DiagramOperationsDB>> {
  if (typeof window === "undefined") {
    return Promise.reject(
      new Error("IndexedDB no está disponible en un entorno de servidor (SSR).")
    );
  }

  if (!dbPromise) {
    dbPromise = openDB<DiagramOperationsDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          const store = db.createObjectStore(STORE_NAME, {
            keyPath: "operationId",
          });
          store.createIndex(INDEX_NAME, [
            "viewerId",
            "projectId",
            "sequence",
          ]);
        }
      },
    });
  }

  return dbPromise;
}

function makeProjectRange(
  viewerId: string,
  projectId: string
): IDBKeyRange {
  return IDBKeyRange.bound(
    [viewerId, projectId, 0],
    [viewerId, projectId, Number.MAX_SAFE_INTEGER]
  );
}

export const VALID_OPERATION_KINDS = new Set([
  "CREATE_CLASS",
  "RENAME_CLASS",
  "MOVE_CLASS",
  "DELETE_CLASS",
  "CREATE",
  "RENAME",
  "MOVE",
  "DELETE",
  "CREATE_ATTRIBUTE",
  "UPDATE_ATTRIBUTE",
  "REPOSITION_ATTRIBUTE",
  "DELETE_ATTRIBUTE",
  "CREATE_RELATION",
  "RENAME_RELATION",
  "DELETE_RELATION",
]);

/**
 * Normaliza operaciones legadas (* -> *_CLASS) y asegura primaryAttribute canónica.
 * Rechaza operaciones con kinds desconocidos o datos inválidos.
 */
export function normalizeDiagramOperation(
  operation: unknown
): DiagramOperation {
  if (!operation || typeof operation !== "object" || !("kind" in operation)) {
    throw new Error("Operación de diagrama corrupta o inválida");
  }

  const op = operation as Record<string, unknown>;
  const kind = typeof op.kind === "string" ? op.kind : "";
  if (!VALID_OPERATION_KINDS.has(kind)) {
    throw new Error(`Kind de operación desconocido o no soportado: ${kind}`);
  }

  if (op.kind === "CREATE" || op.kind === "CREATE_CLASS") {
    const payload = (op.payload || {}) as CreateClassPayload;
    const primaryAttribute = payload.primaryAttribute || {
      id: crypto.randomUUID(),
      name: "id" as const,
      dataType: "UUID" as const,
      position: 0 as const,
      isPrimaryKey: true as const,
      isNullable: false as const,
    };
    return {
      operationId: op.operationId,
      viewerId: op.viewerId,
      projectId: op.projectId,
      sequence: op.sequence,
      createdAt: op.createdAt,
      attempts: op.attempts ?? 0,
      nextAttemptAt: op.nextAttemptAt,
      state: op.state ?? "pending",
      kind: "CREATE_CLASS",
      classId: op.classId,
      payload: {
        ...payload,
        primaryAttribute,
      },
    } as DiagramOperation;
  }

  if (op.kind === "RENAME") {
    return {
      ...op,
      kind: "RENAME_CLASS",
    } as DiagramOperation;
  }

  if (op.kind === "MOVE") {
    return {
      ...op,
      kind: "MOVE_CLASS",
    } as DiagramOperation;
  }

  if (op.kind === "DELETE") {
    return {
      ...op,
      kind: "DELETE_CLASS",
    } as DiagramOperation;
  }

  return op as DiagramOperation;
}

export const diagramOperationQueueRepositoryImpl: DiagramOperationQueueRepository = {
  async enqueue(
    operation: DiagramOperationInput
  ): Promise<DiagramOperation> {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index(INDEX_NAME);

    const range = makeProjectRange(operation.viewerId, operation.projectId);
    let highestSequence = 0;

    const cursor = await index.openCursor(range, "prev");
    if (cursor) {
      highestSequence = cursor.value.sequence;
    }

    const nextSequence = highestSequence + 1;
    const completeOp: DiagramOperation = {
      ...operation,
      sequence: nextSequence,
    } as DiagramOperation;

    await store.add(completeOp);
    await tx.done;

    return completeOp;
  },

  async peekNext(
    viewerId: string,
    projectId: string
  ): Promise<DiagramOperation | null> {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index(INDEX_NAME);
    const range = makeProjectRange(viewerId, projectId);

    const cursor = await index.openCursor(range, "next");
    if (!cursor) {
      await tx.done;
      return null;
    }

    const raw = cursor.value;
    const normalized = normalizeDiagramOperation(raw);

    // Si la operación requirió migración, reescribir durablemente en IndexedDB
    if (raw.kind !== normalized.kind || JSON.stringify(raw.payload) !== JSON.stringify(normalized.payload)) {
      await cursor.update(normalized);
    }
    await tx.done;

    return normalized;
  },

  async getAllPending(
    viewerId: string,
    projectId: string
  ): Promise<DiagramOperation[]> {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index(INDEX_NAME);
    const range = makeProjectRange(viewerId, projectId);

    const operations: DiagramOperation[] = [];
    let cursor = await index.openCursor(range, "next");
    while (cursor) {
      const raw = cursor.value;
      const normalized = normalizeDiagramOperation(raw);

      if (raw.kind !== normalized.kind || JSON.stringify(raw.payload) !== JSON.stringify(normalized.payload)) {
        await cursor.update(normalized);
      }
      operations.push(normalized);
      cursor = await cursor.continue();
    }
    await tx.done;

    return operations;
  },

  async update(operation: DiagramOperation): Promise<void> {
    const db = await getDb();
    await db.put(STORE_NAME, operation);
  },

  async dequeue(operationId: string): Promise<void> {
    const db = await getDb();
    await db.delete(STORE_NAME, operationId);
  },

  async countPending(viewerId: string, projectId: string): Promise<number> {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index(INDEX_NAME);
    const range = makeProjectRange(viewerId, projectId);

    return index.count(range);
  },

  async clearProjectQueue(
    viewerId: string,
    projectId: string
  ): Promise<void> {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index(INDEX_NAME);
    const range = makeProjectRange(viewerId, projectId);

    let cursor = await index.openCursor(range);
    while (cursor) {
      await cursor.delete();
      cursor = await cursor.continue();
    }
    await tx.done;
  },

  async resetBlockedOperations(
    viewerId: string,
    projectId: string
  ): Promise<number> {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const index = store.index(INDEX_NAME);
    const range = makeProjectRange(viewerId, projectId);

    let resetCount = 0;
    let cursor = await index.openCursor(range);
    while (cursor) {
      if (cursor.value.state === "blocked") {
        const updated: DiagramOperation = {
          ...cursor.value,
          state: "pending",
          attempts: 0,
          nextAttemptAt: undefined,
        };
        await cursor.update(updated);
        resetCount++;
      }
      cursor = await cursor.continue();
    }
    await tx.done;
    return resetCount;
  },
};
