import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";
import {
  SOURCE_VERTEX_OPTIONS,
  TARGET_CARDINALITY_OPTIONS,
} from "../../../../../domain/entities/diagram-relation.entity.ts";


const popoverSource = readFileSync(
  new URL("./vertex-relation-popover.tsx", import.meta.url),
  "utf8"
);

describe("VertexRelationPopover - Menú Contextual de Vértice", () => {
  it("exporta el componente VertexRelationPopover", () => {
    assert.match(
      popoverSource,
      /export function VertexRelationPopover/,
      "Debe exportar la función VertexRelationPopover"
    );
  });

  it("diferencia los catálogos de opciones para paso source y target", () => {
    assert.match(
      popoverSource,
      /step === "source"\s*\?\s*SOURCE_VERTEX_OPTIONS\s*:\s*TARGET_CARDINALITY_OPTIONS/,
      "Debe renderizar SOURCE_VERTEX_OPTIONS en origen y TARGET_CARDINALITY_OPTIONS en destino"
    );
  });

  it("presenta una lista unificada y limpia de opciones sin divisiones ni encabezados redundantes", () => {
    assert.doesNotMatch(
      popoverSource,
      /Cardinalidad \(Asociación\)/,
      "No debe incluir encabezados divisorios de sección"
    );
    assert.doesNotMatch(
      popoverSource,
      /Relación Estructural/,
      "No debe incluir encabezados divisorios de sección"
    );
    assert.match(
      popoverSource,
      /options\.map/,
      "Debe renderizar la lista unificada directamente desde el catálogo de opciones"
    );
  });

  it("ubica el badge o icono a la izquierda y el texto de la opción a la derecha", () => {
    assert.match(
      popoverSource,
      /opt\.category === "cardinality"/,
      "Debe renderizar condicionalmente badge o icono a la izquierda"
    );
    assert.match(
      popoverSource,
      /<span className="truncate">\{opt\.label\}<\/span>/,
      "Debe renderizar el texto a la derecha"
    );
  });

  it("implementa posicionamiento inteligente con sujeción estricta a la pantalla (clamping)", () => {
    assert.match(
      popoverSource,
      /getHandleConfig/,
      "Debe consultar el lado del handle para orientar el popover"
    );
    assert.match(
      popoverSource,
      /Math\.max\(padding, Math\.min/,
      "Debe sujetar estrictamente la posición dentro de los límites del viewport"
    );
  });

  it("maneja el cierre mediante tecla Escape y clics fuera del popover", () => {
    assert.match(
      popoverSource,
      /e\.key === "Escape"/,
      "Debe capturar la tecla Escape para llamar a onClose"
    );
    assert.match(
      popoverSource,
      /onClose\(\)/,
      "Debe invocar el callback onClose al solicitar cierre"
    );
  });

  it("cuenta con los símbolos visuales correspondientes para cada cabeza estructural", () => {
    assert.match(popoverSource, /rombo_relleno/);
    assert.match(popoverSource, /rombo_vacio/);
    assert.match(popoverSource, /flecha_triangular/);
    assert.match(popoverSource, /flecha_discontinua/);
    assert.match(popoverSource, /flecha_abierta/);
  });
});
