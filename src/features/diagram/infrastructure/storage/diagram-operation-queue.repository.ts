import { openDB, type DBSchema, type IDBPDatabase } from "idb";
import type {
  CreateClassPayload,
  DiagramOperation,
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

/**
 * Normaliza operaciones CREATE legadas que no incluyan primaryAttribute.
 */
export function normalizeDiagramOperation(
  operation: DiagramOperation
): DiagramOperation {
  if (operation.kind === "CREATE") {
    const payload = operation.payload as CreateClassPayload;
    if (!payload.primaryAttribute) {
      return {
        ...operation,
        payload: {
          ...payload,
          primaryAttribute: {
            id: crypto.randomUUID(),
            name: "id",
            dataType: "UUID",
            position: 0,
            isPrimaryKey: true,
            isNullable: false,
          },
        },
      };
    }
  }
  return operation;
}

export const diagramOperationQueueRepositoryImpl: DiagramOperationQueueRepository = {
  async enqueue(
    operation: Omit<DiagramOperation, "sequence">
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
    };

    await store.add(completeOp);
    await tx.done;

    return completeOp;
  },

  async peekNext(
    viewerId: string,
    projectId: string
  ): Promise<DiagramOperation | null> {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index(INDEX_NAME);
    const range = makeProjectRange(viewerId, projectId);

    const cursor = await index.openCursor(range, "next");
    return cursor ? normalizeDiagramOperation(cursor.value) : null;
  },

  async getAllPending(
    viewerId: string,
    projectId: string
  ): Promise<DiagramOperation[]> {
    const db = await getDb();
    const tx = db.transaction(STORE_NAME, "readonly");
    const index = tx.objectStore(STORE_NAME).index(INDEX_NAME);
    const range = makeProjectRange(viewerId, projectId);

    const operations: DiagramOperation[] = [];
    let cursor = await index.openCursor(range, "next");
    while (cursor) {
      operations.push(normalizeDiagramOperation(cursor.value));
      cursor = await cursor.continue();
    }

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
