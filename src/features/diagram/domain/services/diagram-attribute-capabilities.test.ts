import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { DiagramAttribute } from "../entities/diagram-attribute.entity.ts";
import { deriveDiagramAttributeCapabilities } from "./diagram-attribute-capabilities.ts";

describe("DiagramAttributeCapabilities Service", () => {
  const manualAttribute: DiagramAttribute = {
    id: "attr-manual",
    name: "description",
    dataType: "TEXT",
    position: 1,
    isPrimaryKey: false,
    isNullable: true,
    isForeignKey: false,
  };

  const normalPrimaryKey: DiagramAttribute = {
    id: "attr-pk",
    name: "id",
    dataType: "UUID",
    position: 0,
    isPrimaryKey: true,
    isNullable: false,
    isForeignKey: false,
  };

  const secondaryForeignKey: DiagramAttribute = {
    id: "attr-fk",
    name: "author_id",
    dataType: "UUID",
    position: 2,
    isPrimaryKey: false,
    isNullable: false,
    isForeignKey: true,
    referencedClassId: "class-author",
    relationId: "rel-1",
  };

  const sharedPrimaryKey: DiagramAttribute = {
    id: "attr-shared-pk",
    name: "id",
    dataType: "UUID",
    position: 0,
    isPrimaryKey: true,
    isNullable: false,
    isForeignKey: true,
    referencedClassId: "class-super",
    relationId: "rel-gen",
  };

  describe("cuando canEditCanvas es false (modo Reader)", () => {
    it("bloquea todas las acciones para atributos manuales", () => {
      const caps = deriveDiagramAttributeCapabilities(manualAttribute, false);
      assert.deepEqual(caps, {
        canRename: false,
        canChangeType: false,
        canChangeNullable: false,
        canReposition: false,
        canDelete: false,
      });
    });

    it("bloquea todas las acciones para PK normal", () => {
      const caps = deriveDiagramAttributeCapabilities(normalPrimaryKey, false);
      assert.deepEqual(caps, {
        canRename: false,
        canChangeType: false,
        canChangeNullable: false,
        canReposition: false,
        canDelete: false,
      });
    });

    it("bloquea todas las acciones para FK secundaria", () => {
      const caps = deriveDiagramAttributeCapabilities(secondaryForeignKey, false);
      assert.deepEqual(caps, {
        canRename: false,
        canChangeType: false,
        canChangeNullable: false,
        canReposition: false,
        canDelete: false,
      });
    });

    it("bloquea todas las acciones para PK compartida", () => {
      const caps = deriveDiagramAttributeCapabilities(sharedPrimaryKey, false);
      assert.deepEqual(caps, {
        canRename: false,
        canChangeType: false,
        canChangeNullable: false,
        canReposition: false,
        canDelete: false,
      });
    });
  });

  describe("cuando canEditCanvas es true (modo Editor u Owner)", () => {
    it("permite edición completa y eliminación sobre atributos manuales", () => {
      const caps = deriveDiagramAttributeCapabilities(manualAttribute, true);
      assert.deepEqual(caps, {
        canRename: true,
        canChangeType: true,
        canChangeNullable: true,
        canReposition: true,
        canDelete: true,
      });
    });

    it("bloquea cualquier modificación sobre una PK normal", () => {
      const caps = deriveDiagramAttributeCapabilities(normalPrimaryKey, true);
      assert.deepEqual(caps, {
        canRename: false,
        canChangeType: false,
        canChangeNullable: false,
        canReposition: false,
        canDelete: false,
      });
    });

    it("en FK secundaria permite únicamente renombrar; bloquea tipo, nulabilidad, posición y delete", () => {
      const caps = deriveDiagramAttributeCapabilities(secondaryForeignKey, true);
      assert.deepEqual(caps, {
        canRename: true,
        canChangeType: false,
        canChangeNullable: false,
        canReposition: false,
        canDelete: false,
      });
    });

    it("en PK compartida de generalización bloquea absolutamente todo mientras persista la relación", () => {
      const caps = deriveDiagramAttributeCapabilities(sharedPrimaryKey, true);
      assert.deepEqual(caps, {
        canRename: false,
        canChangeType: false,
        canChangeNullable: false,
        canReposition: false,
        canDelete: false,
      });
    });
  });
});
