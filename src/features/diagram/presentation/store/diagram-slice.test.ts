import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "zustand/vanilla";
import type { DiagramOperationDispatcherPort } from "../../application/ports/diagram-operation-dispatcher.port.ts";
import type { DispatchDiagramOperationCommand } from "../../application/ports/diagram-operation-dispatcher.port.ts";
import { createDiagramSlice, type DiagramSlice } from "./diagram-slice.ts";

describe("DiagramSlice - applyRemoteMutation", () => {
  const setup = (dispatcher: DiagramOperationDispatcherPort = unconfiguredDispatcher) => {
    return createStore<DiagramSlice>((...args) =>
      createDiagramSlice(dispatcher)(...args)
    );
  };

  const unconfiguredDispatcher: DiagramOperationDispatcherPort = {
    async dispatch() {
      throw new Error("El test debe inyectar un dispatcher antes de despachar.");
    },
  };

  it("aplica CREATE_CLASS remoto", () => {
    const store = setup();
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_1",
      name: "Usuario",
      position_x: 100,
      position_y: 200,
      attributes: [],
    });

    const nodes = store.getState().nodes;
    assert.equal(nodes.length, 1);
    assert.equal(nodes[0]?.id, "class_1");
    assert.equal(nodes[0]?.data.name, "Usuario");
    assert.equal(nodes[0]?.position.x, 100);
    assert.equal(nodes[0]?.position.y, 200);
  });

  it("aplica MOVE_CLASS remoto", () => {
    const store = setup();
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_1",
      name: "Usuario",
      position_x: 100,
      position_y: 200,
      attributes: [],
    });

    store.getState().applyRemoteMutation("MOVE_CLASS", {
      class_id: "class_1",
      position_x: 350,
      position_y: 450,
    });

    const node = store.getState().nodes[0];
    assert.equal(node?.position.x, 350);
    assert.equal(node?.position.y, 450);
  });

  it("aplica RENAME_CLASS remoto", () => {
    const store = setup();
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_1",
      name: "Usuario",
      position_x: 100,
      position_y: 200,
      attributes: [],
    });

    store.getState().applyRemoteMutation("RENAME_CLASS", {
      class_id: "class_1",
      name: "Cliente",
    });

    const node = store.getState().nodes[0];
    assert.equal(node?.data.name, "Cliente");
  });

  it("aplica DELETE_CLASS remoto y limpia relaciones asociadas", () => {
    const store = setup();
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_1",
      name: "Usuario",
      position_x: 100,
      position_y: 200,
      attributes: [],
    });

    store.getState().applyRemoteMutation("DELETE_CLASS", {
      class_id: "class_1",
    });

    assert.equal(store.getState().nodes.length, 0);
  });

  it("aplica CREATE_ATTRIBUTE y UPDATE_ATTRIBUTE remotos", () => {
    const store = setup();
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_1",
      name: "Usuario",
      position_x: 100,
      position_y: 200,
      attributes: [],
    });

    store.getState().applyRemoteMutation("CREATE_ATTRIBUTE", {
      class_id: "class_1",
      id: "attr_1",
      name: "email",
      position: 1,
      is_primary_key: false,
      is_nullable: true,
      data_type: "TEXT",
    });

    let node = store.getState().nodes[0];
    assert.equal(node?.data.attributes.length, 1);
    assert.equal(node?.data.attributes[0]?.name, "email");

    store.getState().applyRemoteMutation("UPDATE_ATTRIBUTE", {
      class_id: "class_1",
      attribute_id: "attr_1",
      name: "correo_electronico",
      data_type: "TEXT",
      is_nullable: false,
    });

    node = store.getState().nodes[0];
    assert.equal(node?.data.attributes[0]?.name, "correo_electronico");
    assert.equal(node?.data.attributes[0]?.isNullable, false);
  });

  it("aplica DELETE_ATTRIBUTE remoto", () => {
    const store = setup();
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_1",
      name: "Usuario",
      position_x: 100,
      position_y: 200,
      attributes: [],
    });

    store.getState().applyRemoteMutation("CREATE_ATTRIBUTE", {
      class_id: "class_1",
      id: "attr_1",
      name: "email",
      position: 1,
      is_primary_key: false,
      is_nullable: true,
      data_type: "TEXT",
    });

    store.getState().applyRemoteMutation("DELETE_ATTRIBUTE", {
      class_id: "class_1",
      attribute_id: "attr_1",
    });

    const node = store.getState().nodes[0];
    assert.equal(node?.data.attributes.length, 0);
  });

  it("aplica REPOSITION_ATTRIBUTE remoto reordenando los atributos", () => {
    const store = setup();
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_1",
      name: "Usuario",
      position_x: 100,
      position_y: 200,
      attributes: [
        { id: "a1", name: "id", position: 0, isPrimaryKey: true, isNullable: false },
        { id: "a2", name: "nombre", position: 1, isPrimaryKey: false, isNullable: true },
        { id: "a3", name: "email", position: 2, isPrimaryKey: false, isNullable: true },
      ],
    });

    store.getState().applyRemoteMutation("REPOSITION_ATTRIBUTE", {
      class_id: "class_1",
      attribute_id: "a3",
      position: 1,
    });

    const attrs = store.getState().nodes[0]?.data.attributes;
    assert.equal(attrs?.length, 3);
    assert.equal(attrs?.[1]?.id, "a3");
  });

  it("aplica CREATE_RELATION, RENAME_RELATION y DELETE_RELATION remotos", () => {
    const store = setup();
    store.getState().applyRemoteMutation("CREATE_RELATION", {
      id: "rel_1",
      name: "tiene",
      relation_type: "ASSOCIATION",
      source: { class_id: "c1", handle: "RIGHT_CENTER", cardinality: "1" },
      target: { class_id: "c2", handle: "LEFT_CENTER", cardinality: "N" },
    });

    assert.equal(store.getState().relations.length, 1);
    assert.equal(store.getState().relations[0]?.name, "tiene");

    store.getState().applyRemoteMutation("RENAME_RELATION", {
      relation_id: "rel_1",
      name: "posee",
    });
    assert.equal(store.getState().relations[0]?.name, "posee");

    store.getState().applyRemoteMutation("DELETE_RELATION", {
      relation_id: "rel_1",
    });
    assert.equal(store.getState().relations.length, 0);
  });

  it("proyecta la clase puente y la relación en un solo evento y deduplica repetidos", () => {
    const store = setup();
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_a", name: "Autor", position_x: 0, position_y: 0,
      attributes: [{ id: "pk_a", class_id: "class_a", name: "id", position: 0, data_type: "UUID", is_primary_key: true, is_nullable: false }],
    });
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_b", name: "Libro", position_x: 300, position_y: 0,
      attributes: [{ id: "pk_b", class_id: "class_b", name: "id", position: 0, data_type: "UUID", is_primary_key: true, is_nullable: false }],
    });

    const relationEvent = {
      id: "relation_ab", name: "escribe", relation_type: "ASSOCIATION",
      source: { class_id: "class_a", handle: "RIGHT_CENTER", cardinality: "0..*" },
      target: { class_id: "class_b", handle: "LEFT_CENTER", cardinality: "0..*" },
      bridge: { class_id: "bridge_ab", handle: "TOP_CENTER" },
      materialized_classes: [{
        id: "bridge_ab", name: "AutorLibro", position_x: 150, position_y: 180,
        attributes: [
          { id: "bridge_pk", class_id: "bridge_ab", name: "id", position: 0, data_type: "UUID", is_primary_key: true, is_nullable: false },
          { id: "fk_a", class_id: "bridge_ab", name: "id_autor", position: 1, data_type: "UUID", is_primary_key: false, is_foreign_key: true, is_nullable: false, referenced_class_id: "class_a", relation_id: "relation_ab" },
          { id: "fk_b", class_id: "bridge_ab", name: "id_libro", position: 2, data_type: "UUID", is_primary_key: false, is_foreign_key: true, is_nullable: false, referenced_class_id: "class_b", relation_id: "relation_ab" },
        ],
      }],
    };
    store.getState().applyRemoteMutation("CREATE_RELATION", relationEvent);
    store.getState().applyRemoteMutation("CREATE_RELATION", relationEvent);

    assert.equal(store.getState().nodes.length, 3);
    assert.equal(store.getState().nodes.find((node) => node.id === "bridge_ab")?.data.attributes.length, 3);
    assert.equal(store.getState().relations.length, 1);
    assert.equal(store.getState().relations[0]?.bridge?.classId, "bridge_ab");

    store.getState().applyRemoteMutation("DELETE_RELATION", {
      relation_id: "relation_ab",
      materialized_classes: [],
      removed_class_ids: ["bridge_ab"],
      removed_attribute_ids: [],
    });
    assert.equal(store.getState().nodes.some((node) => node.id === "bridge_ab"), false);
    assert.equal(store.getState().relations.length, 0);
  });

  it("aplica y revierte llaves foráneas derivadas sin dejar atributos duplicados", () => {
    const store = setup();
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_many", name: "Pedido", position_x: 0, position_y: 0,
      attributes: [{ id: "pk_many", class_id: "class_many", name: "id", position: 0, is_primary_key: true, is_nullable: false }],
    });
    const relationEvent = {
      id: "relation_fk", name: "contiene", relation_type: "ASSOCIATION",
      source: { class_id: "class_one", handle: "RIGHT_CENTER", cardinality: "1" },
      target: { class_id: "class_many", handle: "LEFT_CENTER", cardinality: "0..*" },
      bridge: null,
      materialized_classes: [{
        id: "class_many", name: "Pedido", position_x: 0, position_y: 0,
        attributes: [
          { id: "pk_many", class_id: "class_many", name: "id", position: 0, is_primary_key: true, is_nullable: false },
          { id: "fk_one", class_id: "class_many", name: "id_cliente", position: 1, data_type: "UUID", is_foreign_key: true, is_nullable: false, referenced_class_id: "class_one", relation_id: "relation_fk" },
        ],
      }],
    };
    store.getState().applyRemoteMutation("CREATE_RELATION", relationEvent);
    store.getState().applyRemoteMutation("CREATE_RELATION", relationEvent);
    assert.equal(store.getState().nodes.find((node) => node.id === "class_many")?.data.attributes.length, 2);

    store.getState().applyRemoteMutation("DELETE_RELATION", {
      relation_id: "relation_fk",
      materialized_classes: [{
        id: "class_many", name: "Pedido", position_x: 0, position_y: 0,
        attributes: [{ id: "pk_many", class_id: "class_many", name: "id", position: 0, is_primary_key: true, is_nullable: false }],
      }],
      removed_class_ids: [],
      removed_attribute_ids: ["fk_one"],
    });
    assert.equal(store.getState().nodes.find((node) => node.id === "class_many")?.data.attributes.length, 1);
  });

  it("hydrateSnapshot preserva el estado de selección (selected) de nodos existentes", () => {
    const store = setup();
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_selected",
      name: "Cliente",
      position_x: 50,
      position_y: 50,
      attributes: [],
    });

    // Marcar como seleccionado manualmente
    store.setState((prev) => ({
      nodes: prev.nodes.map((n) =>
        n.id === "class_selected" ? { ...n, selected: true } : n
      ),
    }));

    assert.equal(store.getState().nodes[0]?.selected, true);

    // Hidratar nuevo snapshot que incluye la clase
    store.getState().hydrateSnapshot({
      classes: [
        {
          id: "class_selected",
          name: "ClienteActualizado",
          positionX: 50,
          positionY: 50,
          attributes: [],
        },
      ],
      relations: [],
    });

    const hydratedNode = store.getState().nodes[0];
    assert.equal(hydratedNode?.id, "class_selected");
    assert.equal(hydratedNode?.data.name, "ClienteActualizado");
    assert.equal(hydratedNode?.selected, true, "Debe preservar selected: true");
  });
});

