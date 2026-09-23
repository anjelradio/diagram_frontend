import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { DiagramClassWithAttributes } from "../entities/diagram-class.entity.ts";
import {
  calculateBridgeClassPosition,
  generateBridgeClassName,
  generateForeignKeyName,
  planRelationCreation,
  resolveOptimalHandles,
} from "./diagram-relation-planner.ts";


describe("DiagramRelationPlanner Service", () => {
  const mockClassA: DiagramClassWithAttributes = {
    id: "11111111-1111-4111-8111-111111111111",
    name: "Author",
    positionX: 100,
    positionY: 200,
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
  };

  const mockClassB: DiagramClassWithAttributes = {
    id: "22222222-2222-4222-8222-222222222222",
    name: "Book",
    positionX: 300,
    positionY: 400,
    attributes: [
      {
        id: "b1",
        name: "id",
        dataType: "UUID",
        position: 0,
        isPrimaryKey: true,
        isNullable: false,
      },
      {
        id: "b2",
        name: "title",
        dataType: "TEXT",
        position: 1,
        isPrimaryKey: false,
        isNullable: false,
      },
    ],
  };

  let idCounter = 1;
  const mockIdGen = () => `id-${idCounter++}`;

  describe("generateBridgeClassName", () => {
    it("genera el nombre PascalCase concatenando origen y destino", () => {
      assert.equal(generateBridgeClassName("Author", "Book", []), "AuthorBook");
      assert.equal(
        generateBridgeClassName("shopping_cart", "line-item", []),
        "ShoppingCartLineItem"
      );
    });

    it("resuelve colisiones de nombre agregando sufijos numéricos de forma insensible a mayúsculas", () => {
      assert.equal(
        generateBridgeClassName("Author", "Book", ["authorbook"]),
        "AuthorBook2"
      );
      assert.equal(
        generateBridgeClassName("Author", "Book", ["AuthorBook", "authorbook2"]),
        "AuthorBook3"
      );
    });
  });

  describe("calculateBridgeClassPosition", () => {
    it("calcula el centro horizontal y +180px vertical entre ambas clases", () => {
      const pos = calculateBridgeClassPosition(
        { x: 100, y: 200 },
        { x: 300, y: 400 }
      );
      assert.equal(pos.x, 200);
      assert.equal(pos.y, 480);
    });
  });

  describe("generateForeignKeyName", () => {
    it("genera el nombre snake_case terminado en _id", () => {
      assert.equal(generateForeignKeyName("Author", []), "author_id");
      assert.equal(generateForeignKeyName("ShoppingCart", []), "shopping_cart_id");
    });

    it("resuelve colisiones con atributos existentes", () => {
      assert.equal(
        generateForeignKeyName("Author", ["author_id"]),
        "author_id_2"
      );
    });
  });

  describe("planRelationCreation", () => {
    it("planifica Asociación N:M con BRIDGE_CLASS, nombre por defecto 'Nueva relación', PK y dos FK", () => {
      idCounter = 1;
      const planned = planRelationCreation({
        relationType: "ASSOCIATION",
        sourceClass: mockClassA,
        targetClass: mockClassB,
        sourceHandle: "RIGHT_CENTER",
        targetHandle: "LEFT_CENTER",
        sourceCardinality: "0..*",
        targetCardinality: "1..*",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.relation.name, "Nueva relación"); // US4: N:M tiene nombre por defecto
      assert.equal(planned.createRelationPayload.name, "Nueva relación");
      assert.equal(planned.materialization.strategy, "BRIDGE_CLASS");
      assert.ok(planned.materialization.bridgeClass);
      assert.equal(planned.materialization.bridgeClass.name, "AuthorBook");
      assert.equal(planned.materialization.bridgeClass.positionX, 200);
      assert.equal(planned.materialization.bridgeClass.positionY, 480);
      assert.equal(planned.materialization.bridgeClass.handle, "TOP_CENTER");

      // PK de la clase puente
      const pk = planned.materialization.bridgeClass.primaryAttribute;
      assert.equal(pk.name, "id");
      assert.equal(pk.position, 0);
      assert.equal(pk.isPrimaryKey, true);

      // Dos FK
      const fks = planned.materialization.bridgeClass.foreignAttributes;
      assert.equal(fks.length, 2);
      assert.equal(fks[0].referencedClassId, mockClassA.id);
      assert.equal(fks[0].position, 1);
      assert.equal(fks[1].referencedClassId, mockClassB.id);
      assert.equal(fks[1].position, 2);

      // Entidad puente lista para Zustand
      assert.ok(planned.bridgeClass);
      assert.equal(planned.bridgeClass.attributes.length, 3);
    });

    it("planifica Asociación N:M respetando nombre personalizado provisto", () => {
      idCounter = 1;
      const planned = planRelationCreation({
        name: "Escribe",
        relationType: "ASSOCIATION",
        sourceClass: mockClassA,
        targetClass: mockClassB,
        sourceHandle: "RIGHT_CENTER",
        targetHandle: "LEFT_CENTER",
        sourceCardinality: "0..*",
        targetCardinality: "1..*",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.relation.name, "Escribe");
      assert.equal(planned.createRelationPayload.name, "Escribe");
    });

    it("planifica Asociación N:M recursiva generando FKs diferenciadas con _a_id y _b_id", () => {
      idCounter = 1;
      const planned = planRelationCreation({
        relationType: "ASSOCIATION",
        sourceClass: mockClassA,
        targetClass: mockClassA,
        sourceHandle: "RIGHT_TOP",
        targetHandle: "RIGHT_BOTTOM",
        sourceCardinality: "0..*",
        targetCardinality: "0..*",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.materialization.strategy, "BRIDGE_CLASS");
      assert.ok(planned.materialization.bridgeClass);
      const fks = planned.materialization.bridgeClass.foreignAttributes;
      assert.equal(fks.length, 2);
      assert.equal(fks[0].name, "author_a_id");
      assert.equal(fks[1].name, "author_b_id");
      assert.equal(fks[0].referencedClassId, mockClassA.id);
      assert.equal(fks[1].referencedClassId, mockClassA.id);
    });

    it("planifica Asociación 1:N colocando FK en el lado con máximo * y nombre 'Nueva relación'", () => {
      idCounter = 1;
      const planned = planRelationCreation({
        relationType: "ASSOCIATION",
        sourceClass: mockClassA,
        targetClass: mockClassB,
        sourceHandle: "RIGHT_CENTER",
        targetHandle: "LEFT_CENTER",
        sourceCardinality: "1",
        targetCardinality: "0..*",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.relation.name, "Nueva relación");
      assert.equal(planned.materialization.strategy, "FOREIGN_KEY");
      assert.equal(planned.materialization.foreignAttributes.length, 1);
      const fk = planned.materialization.foreignAttributes[0];
      assert.equal(fk.classId, mockClassB.id); // Lado * (target)
      assert.equal(fk.referencedClassId, mockClassA.id); // Lado 1 (source)
      assert.equal(fk.position, 2); // b1 pos 0, b2 pos 1 -> nueva pos 2
      assert.equal(fk.isNullable, false); // sourceCardinality es "1" -> no nullable
    });

    it("planifica Asociación 1:1 colocando FK según cantidad de atributos (desempate en destino)", () => {
      idCounter = 1;
      // mockClassB tiene 2 atributos, mockClassA tiene 1 -> FK va a B
      const planned = planRelationCreation({
        relationType: "ASSOCIATION",
        sourceClass: mockClassA,
        targetClass: mockClassB,
        sourceHandle: "RIGHT_CENTER",
        targetHandle: "LEFT_CENTER",
        sourceCardinality: "0..1",
        targetCardinality: "1",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.relation.name, "Nueva relación");
      assert.equal(planned.materialization.strategy, "FOREIGN_KEY");
      const fk = planned.materialization.foreignAttributes[0];
      assert.equal(fk.classId, mockClassB.id);
      assert.equal(fk.referencedClassId, mockClassA.id);
      assert.equal(fk.isNullable, true); // sourceCardinality es 0..1
    });

    it("planifica Agregación con FK nullable en la parte (destino) y fuerza nombre vacío", () => {
      idCounter = 1;
      const planned = planRelationCreation({
        name: "IntentoDeNombre",
        relationType: "AGGREGATION",
        sourceClass: mockClassA, // Todo
        targetClass: mockClassB, // Parte
        sourceHandle: "BOTTOM_CENTER",
        targetHandle: "TOP_CENTER",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.relation.name, ""); // No asociativa: nombre vacío
      assert.equal(planned.createRelationPayload.name, "");
      assert.equal(planned.materialization.strategy, "FOREIGN_KEY");
      const fk = planned.materialization.foreignAttributes[0];
      assert.equal(fk.classId, mockClassB.id);
      assert.equal(fk.referencedClassId, mockClassA.id);
      assert.equal(fk.isNullable, true);
    });

    it("planifica Composición con FK no nullable en la parte (destino) y fuerza nombre vacío", () => {
      idCounter = 1;
      const planned = planRelationCreation({
        name: "IntentoDeNombre",
        relationType: "COMPOSITION",
        sourceClass: mockClassA, // Todo
        targetClass: mockClassB, // Parte
        sourceHandle: "BOTTOM_CENTER",
        targetHandle: "TOP_CENTER",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.relation.name, "");
      assert.equal(planned.createRelationPayload.name, "");
      assert.equal(planned.materialization.strategy, "FOREIGN_KEY");
      const fk = planned.materialization.foreignAttributes[0];
      assert.equal(fk.classId, mockClassB.id);
      assert.equal(fk.referencedClassId, mockClassA.id);
      assert.equal(fk.isNullable, false);
    });

    it("planifica Generalización con SHARED_PRIMARY_KEY en subclase (origen) y fuerza nombre vacío", () => {
      idCounter = 1;
      const planned = planRelationCreation({
        name: "IntentoDeNombre",
        relationType: "GENERALIZATION",
        sourceClass: mockClassA, // Subclase
        targetClass: mockClassB, // Superclase
        sourceHandle: "TOP_CENTER",
        targetHandle: "BOTTOM_CENTER",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.relation.name, "");
      assert.equal(planned.createRelationPayload.name, "");
      assert.equal(planned.materialization.strategy, "SHARED_PRIMARY_KEY");
      assert.ok(planned.materialization.sharedPrimaryKey);
      assert.equal(planned.materialization.sharedPrimaryKey.classId, mockClassA.id);
      assert.equal(
        planned.materialization.sharedPrimaryKey.referencedClassId,
        mockClassB.id
      );
      assert.equal(
        planned.materialization.sharedPrimaryKey.attributeId,
        mockClassA.attributes[0].id
      );
      assert.ok(planned.sharedPrimaryKeyAttribute);
      assert.equal(planned.sharedPrimaryKeyAttribute.isPrimaryKey, true);
      assert.equal(planned.sharedPrimaryKeyAttribute.isForeignKey, true);
    });

    it("planifica Realización con FK no nullable en implementador (origen) y fuerza nombre vacío", () => {
      idCounter = 1;
      const planned = planRelationCreation({
        name: "IntentoDeNombre",
        relationType: "REALIZATION",
        sourceClass: mockClassA, // Implementador
        targetClass: mockClassB, // Contrato
        sourceHandle: "RIGHT_CENTER",
        targetHandle: "LEFT_CENTER",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.relation.name, "");
      assert.equal(planned.createRelationPayload.name, "");
      assert.equal(planned.materialization.strategy, "FOREIGN_KEY");
      const fk = planned.materialization.foreignAttributes[0];
      assert.equal(fk.classId, mockClassA.id);
      assert.equal(fk.referencedClassId, mockClassB.id);
      assert.equal(fk.isNullable, false);
    });

    it("planifica Dependencia con FK nullable en cliente (origen) y fuerza nombre vacío", () => {
      idCounter = 1;
      const planned = planRelationCreation({
        name: "IntentoDeNombre",
        relationType: "DEPENDENCY",
        sourceClass: mockClassA, // Cliente
        targetClass: mockClassB, // Proveedor
        sourceHandle: "RIGHT_CENTER",
        targetHandle: "LEFT_CENTER",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.relation.name, "");
      assert.equal(planned.createRelationPayload.name, "");
      assert.equal(planned.materialization.strategy, "FOREIGN_KEY");
      const fk = planned.materialization.foreignAttributes[0];
      assert.equal(fk.classId, mockClassA.id);
      assert.equal(fk.referencedClassId, mockClassB.id);
      assert.equal(fk.isNullable, true);
    });

    it("planifica Asociación recursiva 1:N colocando FK nullable en la misma clase", () => {
      idCounter = 1;
      const planned = planRelationCreation({
        relationType: "ASSOCIATION",
        sourceClass: mockClassA,
        targetClass: mockClassA,
        sourceHandle: "RIGHT_TOP",
        targetHandle: "RIGHT_BOTTOM",
        sourceCardinality: "0..1",
        targetCardinality: "0..*",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.relation.name, "Nueva relación");
      assert.equal(planned.materialization.strategy, "FOREIGN_KEY");
      assert.equal(planned.materialization.foreignAttributes.length, 1);
      const fk = planned.materialization.foreignAttributes[0];
      assert.equal(fk.classId, mockClassA.id);
      assert.equal(fk.referencedClassId, mockClassA.id);
      assert.equal(fk.isNullable, true);
    });

    it("planifica Asociación recursiva N:M creando clase puente con 2 FKs a la misma entidad", () => {
      idCounter = 1;
      const planned = planRelationCreation({
        relationType: "ASSOCIATION",
        sourceClass: mockClassA,
        targetClass: mockClassA,
        sourceHandle: "RIGHT_TOP",
        targetHandle: "RIGHT_BOTTOM",
        sourceCardinality: "0..*",
        targetCardinality: "0..*",
        idGenerator: mockIdGen,
      });

      assert.equal(planned.materialization.strategy, "BRIDGE_CLASS");
      assert.ok(planned.materialization.bridgeClass);
      const fks = planned.materialization.bridgeClass.foreignAttributes;
      assert.equal(fks.length, 2);
      assert.equal(fks[0].referencedClassId, mockClassA.id);
      assert.equal(fks[1].referencedClassId, mockClassA.id);
      assert.notEqual(fks[0].name, fks[1].name); // Nombres diferenciados
    });
  });

  describe("resolveOptimalHandles", () => {
    it("asigna handles distintos para relaciones auto-referenciadas en la misma clase", () => {
      const { sourceHandle, targetHandle } = resolveOptimalHandles(
        { x: 100, y: 100 },
        { x: 100, y: 100 },
        [],
        "c_self",
        "c_self"
      );

      assert.notEqual(sourceHandle, targetHandle, "Los handles de una auto-relación deben ser distintos");
    });

    it("asigna BOTTOM a la clase superior y TOP a la clase inferior cuando una está arriba de otra", () => {
      // Producto arriba (y=100), Categoria abajo (y=400)
      const { sourceHandle, targetHandle } = resolveOptimalHandles(
        { x: 200, y: 100 },
        { x: 200, y: 400 },
        [],
        "c_producto",
        "c_categoria"
      );

      assert.ok(sourceHandle.startsWith("BOTTOM_"), `sourceHandle debió ser BOTTOM_*, fue: ${sourceHandle}`);
      assert.ok(targetHandle.startsWith("TOP_"), `targetHandle debió ser TOP_*, fue: ${targetHandle}`);
    });

    it("asigna TOP a la clase inferior y BOTTOM a la clase superior cuando el origen está abajo", () => {
      // Origen abajo (y=500), Destino arriba (y=100)
      const { sourceHandle, targetHandle } = resolveOptimalHandles(
        { x: 200, y: 500 },
        { x: 200, y: 100 },
        [],
        "c_abajo",
        "c_arriba"
      );

      assert.ok(sourceHandle.startsWith("TOP_"), `sourceHandle debió ser TOP_*, fue: ${sourceHandle}`);
      assert.ok(targetHandle.startsWith("BOTTOM_"), `targetHandle debió ser BOTTOM_*, fue: ${targetHandle}`);
    });

    it("asigna RIGHT a la clase izquierda y LEFT a la clase derecha en disposición horizontal", () => {
      const { sourceHandle, targetHandle } = resolveOptimalHandles(
        { x: 100, y: 200 },
        { x: 500, y: 200 },
        [],
        "c_izq",
        "c_der"
      );

      assert.ok(sourceHandle.startsWith("RIGHT_"), `sourceHandle debió ser RIGHT_*, fue: ${sourceHandle}`);
      assert.ok(targetHandle.startsWith("LEFT_"), `targetHandle debió ser LEFT_*, fue: ${targetHandle}`);
    });

    it("evita colisiones cuando múltiples relaciones parten de la misma clase hacia abajo", () => {
      const existingRelations: any[] = [];
      const srcId = "c_origen";

      // Primera relación hacia abajo-izquierda
      const rel1 = resolveOptimalHandles(
        { x: 300, y: 100 },
        { x: 100, y: 400 },
        existingRelations,
        srcId,
        "c_dest1"
      );
      existingRelations.push({
        source: { classId: srcId, handle: rel1.sourceHandle },
        target: { classId: "c_dest1", handle: rel1.targetHandle },
      });

      // Segunda relación hacia abajo-derecha
      const rel2 = resolveOptimalHandles(
        { x: 300, y: 100 },
        { x: 500, y: 400 },
        existingRelations,
        srcId,
        "c_dest2"
      );
      existingRelations.push({
        source: { classId: srcId, handle: rel2.sourceHandle },
        target: { classId: "c_dest2", handle: rel2.targetHandle },
      });

      // Tercera relación directamente abajo
      const rel3 = resolveOptimalHandles(
        { x: 300, y: 100 },
        { x: 300, y: 400 },
        existingRelations,
        srcId,
        "c_dest3"
      );

      // Los 3 handles de origen deben ser distintos para no solaparse
      const handles = new Set([rel1.sourceHandle, rel2.sourceHandle, rel3.sourceHandle]);
      assert.equal(handles.size, 3, "Las 3 relaciones debieron usar handles diferentes en la clase origen");
    });
  });
});


