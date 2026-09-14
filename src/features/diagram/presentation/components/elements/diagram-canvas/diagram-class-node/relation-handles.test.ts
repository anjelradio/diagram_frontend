import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  RELATION_HANDLE_CONFIGS,
  getHandleConfig,
} from "./relation-handles-config.ts";
import { ALL_RELATION_HANDLES } from "../../../../../domain/entities/diagram-relation.entity.ts";

describe("RelationHandles - Configuración de 12 puntos de anclaje", () => {
  it("define exactamente doce handles únicos coincidentes con ALL_RELATION_HANDLES", () => {
    assert.equal(RELATION_HANDLE_CONFIGS.length, 12);
    const ids = RELATION_HANDLE_CONFIGS.map((c) => c.id);
    const uniqueIds = new Set(ids);
    assert.equal(uniqueIds.size, 12);

    for (const handle of ALL_RELATION_HANDLES) {
      assert.ok(uniqueIds.has(handle), `Falta el handle ${handle}`);
    }
  });

  it("distribuye 3 handles por cada lado con offsets ordenados", () => {
    const sides = ["top", "right", "bottom", "left"] as const;
    for (const side of sides) {
      const handlesOnSide = RELATION_HANDLE_CONFIGS.filter((c) => c.side === side);
      assert.equal(handlesOnSide.length, 3, `Debe haber 3 handles en lado ${side}`);
      const offsets = handlesOnSide.map((c) => c.offset);
      assert.ok(offsets.includes("25%"));
      assert.ok(offsets.includes("50%"));
      assert.ok(offsets.includes("75%"));
    }
  });

  it("permite consultar la configuración de cualquier handle válido por su ID", () => {
    const topCenter = getHandleConfig("TOP_CENTER");
    assert.ok(topCenter);
    assert.equal(topCenter.id, "TOP_CENTER");
    assert.equal(topCenter.side, "top");
    assert.equal(topCenter.offset, "50%");

    const leftBottom = getHandleConfig("LEFT_BOTTOM");
    assert.ok(leftBottom);
    assert.equal(leftBottom.id, "LEFT_BOTTOM");
    assert.equal(leftBottom.side, "left");
    assert.equal(leftBottom.offset, "75%");
  });
});