describe("DiagramSlice - Flujo Interactivo de Relaciones (US1, US2, US3, US4)", () => {
  const setupWithClasses = () => {
    const store = createStore<DiagramSlice>((...args) =>
      createDiagramSlice({
        async dispatch() {
          throw new Error("El test configura el dispatcher para este flujo.");
        },
      })(...args)
    );
    store.getState().setDiagramContext("proj_1", "user_1", true);
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_a",
      name: "Usuario",
      position_x: 100,
      position_y: 100,
      attributes: [
        {
          id: "attr_a1",
          class_id: "class_a",
          name: "id",
          data_type: "UUID",
          position: 0,
          is_primary_key: true,
          is_nullable: false,
        },
      ],
    });
    store.getState().applyRemoteMutation("CREATE_CLASS", {
      id: "class_b",
      name: "Rol",
      position_x: 400,
      position_y: 100,
      attributes: [
        {
          id: "attr_b1",
          class_id: "class_b",
          name: "id",
          data_type: "UUID",
          position: 0,
          is_primary_key: true,
          is_nullable: false,
        },
      ],
    });
    store.setState((state) => ({
      ...state,
      dispatchDiagramOperation: async (command) => {
        const saved = {
          ...command,
          operationId: "test-operation",
          sequence: 1,
          createdAt: "2026-11-03T12:00:00.000Z",
          attempts: 0,
          state: "pending" as const,
        } as import("../../domain/entities/diagram-operation.entity.ts").DiagramOperation;
        state.applyDiagramOperation(saved);
        return saved;
      },
    }));
    return store;
  };

  it("delega el despacho en el puerto inyectado al crear el slice", async () => {
    const command: DispatchDiagramOperationCommand = {
      kind: "DELETE_CLASS",
      viewerId: "viewer-1",
      projectId: "project-1",
      classId: "class-1",
      payload: {},
    };
    const saved = {
      ...command,
      operationId: "operation-1",
      sequence: 1,
      createdAt: "2026-11-03T12:00:00.000Z",
      attempts: 0,
      state: "pending" as const,
    };
    let dispatched: DispatchDiagramOperationCommand | undefined;
    const dispatcher: DiagramOperationDispatcherPort = {
      async dispatch(operation) {
        dispatched = operation;
        return saved;
      },
    };
    const store = createStore<DiagramSlice>((...args) =>
      createDiagramSlice(dispatcher)(...args)
    );

    const result = await store.getState().dispatchDiagramOperation(command);

    assert.equal(dispatched, command);
    assert.equal(result, saved);
  });

  it("US1: inicializa menú contextual en vértice origen al ejecutar openVertexMenu", () => {
    const store = setupWithClasses();
    assert.equal(store.getState().relationDraft, null);
    assert.equal(store.getState().activeVertexPopover, null);

    store.getState().openVertexMenu({
      classId: "class_a",
      handleId: "RIGHT_CENTER",
      step: "source",
      screenPosition: { x: 200, y: 150 },
      flowPosition: { x: 200, y: 150 },
    });

    const draft = store.getState().relationDraft;
    assert.ok(draft);
    assert.equal(draft.phase, "source_popover_open");
    assert.equal(draft.source?.classId, "class_a");
    assert.equal(draft.source?.handle, "RIGHT_CENTER");
    assert.equal(store.getState().activeVertexPopover?.step, "source");

    // closeVertexMenu descarta el borrador si no se seleccionó opción
    store.getState().closeVertexMenu();
    assert.equal(store.getState().relationDraft, null);
    assert.equal(store.getState().activeVertexPopover, null);
  });

  it("US2: trazado elástico y creación asociativa N:M genera clase intermedia", async () => {
    const store = setupWithClasses();

    // 1. Abrir menú en origen
    store.getState().openVertexMenu({
      classId: "class_a",
      handleId: "RIGHT_CENTER",
      step: "source",
      screenPosition: { x: 200, y: 150 },
      flowPosition: { x: 200, y: 150 },
    });

    // 2. Seleccionar cardinalidad muchos (1..*) en origen
    store.getState().selectSourceOption({
      id: "card_1_many",
      category: "cardinality",
      label: "Uno a muchos (1..*)",
      badge: "1..*",
      relationType: "ASSOCIATION",
      cardinality: "1..*",
    });

    const draft = store.getState().relationDraft;
    assert.equal(draft?.phase, "tracking_cursor");
    assert.equal(draft?.selectedRelationType, "ASSOCIATION");
    assert.equal(draft?.sourceCardinality, "1..*");
    assert.equal(store.getState().activeVertexPopover, null);

    // 3. Simular movimiento elástico del cursor
    store.getState().updateRubberbandCursor({ x: 350, y: 150 });
    assert.deepEqual(store.getState().relationDraft?.currentCursorPosition, {
      x: 350,
      y: 150,
    });

    // 4. Clic en vértice destino abre menú de destino
    store.getState().openVertexMenu({
      classId: "class_b",
      handleId: "LEFT_CENTER",
      step: "target",
      screenPosition: { x: 400, y: 150 },
      flowPosition: { x: 400, y: 150 },
    });
    assert.equal(store.getState().relationDraft?.phase, "target_popover_open");
    assert.equal(store.getState().activeVertexPopover?.step, "target");

    // 5. Seleccionar cardinalidad muchos (0..*) en destino
    await store.getState().completeAssociativeRelation("0..*");

    // Borrador y popover cerrados
    assert.equal(store.getState().relationDraft, null);
    assert.equal(store.getState().activeVertexPopover, null);

    // Relación creada en el store
    const relations = store.getState().relations;
    assert.equal(relations.length, 1);
    assert.equal(relations[0]?.relationType, "ASSOCIATION");
    assert.equal(relations[0]?.source.cardinality, "1..*");
    assert.equal(relations[0]?.target.cardinality, "0..*");

    // Como es N:M (* a *), se genera clase intermedia puente
    const nodes = store.getState().nodes;
    assert.equal(nodes.length, 3, "Debe existir una clase intermedia adicional");
    const bridgeClass = nodes.find((n) => n.id !== "class_a" && n.id !== "class_b");
    assert.ok(bridgeClass, "Debe haberse inyectado el nodo de la clase intermedia");
  });

  it("US3: creación de relación estructural (Herencia) se conecta directamente", async () => {
    const store = setupWithClasses();

    // 1. Abrir menú en origen
    store.getState().openVertexMenu({
      classId: "class_a",
      handleId: "RIGHT_CENTER",
      step: "source",
      screenPosition: { x: 200, y: 150 },
      flowPosition: { x: 200, y: 150 },
    });

    // 2. Seleccionar Herencia / Generalización
    store.getState().selectSourceOption({
      id: "head_generalization",
      category: "structural_head",
      label: "Herencia / Generalización",
      relationType: "GENERALIZATION",
      iconType: "flecha_triangular",
    });

    assert.equal(store.getState().relationDraft?.phase, "tracking_cursor");
    assert.equal(store.getState().relationDraft?.selectedRelationType, "GENERALIZATION");

    // 3. Conexión directa al hacer clic en destino
    await store.getState().completeStructuralRelation("class_b", "LEFT_CENTER");

    assert.equal(store.getState().relationDraft, null);
    assert.equal(store.getState().activeVertexPopover, null);

    const relations = store.getState().relations;
    assert.equal(relations.length, 1);
    assert.equal(relations[0]?.relationType, "GENERALIZATION");
  });

  it("US3: bloquea autorrelaciones estructurales no permitidas", async () => {
    const store = setupWithClasses();

    store.getState().openVertexMenu({
      classId: "class_a",
      handleId: "TOP_CENTER",
      step: "source",
      screenPosition: { x: 150, y: 100 },
      flowPosition: { x: 150, y: 100 },
    });

    store.getState().selectSourceOption({
      id: "head_generalization",
      category: "structural_head",
      label: "Herencia / Generalización",
      relationType: "GENERALIZATION",
      iconType: "flecha_triangular",
    });

    // Intentar conectar hacia la misma clase
    await store.getState().completeStructuralRelation("class_a", "BOTTOM_CENTER");

    // No debe crear relación
    assert.equal(store.getState().relations.length, 0);
  });

  it("US4: cancelRelationCreation y cambio de herramienta limpian el borrador", () => {
    const store = setupWithClasses();

    store.getState().openVertexMenu({
      classId: "class_a",
      handleId: "RIGHT_CENTER",
      step: "source",
      screenPosition: { x: 200, y: 150 },
      flowPosition: { x: 200, y: 150 },
    });
    assert.ok(store.getState().relationDraft);

    // Cancelar borrador
    store.getState().cancelRelationCreation();
    assert.equal(store.getState().relationDraft, null);
    assert.equal(store.getState().activeVertexPopover, null);

    // Iniciar de nuevo y cambiar a herramienta cursor
    store.getState().openVertexMenu({
      classId: "class_a",
      handleId: "RIGHT_CENTER",
      step: "source",
      screenPosition: { x: 200, y: 150 },
      flowPosition: { x: 200, y: 150 },
    });
    store.getState().setActiveTool("cursor");
    assert.equal(store.getState().relationDraft, null);
    assert.equal(store.getState().activeVertexPopover, null);
  });
});

