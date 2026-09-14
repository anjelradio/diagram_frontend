import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { DiagramSnapshot } from "../../domain/entities/diagram-class.entity.ts";
import type { CreateRelationOperation, DiagramOperation } from "../../domain/entities/diagram-operation.entity.ts";
import {
  projectDiagramOperation,
  projectDiagramOperations,
} from "./diagram-operation-projector.ts";

describe("DiagramOperationProjector", () => {
  const initialSnapshot: DiagramSnapshot = {
    classes: [
      {
        id: "class-1",
        name: "Author",
        positionX: 100,
        positionY: 100,
        attributes: [
          {
            id: "attr-1",
            name: "id",
            dataType: "UUID",
            position: 0,
            isPrimaryKey: true,
            isNullable: false,
          },
        ],
      },
      {
        id: "class-2",
        name: "Book",
        positionX: 400,
        positionY: 100,
        attributes: [
          {
            id: "attr-2",
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

  it("proyecta CREATE_RELATION con FOREIGN_KEY añadiendo el atributo FK a la clase receptora", () => {
    const op: CreateRelationOperation = {
      operationId: "op-1",
      viewerId: "viewer-1",
      projectId: "proj-1",
      sequence: 1,
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: "pending",
      kind: "CREATE_RELATION",
      payload: {
        id: "rel-1",
        name: "Escribe",
        relationType: "ASSOCIATION",
        source: {
          classId: "class-1",
          handle: "RIGHT_CENTER",
          cardinality: "1",
        },
        target: {
          classId: "class-2",
          handle: "LEFT_CENTER",
          cardinality: "0..*",
        },
        materialization: {
          strategy: "FOREIGN_KEY",
          foreignAttributes: [
            {
              id: "fk-1",
              classId: "class-2",
              name: "author_id",
              dataType: "UUID",
              position: 1,
              isPrimaryKey: false,
              isNullable: false,
              isForeignKey: true,
              referencedClassId: "class-1",
              relationId: "rel-1",
            },
          ],
          sharedPrimaryKey: null,
          bridgeClass: null,
        },
      },
    };

    const result = projectDiagramOperation(initialSnapshot, op);
    assert.equal(result.relations.length, 1);
    assert.equal(result.relations[0].id, "rel-1");

    const book = result.classes.find((c) => c.id === "class-2");
    assert.ok(book);
    assert.equal(book.attributes.length, 2);
    const fk = book.attributes.find((a) => a.id === "fk-1");
    assert.ok(fk);
    assert.equal(fk.name, "author_id");
    assert.equal(fk.isForeignKey, true);
  });

  it("proyecta CREATE_RELATION con BRIDGE_CLASS creando la clase puente con su PK y 2 FK", () => {
    const op: CreateRelationOperation = {
      operationId: "op-2",
      viewerId: "viewer-1",
      projectId: "proj-1",
      sequence: 1,
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: "pending",
      kind: "CREATE_RELATION",
      payload: {
        id: "rel-bridge-1",
        name: "",
        relationType: "ASSOCIATION",
        source: {
          classId: "class-1",
          handle: "RIGHT_CENTER",
          cardinality: "0..*",
        },
        target: {
          classId: "class-2",
          handle: "LEFT_CENTER",
          cardinality: "1..*",
        },
        materialization: {
          strategy: "BRIDGE_CLASS",
          foreignAttributes: [],
          sharedPrimaryKey: null,
          bridgeClass: {
            id: "bridge-1",
            name: "AuthorBook",
            positionX: 250,
            positionY: 280,
            handle: "TOP_CENTER",
            primaryAttribute: {
              id: "bridge-pk-1",
              name: "id",
              dataType: "UUID",
              position: 0,
              isPrimaryKey: true,
              isNullable: false,
            },
            foreignAttributes: [
              {
                id: "bridge-fk-1",
                classId: "bridge-1",
                name: "author_id",
                dataType: "UUID",
                position: 1,
                isPrimaryKey: false,
                isNullable: false,
                isForeignKey: true,
                referencedClassId: "class-1",
                relationId: "rel-bridge-1",
              },
              {
                id: "bridge-fk-2",
                classId: "bridge-1",
                name: "book_id",
                dataType: "UUID",
                position: 2,
                isPrimaryKey: false,
                isNullable: false,
                isForeignKey: true,
                referencedClassId: "class-2",
                relationId: "rel-bridge-1",
              },
            ],
          },
        },
      },
    };

    const result = projectDiagramOperation(initialSnapshot, op);
    assert.equal(result.relations.length, 1);
    assert.equal(result.relations[0].bridge?.classId, "bridge-1");

    assert.equal(result.classes.length, 3);
    const bridge = result.classes.find((c) => c.id === "bridge-1");
    assert.ok(bridge);
    assert.equal(bridge.name, "AuthorBook");
    assert.equal(bridge.positionX, 250);
    assert.equal(bridge.positionY, 280);
    assert.equal(bridge.attributes.length, 3);

    // Permite agregar atributos normales al puente a continuación
    const addAttrOp: DiagramOperation = {
      operationId: "op-3",
      viewerId: "viewer-1",
      projectId: "proj-1",
      sequence: 2,
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: "pending",
      kind: "CREATE_ATTRIBUTE",
      classId: "bridge-1",
      payload: {
        id: "attr-extra",
        name: "royalty_rate",
        position: 3,
      },
    };

    const resultWithExtraAttr = projectDiagramOperation(result, addAttrOp);
    const updatedBridge = resultWithExtraAttr.classes.find((c) => c.id === "bridge-1");
    assert.ok(updatedBridge);
    assert.equal(updatedBridge.attributes.length, 4);
    assert.equal(updatedBridge.attributes[3].name, "royalty_rate");
  });

  it("proyecta DELETE_RELATION retirando la relación y sus artefactos generados", () => {
    // Primero creamos una relación con FK
    const createOp: CreateRelationOperation = {
      operationId: "op-1",
      viewerId: "viewer-1",
      projectId: "proj-1",
      sequence: 1,
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: "pending",
      kind: "CREATE_RELATION",
      payload: {
        id: "rel-1",
        name: "Escribe",
        relationType: "ASSOCIATION",
        source: {
          classId: "class-1",
          handle: "RIGHT_CENTER",
          cardinality: "1",
        },
        target: {
          classId: "class-2",
          handle: "LEFT_CENTER",
          cardinality: "0..*",
        },
        materialization: {
          strategy: "FOREIGN_KEY",
          foreignAttributes: [
            {
              id: "fk-1",
              classId: "class-2",
              name: "author_id",
              dataType: "UUID",
              position: 1,
              isPrimaryKey: false,
              isNullable: false,
              isForeignKey: true,
              referencedClassId: "class-1",
              relationId: "rel-1",
            },
          ],
          sharedPrimaryKey: null,
          bridgeClass: null,
        },
      },
    };

    const withRelation = projectDiagramOperation(initialSnapshot, createOp);
    assert.equal(withRelation.relations.length, 1);

    // Ahora eliminamos la relación
    const deleteOp: DiagramOperation = {
      operationId: "op-delete",
      viewerId: "viewer-1",
      projectId: "proj-1",
      sequence: 2,
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: "pending",
      kind: "DELETE_RELATION",
      relationId: "rel-1",
      payload: { relationId: "rel-1" },
    };

    const finalResult = projectDiagramOperation(withRelation, deleteOp);
    assert.equal(finalResult.relations.length, 0);

    const book = finalResult.classes.find((c) => c.id === "class-2");
    assert.ok(book);
    assert.equal(book.attributes.length, 1); // Solo la PK original
    assert.equal(book.attributes[0].id, "attr-2");
  });

  it("proyecta RENAME_RELATION actualizando el nombre de relaciones estándar e ignorando N:M", () => {
    const baseSnapshot: DiagramSnapshot = {
      classes: [...initialSnapshot.classes],
      relations: [
        {
          id: "rel-std",
          name: "Original",
          relationType: "ASSOCIATION",
          source: { classId: "class-1", handle: "RIGHT_CENTER", cardinality: "1" },
          target: { classId: "class-2", handle: "LEFT_CENTER", cardinality: "0..*" },
          bridge: null,
        },
        {
          id: "rel-bridge",
          name: "",
          relationType: "ASSOCIATION",
          source: { classId: "class-1", handle: "BOTTOM_CENTER", cardinality: "0..*" },
          target: { classId: "class-2", handle: "BOTTOM_CENTER", cardinality: "1..*" },
          bridge: { classId: "bridge-1", handle: "TOP_CENTER" },
        },
      ],
    };

    // Renombrar relación estándar
    const renameStdOp: DiagramOperation = {
      operationId: "op-ren-std",
      viewerId: "v1",
      projectId: "p1",
      sequence: 1,
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: "pending",
      kind: "RENAME_RELATION",
      relationId: "rel-std",
      payload: { relationId: "rel-std", name: "Renombrado" },
    };

    const res1 = projectDiagramOperation(baseSnapshot, renameStdOp);
    assert.equal(res1.relations.find((r) => r.id === "rel-std")?.name, "Renombrado");

    // Intento de renombrar relación N:M (el projector ignora la mutación de nombre)
    const renameBridgeOp: DiagramOperation = {
      operationId: "op-ren-bridge",
      viewerId: "v1",
      projectId: "p1",
      sequence: 2,
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: "pending",
      kind: "RENAME_RELATION",
      relationId: "rel-bridge",
      payload: { relationId: "rel-bridge", name: "IntentoInvalido" },
    };

    const res2 = projectDiagramOperation(res1, renameBridgeOp);
    assert.equal(res2.relations.find((r) => r.id === "rel-bridge")?.name, "");
  });

  it("proyecta DELETE_RELATION con clase puente retirando la clase puente y la relación", () => {
    const snapshotWithBridge: DiagramSnapshot = {
      classes: [
        ...initialSnapshot.classes,
        {
          id: "bridge-1",
          name: "AuthorBook",
          positionX: 250,
          positionY: 280,
          attributes: [
            {
              id: "b-pk",
              name: "id",
              dataType: "UUID",
              position: 0,
              isPrimaryKey: true,
              isNullable: false,
            },
          ],
        },
      ],
      relations: [
        {
          id: "rel-bridge-1",
          name: "",
          relationType: "ASSOCIATION",
          source: { classId: "class-1", handle: "BOTTOM_CENTER", cardinality: "0..*" },
          target: { classId: "class-2", handle: "BOTTOM_CENTER", cardinality: "1..*" },
          bridge: { classId: "bridge-1", handle: "TOP_CENTER" },
        },
      ],
    };

    const deleteBridgeOp: DiagramOperation = {
      operationId: "op-del-bridge",
      viewerId: "v1",
      projectId: "p1",
      sequence: 1,
      createdAt: new Date().toISOString(),
      attempts: 0,
      state: "pending",
      kind: "DELETE_RELATION",
      relationId: "rel-bridge-1",
      payload: { relationId: "rel-bridge-1" },
    };

    const res = projectDiagramOperation(snapshotWithBridge, deleteBridgeOp);
    assert.equal(res.relations.length, 0);
    assert.equal(res.classes.find((c) => c.id === "bridge-1"), undefined);
    assert.equal(res.classes.length, 2);
  });

  it("reproduce determinísticamente múltiples operaciones ordenadas por secuencia (projectDiagramOperations)", () => {
    const ops: DiagramOperation[] = [
      {
        operationId: "op-2",
        viewerId: "v1",
        projectId: "p1",
        sequence: 2,
        createdAt: new Date().toISOString(),
        attempts: 0,
        state: "pending",
        kind: "RENAME_RELATION",
        relationId: "rel-1",
        payload: { relationId: "rel-1", name: "EscribeMuchasObras" },
      },
      {
        operationId: "op-1",
        viewerId: "v1",
        projectId: "p1",
        sequence: 1,
        createdAt: new Date().toISOString(),
        attempts: 0,
        state: "pending",
        kind: "CREATE_RELATION",
        payload: {
          id: "rel-1",
          name: "Escribe",
          relationType: "ASSOCIATION",
          source: { classId: "class-1", handle: "RIGHT_CENTER", cardinality: "1" },
          target: { classId: "class-2", handle: "LEFT_CENTER", cardinality: "0..*" },
          materialization: {
            strategy: "FOREIGN_KEY",
            foreignAttributes: [
              {
                id: "fk-1",
                classId: "class-2",
                name: "author_id",
                dataType: "UUID",
                position: 1,
                isPrimaryKey: false,
                isNullable: false,
                isForeignKey: true,
                referencedClassId: "class-1",
                relationId: "rel-1",
              },
            ],
            sharedPrimaryKey: null,
            bridgeClass: null,
          },
        },
      },
    ];

    const replayed = projectDiagramOperations(initialSnapshot, ops);
    assert.equal(replayed.relations.length, 1);
    assert.equal(replayed.relations[0].name, "EscribeMuchasObras");
    const book = replayed.classes.find((c) => c.id === "class-2");
    assert.ok(book?.attributes.some((a) => a.id === "fk-1"));
  });
});
