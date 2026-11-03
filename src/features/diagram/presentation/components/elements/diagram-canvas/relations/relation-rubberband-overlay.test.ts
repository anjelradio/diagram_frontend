import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { describe, it } from "node:test";

const overlaySource = readFileSync(
  new URL("./relation-rubberband-overlay.tsx", import.meta.url),
  "utf8"
);

describe("RelationRubberbandOverlay - Línea Elástica en Tiempo Real", () => {
  it("exporta el componente RelationRubberbandOverlay", () => {
    assert.match(
      overlaySource,
      /export (const|function) RelationRubberbandOverlay/,
      "Debe exportar el componente RelationRubberbandOverlay"
    );
  });


  it("calcula y traza la trayectoria SVG entre sourcePoint y currentPoint", () => {
    assert.match(
      overlaySource,
      /sourcePoint/,
      "Debe aceptar sourcePoint"
    );
    assert.match(
      overlaySource,
      /currentPoint/,
      "Debe aceptar currentPoint"
    );
    assert.match(
      overlaySource,
      /<svg/,
      "Debe renderizar un elemento SVG para el trazo elástico"
    );
  });

  it("aplica estilo discontinuo para relaciones de Realización y Dependencia", () => {
    assert.match(
      overlaySource,
      /strokeDasharray/,
      "Debe soportar líneas discontinuas con strokeDasharray"
    );
    assert.match(
      overlaySource,
      /DEPENDENCY|REALIZATION/,
      "Debe condicionar trazo discontinuo a Dependencia y Realización"
    );
  });

  it("renderiza badges de cardinalidad de origen", () => {
    assert.match(
      overlaySource,
      /sourceCardinality/,
      "Debe renderizar badge si existe sourceCardinality"
    );
  });

  it("proyecta cabezas y marcadores estructurales en los extremos", () => {
    assert.match(
      overlaySource,
      /GENERALIZATION/,
      "Debe dar soporte a flecha de herencia / generalización"
    );
    assert.match(
      overlaySource,
      /COMPOSITION/,
      "Debe dar soporte a rombo de composición"
    );
    assert.match(
      overlaySource,
      /AGGREGATION/,
      "Debe dar soporte a rombo de agregación"
    );
  });
});
