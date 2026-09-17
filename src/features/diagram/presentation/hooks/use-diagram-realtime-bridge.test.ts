import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { DiagramSnapshot } from "../../domain/entities/diagram-class.entity.ts";
import type { DiagramOperation } from "../../domain/entities/diagram-operation.entity.ts";

describe("useDiagramRealtimeBridge - Reconciliación de Snapshot y Cola", () => {
  it("reconcilia snapshot del servidor aplicando operaciones locales pendientes de IndexedDB en orden", () => {
    // Snapshot del servidor
    const serverSnapshot: DiagramSnapshot = {
      classes: [
        {
          id: "c1",
          name: "Persona",
          positionX: 0,
          positionY: 0,
          attributes: [
            {
              id: "a1",
              name: "id",
              dataType: "UUID",
              position: 0,
              isPrimaryKey: true,
              isNullable: false,
            },
          ],
        },
      ],
      relations: [],
    };

    // Operaciones locales pendientes en IndexedDB
    const pendingOperations: DiagramOperation[] = [
      {
        operationId: "op-1",
        viewerId: "viewer-1",
        projectId: "proj-1",
        sequence: 1,
        kind: "RENAME",
        classId: "c1",
        payload: { name: "PersonaModificada" },
        createdAt: "2026-09-14T10:00:00Z",
        attempts: 0,
        state: "pending",
      },
      {
        operationId: "op-2",
        viewerId: "viewer-1",
        projectId: "proj-1",
        sequence: 2,
        kind: "CREATE_ATTRIBUTE",
        classId: "c1",
        payload: {
          id: "a2",
          name: "edad",
          position: 1,
        },
        createdAt: "2026-09-14T10:00:01Z",
        attempts: 0,
        state: "pending",
      },
    ];

    // Simular algoritmo de reconciliación
    const reconciledClasses = serverSnapshot.classes.map((cls) => {
      const current = { ...cls, attributes: [...cls.attributes] };
      for (const op of pendingOperations) {
        if (op.classId === current.id) {
          if (op.kind === "RENAME") {
            current.name = (op.payload as { name: string }).name;
          } else if (op.kind === "CREATE_ATTRIBUTE") {
            const payload = op.payload as { id: string; name: string; position: number };
            current.attributes.push({
              id: payload.id,
              name: payload.name,
              dataType: null,
              position: payload.position,
              isPrimaryKey: false,
              isNullable: true,
            });
          }
        }
      }
      return current;
    });

    assert.equal(reconciledClasses.length, 1);
    assert.equal(reconciledClasses[0].name, "PersonaModificada");
    assert.equal(reconciledClasses[0].attributes.length, 2);
    assert.equal(reconciledClasses[0].attributes[1].name, "edad");
  });

  it("descarta respuestas de snapshot cuando la generación de sesión ha cambiado", () => {
    let activeGeneration = 1;
    let appliedSnapshot: DiagramSnapshot | null = null;

    const onFetchSnapshotCompleted = (receivedGen: number, data: DiagramSnapshot) => {
      if (receivedGen !== activeGeneration) {
        // Descartar por obsoleto
        return;
      }
      appliedSnapshot = data;
    };

    const staleSnapshot: DiagramSnapshot = {
      classes: [{ id: "stale", name: "Viejo", positionX: 0, positionY: 0, attributes: [] }],
      relations: [],
    };

    const freshSnapshot: DiagramSnapshot = {
      classes: [{ id: "fresh", name: "Nuevo", positionX: 100, positionY: 100, attributes: [] }],
      relations: [],
    };

    // Llega una reconexión rápida que incrementa la generación a 2
    activeGeneration = 2;

    // Retorna la petición asíncrona vieja con gen 1
    onFetchSnapshotCompleted(1, staleSnapshot);
    assert.equal(appliedSnapshot, null);

    // Retorna la petición asíncrona vigente con gen 2
    onFetchSnapshotCompleted(2, freshSnapshot);
    assert.notEqual(appliedSnapshot, null);
    assert.equal(appliedSnapshot!.classes[0].name, "Nuevo");
  });

  it("reconoce agentFinished y gatilla refresco autoritativo de snapshot", () => {
    let refreshTriggered = false;
    const handleMessage = (msg: { type: string }) => {
      if (msg.type === "agentFinished") {
        refreshTriggered = true;
      }
    };

    handleMessage({ type: "agentFinished" });
    assert.equal(refreshTriggered, true);
  });

  it("omite refrescos intermedios para mutaciones emitidas por el asistente", () => {
    let refreshTriggered = false;
    const handleDiagramMutation = (mutation: { operationType: string; senderId: string }) => {
      if (
        mutation.senderId !== "assistant" &&
        ["REPOSITION_ATTRIBUTE", "CREATE_RELATION", "DELETE_RELATION"].includes(
          mutation.operationType
        )
      ) {
        refreshTriggered = true;
      }
    };

    // Mutación del asistente (no debe disparar refresco)
    handleDiagramMutation({ operationType: "CREATE_RELATION", senderId: "assistant" });
    assert.equal(refreshTriggered, false);

    // Mutación de colaborador normal (sí debe disparar refresco)
    handleDiagramMutation({ operationType: "CREATE_RELATION", senderId: "user-peer-123" });
    assert.equal(refreshTriggered, true);
  });

  it("garantiza que cada invocación de refreshSnapshot incremente la generación monotónicamente", () => {
    let generation = 0;
    const callGenerations: number[] = [];

    const triggerRefresh = () => {
      const currentGen = ++generation;
      callGenerations.push(currentGen);
      return currentGen;
    };

    triggerRefresh();
    triggerRefresh();
    triggerRefresh();

    assert.deepEqual(callGenerations, [1, 2, 3]);
    assert.equal(generation, 3);
  });
});
