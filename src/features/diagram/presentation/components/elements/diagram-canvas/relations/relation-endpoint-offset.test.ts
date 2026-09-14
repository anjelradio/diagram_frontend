import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { Position } from "@xyflow/react";
import {
  getSymbolSizes,
  calculateEndpointOffsets,
  RELATION_SYMBOL_SIZES,
} from "./relation-endpoint-offset.ts";

describe("relation-endpoint-offset - Geometría de cabeceras UML", () => {
  describe("getSymbolSizes", () => {
    it("devuelve tamaño de rombo en origen para AGGREGATION y COMPOSITION", () => {
      const agg = getSymbolSizes("AGGREGATION");
      assert.equal(agg.sourceSize, RELATION_SYMBOL_SIZES.DIAMOND);
      assert.equal(agg.targetSize, 0);

      const comp = getSymbolSizes("COMPOSITION");
      assert.equal(comp.sourceSize, RELATION_SYMBOL_SIZES.DIAMOND);
      assert.equal(comp.targetSize, 0);
    });

    it("devuelve tamaño de triángulo en destino para GENERALIZATION y REALIZATION", () => {
      const gen = getSymbolSizes("GENERALIZATION");
      assert.equal(gen.sourceSize, 0);
      assert.equal(gen.targetSize, RELATION_SYMBOL_SIZES.TRIANGLE);

      const real = getSymbolSizes("REALIZATION");
      assert.equal(real.sourceSize, 0);
      assert.equal(real.targetSize, RELATION_SYMBOL_SIZES.TRIANGLE);
    });

    it("devuelve tamaño de flecha en destino para DEPENDENCY", () => {
      const dep = getSymbolSizes("DEPENDENCY");
      assert.equal(dep.sourceSize, 0);
      assert.equal(dep.targetSize, RELATION_SYMBOL_SIZES.ARROW);
    });

    it("devuelve cero en ambos extremos para ASSOCIATION", () => {
      const assoc = getSymbolSizes("ASSOCIATION");
      assert.equal(assoc.sourceSize, 0);
      assert.equal(assoc.targetSize, 0);
    });
  });

  describe("calculateEndpointOffsets", () => {
    it("aplica offset en origen hacia la derecha para handle Position.Right en AGGREGATION", () => {
      const result = calculateEndpointOffsets({
        sourceX: 100,
        sourceY: 200,
        targetX: 400,
        targetY: 200,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        relationType: "AGGREGATION",
      });

      assert.equal(result.sourceX, 100 + RELATION_SYMBOL_SIZES.DIAMOND);
      assert.equal(result.sourceY, 200);
      assert.equal(result.targetX, 400);
      assert.equal(result.targetY, 200);
    });

    it("aplica offset en destino hacia la izquierda para handle Position.Left en GENERALIZATION", () => {
      const result = calculateEndpointOffsets({
        sourceX: 100,
        sourceY: 200,
        targetX: 400,
        targetY: 200,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        relationType: "GENERALIZATION",
      });

      assert.equal(result.sourceX, 100);
      assert.equal(result.sourceY, 200);
      assert.equal(result.targetX, 400 - RELATION_SYMBOL_SIZES.TRIANGLE);
      assert.equal(result.targetY, 200);
    });

    it("aplica offset vertical correcto para Position.Bottom y Position.Top", () => {
      const comp = calculateEndpointOffsets({
        sourceX: 200,
        sourceY: 100,
        targetX: 200,
        targetY: 500,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        relationType: "COMPOSITION",
      });

      assert.equal(comp.sourceX, 200);
      assert.equal(comp.sourceY, 100 + RELATION_SYMBOL_SIZES.DIAMOND);

      const dep = calculateEndpointOffsets({
        sourceX: 200,
        sourceY: 100,
        targetX: 200,
        targetY: 500,
        sourcePosition: Position.Bottom,
        targetPosition: Position.Top,
        relationType: "DEPENDENCY",
      });

      assert.equal(dep.sourceX, 200);
      assert.equal(dep.sourceY, 100);
      assert.equal(dep.targetX, 200);
      assert.equal(dep.targetY, 500 - RELATION_SYMBOL_SIZES.ARROW);
    });

    it("no modifica coordenadas para ASSOCIATION", () => {
      const result = calculateEndpointOffsets({
        sourceX: 150,
        sourceY: 250,
        targetX: 350,
        targetY: 450,
        sourcePosition: Position.Right,
        targetPosition: Position.Top,
        relationType: "ASSOCIATION",
      });

      assert.equal(result.sourceX, 150);
      assert.equal(result.sourceY, 250);
      assert.equal(result.targetX, 350);
      assert.equal(result.targetY, 450);
    });

    it("atenúa el offset cuando la distancia entre nodos es muy corta para evitar cruces", () => {
      const result = calculateEndpointOffsets({
        sourceX: 100,
        sourceY: 100,
        targetX: 110,
        targetY: 100,
        sourcePosition: Position.Right,
        targetPosition: Position.Left,
        relationType: "GENERALIZATION",
      });

      // La distancia es 10px, menor que el tamaño del triángulo (14px).
      // El offset no debe superar la distancia ni invertir las coordenadas.
      assert.ok(result.targetX >= result.sourceX);
      assert.ok(result.targetX <= 110);
    });
  });
});
