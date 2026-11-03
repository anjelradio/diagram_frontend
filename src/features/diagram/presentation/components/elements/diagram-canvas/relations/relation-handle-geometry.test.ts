import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Position } from "@xyflow/react";
import {
  getHandlePoint,
  DEFAULT_CLASS_NODE_WIDTH,
  DEFAULT_CLASS_NODE_HEIGHT,
} from "./relation-handle-geometry.ts";
import { ALL_RELATION_HANDLES } from "../../../../../domain/entities/diagram-relation.entity.ts";

describe("relation-handle-geometry - Cálculo matemático de puntos de anclaje", () => {
  const mockNode = {
    internals: {
      positionAbsolute: { x: 100, y: 200 },
    },
    measured: {
      width: 240,
      height: 120,
    },
  };

  it("retorna coordenadas seguras por defecto si el nodo no está disponible", () => {
    const point = getHandlePoint(null, "TOP_CENTER");
    assert.deepEqual(point, { x: 0, y: 0, position: Position.Top });

    const undefinedPoint = getHandlePoint(undefined, "RIGHT_CENTER");
    assert.deepEqual(undefinedPoint, { x: 0, y: 0, position: Position.Top });
  });

  it("calcula con exactitud los puntos de anclaje para los 12 handles UML", () => {
    for (const handleId of ALL_RELATION_HANDLES) {
      const point = getHandlePoint(mockNode, handleId);
      assert.ok(typeof point.x === "number");
      assert.ok(typeof point.y === "number");
      assert.ok(point.position);
    }
  });

  it("garantiza contacto perimetral exacto con 0 gap en los 4 lados de la tarjeta", () => {
    const { x, y } = mockNode.internals.positionAbsolute;
    const { width, height } = mockNode.measured;

    // Handles superiores deben tocar exactamente y = node.y
    const topHandles = ["TOP_LEFT", "TOP_CENTER", "TOP_RIGHT"] as const;
    for (const h of topHandles) {
      const pt = getHandlePoint(mockNode, h);
      assert.equal(pt.y, y, `${h} debe tener y exactamente en el borde superior (gap 0)`);
      assert.equal(pt.position, Position.Top);
    }

    // Handles derechos deben tocar exactamente x = node.x + width
    const rightHandles = ["RIGHT_TOP", "RIGHT_CENTER", "RIGHT_BOTTOM"] as const;
    for (const h of rightHandles) {
      const pt = getHandlePoint(mockNode, h);
      assert.equal(pt.x, x + width, `${h} debe tener x exactamente en el borde derecho (gap 0)`);
      assert.equal(pt.position, Position.Right);
    }

    // Handles inferiores deben tocar exactamente y = node.y + height
    const bottomHandles = ["BOTTOM_LEFT", "BOTTOM_CENTER", "BOTTOM_RIGHT"] as const;
    for (const h of bottomHandles) {
      const pt = getHandlePoint(mockNode, h);
      assert.equal(pt.y, y + height, `${h} debe tener y exactamente en el borde inferior (gap 0)`);
      assert.equal(pt.position, Position.Bottom);
    }

    // Handles izquierdos deben tocar exactamente x = node.x
    const leftHandles = ["LEFT_TOP", "LEFT_CENTER", "LEFT_BOTTOM"] as const;
    for (const h of leftHandles) {
      const pt = getHandlePoint(mockNode, h);
      assert.equal(pt.x, x, `${h} debe tener x exactamente en el borde izquierdo (gap 0)`);
      assert.equal(pt.position, Position.Left);
    }
  });

  it("posiciona los handles en las fracciones 25%, 50% y 75% correspondientes", () => {
    const { x, y } = mockNode.internals.positionAbsolute;
    const { width, height } = mockNode.measured;

    assert.deepEqual(getHandlePoint(mockNode, "TOP_LEFT"), {
      x: x + width * 0.25,
      y,
      position: Position.Top,
    });
    assert.deepEqual(getHandlePoint(mockNode, "TOP_CENTER"), {
      x: x + width * 0.5,
      y,
      position: Position.Top,
    });
    assert.deepEqual(getHandlePoint(mockNode, "TOP_RIGHT"), {
      x: x + width * 0.75,
      y,
      position: Position.Top,
    });

    assert.deepEqual(getHandlePoint(mockNode, "RIGHT_TOP"), {
      x: x + width,
      y: y + height * 0.25,
      position: Position.Right,
    });
    assert.deepEqual(getHandlePoint(mockNode, "RIGHT_CENTER"), {
      x: x + width,
      y: y + height * 0.5,
      position: Position.Right,
    });
    assert.deepEqual(getHandlePoint(mockNode, "RIGHT_BOTTOM"), {
      x: x + width,
      y: y + height * 0.75,
      position: Position.Right,
    });

    assert.deepEqual(getHandlePoint(mockNode, "BOTTOM_LEFT"), {
      x: x + width * 0.25,
      y: y + height,
      position: Position.Bottom,
    });
    assert.deepEqual(getHandlePoint(mockNode, "BOTTOM_CENTER"), {
      x: x + width * 0.5,
      y: y + height,
      position: Position.Bottom,
    });
    assert.deepEqual(getHandlePoint(mockNode, "BOTTOM_RIGHT"), {
      x: x + width * 0.75,
      y: y + height,
      position: Position.Bottom,
    });

    assert.deepEqual(getHandlePoint(mockNode, "LEFT_TOP"), {
      x,
      y: y + height * 0.25,
      position: Position.Left,
    });
    assert.deepEqual(getHandlePoint(mockNode, "LEFT_CENTER"), {
      x,
      y: y + height * 0.5,
      position: Position.Left,
    });
    assert.deepEqual(getHandlePoint(mockNode, "LEFT_BOTTOM"), {
      x,
      y: y + height * 0.75,
      position: Position.Left,
    });
  });

  it("utiliza position y dimensiones de fallback cuando internals o measured no están presentes", () => {
    const unmeasuredNode = {
      position: { x: 50, y: 80 },
    };

    const point = getHandlePoint(unmeasuredNode, "RIGHT_CENTER");
    assert.equal(point.x, 50 + DEFAULT_CLASS_NODE_WIDTH);
    assert.equal(point.y, 80 + DEFAULT_CLASS_NODE_HEIGHT * 0.5);
    assert.equal(point.position, Position.Right);
  });
});
