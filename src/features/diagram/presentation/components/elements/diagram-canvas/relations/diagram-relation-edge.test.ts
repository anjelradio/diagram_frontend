import { describe, it } from "node:test";
import assert from "node:assert/strict";
import type { DiagramRelation } from "../../../../../domain/entities/diagram-relation.entity.ts";
import {
  convertRelationToEdge,
  convertRelationsToEdges,
  getCardinalityLabels,
  getRelationEdgeVisuals,
  shouldRenderRelationName,
} from "./diagram-relation-edge.utils.ts";

describe("DiagramRelationEdge Utils & Mappers", () => {
  const baseAssociation: DiagramRelation = {
    id: "rel-1",
    name: "PedidoCliente",
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
    bridge: null,
  };

  const baseManyToMany: DiagramRelation = {
    id: "rel-nm",
    name: "",
    relationType: "ASSOCIATION",
    source: {
      classId: "class-1",
      handle: "BOTTOM_CENTER",
      cardinality: "0..*",
    },
    target: {
      classId: "class-2",
      handle: "BOTTOM_CENTER",
      cardinality: "0..*",
    },
    bridge: {
      classId: "class-bridge",
      handle: "TOP_CENTER",
    },
  };

  describe("convertRelationToEdge", () => {
    it("convierte una asociación binaria a edge estándar 'diagramRelation'", () => {
      const edge = convertRelationToEdge(baseAssociation, "rel-other");

      assert.equal(edge.id, "rel-1");
      assert.equal(edge.type, "diagramRelation");
      assert.equal(edge.source, "class-1");
      assert.equal(edge.sourceHandle, "RIGHT_CENTER");
      assert.equal(edge.target, "class-2");
      assert.equal(edge.targetHandle, "LEFT_CENTER");
      assert.equal(edge.selected, false);
      assert.equal(edge.data.relation.id, "rel-1");
      assert.equal(edge.data.bridgeClassId, undefined);
    });

    it("marca la arista como seleccionada si coincide con selectedRelationId", () => {
      const edge = convertRelationToEdge(baseAssociation, "rel-1");
      assert.equal(edge.selected, true);
    });

    it("convierte una asociación N:M a edge 'manyToManyRelation' con metadatos del puente", () => {
      const edge = convertRelationToEdge(baseManyToMany, "rel-nm");

      assert.equal(edge.id, "rel-nm");
      assert.equal(edge.type, "manyToManyRelation");
      assert.equal(edge.selected, true);
      assert.equal(edge.data.bridgeClassId, "class-bridge");
      assert.equal(edge.data.bridgeHandle, "TOP_CENTER");
    });

    it("convertRelationsToEdges convierte una lista preservando orden y selección", () => {
      const edges = convertRelationsToEdges(
        [baseAssociation, baseManyToMany],
        "rel-1"
      );

      assert.equal(edges.length, 2);
      assert.equal(edges[0].selected, true);
      assert.equal(edges[1].selected, false);
      assert.equal(edges[0].type, "diagramRelation");
      assert.equal(edges[1].type, "manyToManyRelation");
    });
  });

  describe("getRelationEdgeVisuals", () => {
    it("genera estilos para ASSOCIATION (línea sólida sin marcadores)", () => {
      const unselected = getRelationEdgeVisuals("ASSOCIATION", false);
      assert.equal(unselected.stroke, "#94a3b8");
      assert.equal(unselected.strokeWidth, 1.5);
      assert.equal(unselected.strokeDasharray, undefined);
      assert.equal(unselected.markerStart, undefined);
      assert.equal(unselected.markerEnd, undefined);

      const selected = getRelationEdgeVisuals("ASSOCIATION", true);
      assert.equal(selected.stroke, "#818cf8");
      assert.equal(selected.strokeWidth, 2.5);
      assert.equal(selected.strokeDasharray, undefined);
      assert.equal(selected.markerStart, undefined);
      assert.equal(selected.markerEnd, undefined);
    });

    it("genera estilos para AGGREGATION (línea sólida y rombo vacío en origen)", () => {
      const unselected = getRelationEdgeVisuals("AGGREGATION", false);
      assert.equal(unselected.stroke, "#94a3b8");
      assert.equal(unselected.strokeWidth, 1.5);
      assert.equal(unselected.strokeDasharray, undefined);
      assert.equal(unselected.markerStart, "url(#aggregation-diamond)");
      assert.equal(unselected.markerEnd, undefined);

      const selected = getRelationEdgeVisuals("AGGREGATION", true);
      assert.equal(selected.stroke, "#818cf8");
      assert.equal(selected.strokeWidth, 2.5);
      assert.equal(selected.strokeDasharray, undefined);
      assert.equal(selected.markerStart, "url(#aggregation-diamond-selected)");
      assert.equal(selected.markerEnd, undefined);
    });

    it("genera estilos para COMPOSITION (línea sólida y rombo lleno en origen)", () => {
      const unselected = getRelationEdgeVisuals("COMPOSITION", false);
      assert.equal(unselected.stroke, "#94a3b8");
      assert.equal(unselected.strokeWidth, 1.5);
      assert.equal(unselected.strokeDasharray, undefined);
      assert.equal(unselected.markerStart, "url(#composition-diamond)");
      assert.equal(unselected.markerEnd, undefined);

      const selected = getRelationEdgeVisuals("COMPOSITION", true);
      assert.equal(selected.stroke, "#818cf8");
      assert.equal(selected.strokeWidth, 2.5);
      assert.equal(selected.strokeDasharray, undefined);
      assert.equal(selected.markerStart, "url(#composition-diamond-selected)");
      assert.equal(selected.markerEnd, undefined);
    });

    it("genera estilos para GENERALIZATION (línea sólida y triángulo cerrado en destino)", () => {
      const unselected = getRelationEdgeVisuals("GENERALIZATION", false);
      assert.equal(unselected.stroke, "#94a3b8");
      assert.equal(unselected.strokeWidth, 1.5);
      assert.equal(unselected.strokeDasharray, undefined);
      assert.equal(unselected.markerStart, undefined);
      assert.equal(unselected.markerEnd, "url(#generalization-triangle)");

      const selected = getRelationEdgeVisuals("GENERALIZATION", true);
      assert.equal(selected.stroke, "#818cf8");
      assert.equal(selected.strokeWidth, 2.5);
      assert.equal(selected.strokeDasharray, undefined);
      assert.equal(
        selected.markerEnd,
        "url(#generalization-triangle-selected)"
      );
      assert.equal(selected.markerStart, undefined);
    });

    it("genera estilos para REALIZATION (línea discontinua y triángulo en destino)", () => {
      const unselected = getRelationEdgeVisuals("REALIZATION", false);
      assert.equal(unselected.stroke, "#94a3b8");
      assert.equal(unselected.strokeWidth, 1.5);
      assert.equal(unselected.strokeDasharray, "5,5");
      assert.equal(unselected.markerStart, undefined);
      assert.equal(unselected.markerEnd, "url(#realization-triangle)");

      const selected = getRelationEdgeVisuals("REALIZATION", true);
      assert.equal(selected.stroke, "#818cf8");
      assert.equal(selected.strokeWidth, 2.5);
      assert.equal(selected.strokeDasharray, "5,5");
      assert.equal(selected.markerStart, undefined);
      assert.equal(selected.markerEnd, "url(#realization-triangle-selected)");
    });

    it("genera estilos para DEPENDENCY (línea discontinua y flecha abierta en destino)", () => {
      const unselected = getRelationEdgeVisuals("DEPENDENCY", false);
      assert.equal(unselected.stroke, "#94a3b8");
      assert.equal(unselected.strokeWidth, 1.5);
      assert.equal(unselected.strokeDasharray, "5,5");
      assert.equal(unselected.markerStart, undefined);
      assert.equal(unselected.markerEnd, "url(#dependency-arrow)");

      const selected = getRelationEdgeVisuals("DEPENDENCY", true);
      assert.equal(selected.stroke, "#818cf8");
      assert.equal(selected.strokeWidth, 2.5);
      assert.equal(selected.strokeDasharray, "5,5");
      assert.equal(selected.markerStart, undefined);
      assert.equal(selected.markerEnd, "url(#dependency-arrow-selected)");
    });

    it("garantiza semántica UML estricta: sólidos vs discontinuos", () => {
      const solidTypes: ("ASSOCIATION" | "AGGREGATION" | "COMPOSITION" | "GENERALIZATION")[] = [
        "ASSOCIATION",
        "AGGREGATION",
        "COMPOSITION",
        "GENERALIZATION",
      ];
      for (const t of solidTypes) {
        const visuals = getRelationEdgeVisuals(t, false);
        assert.equal(visuals.strokeDasharray, undefined, `Tipo ${t} debe ser trazo sólido`);
      }

      const dashedTypes: ("REALIZATION" | "DEPENDENCY")[] = [
        "REALIZATION",
        "DEPENDENCY",
      ];
      for (const t of dashedTypes) {
        const visuals = getRelationEdgeVisuals(t, false);
        assert.equal(visuals.strokeDasharray, "5,5", `Tipo ${t} debe ser trazo discontinuo`);
      }
    });
  });

  describe("getCardinalityLabels", () => {
    it("devuelve cardinalidades de origen y destino para ASSOCIATION", () => {
      const labels = getCardinalityLabels(baseAssociation);
      assert.equal(labels.source, "1");
      assert.equal(labels.target, "0..*");
    });

    it("devuelve null en ambos extremos para tipos no asociativos", () => {
      const aggregation: DiagramRelation = {
        ...baseAssociation,
        relationType: "AGGREGATION",
        source: { ...baseAssociation.source, cardinality: null },
        target: { ...baseAssociation.target, cardinality: null },
      };

      const labels = getCardinalityLabels(aggregation);
      assert.equal(labels.source, null);
      assert.equal(labels.target, null);
    });
  });

  describe("shouldRenderRelationName", () => {
    it("permite renderizar etiqueta y editor únicamente para ASSOCIATION", () => {
      assert.equal(shouldRenderRelationName("ASSOCIATION"), true);
    });

    it("rechaza etiqueta y editor para todos los tipos no asociativos", () => {
      assert.equal(shouldRenderRelationName("AGGREGATION"), false);
      assert.equal(shouldRenderRelationName("COMPOSITION"), false);
      assert.equal(shouldRenderRelationName("GENERALIZATION"), false);
      assert.equal(shouldRenderRelationName("REALIZATION"), false);
      assert.equal(shouldRenderRelationName("DEPENDENCY"), false);
    });

    it("aristas N:M son de tipo ASSOCIATION y por ende permiten etiqueta y editor", () => {
      assert.equal(baseManyToMany.relationType, "ASSOCIATION");
      assert.equal(shouldRenderRelationName(baseManyToMany.relationType), true);
    });
  });
});
