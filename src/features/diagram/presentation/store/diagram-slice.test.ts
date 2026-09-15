import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { createStore } from "zustand/vanilla";
import { createDiagramSlice, type DiagramSlice } from "./diagram-slice.ts";

describe("DiagramSlice - applyRemoteMutation", () => {
  const setup = () => {
    return createStore<DiagramSlice>((...args) => createDiagramSlice(...args));
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
});
