import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { readFileSync } from "node:fs";
import { validateDiagramNames } from "../../domain/services/diagram-name-validator.service.ts";

const hookSource = readFileSync(
  new URL("./use-generate-backend.ts", import.meta.url),
  "utf8"
);

describe("useGenerateBackend - Interceptación y validación previa", () => {
  it("contiene la llamada al validador de nombres antes de disparar la generación HTTP", () => {
    assert.match(hookSource, /useAppStore\.getState\(\)\.nodes/);
    assert.match(hookSource, /validateDiagramNames/);
    assert.match(hookSource, /if\s*\(!validation\.isValid\)/);
    assert.match(hookSource, /appToast\.error\(validation\.message\)/);
    assert.match(hookSource, /return;/);
  });

  it("bloquea la generación si hay clases con nombres duplicados", () => {
    const mockNodes = [
      {
        id: "node-1",
        data: {
          id: "class-1",
          name: "Cliente",
          attributes: [{ id: "attr-1", name: "id", isPrimaryKey: true, position: 0, isNullable: false, dataType: null }],
        },
      },
      {
        id: "node-2",
        data: {
          id: "class-2",
          name: "cliente ",
          attributes: [{ id: "attr-2", name: "codigo", isPrimaryKey: false, position: 0, isNullable: false, dataType: null }],
        },
      },
    ];

    const candidates = mockNodes.map((node) => ({
      name: node.data.name,
      attributes: node.data.attributes,
    }));

    const result = validateDiagramNames(candidates);
    assert.equal(result.isValid, false);
    if (!result.isValid) {
      assert.equal(result.errorType, "DUPLICATE_CLASSES");
      assert.match(result.message, /Hay clases con nombres iguales/);
    }
  });

  it("bloquea la generación si una clase contiene atributos con nombres duplicados (incluyendo PK/FK)", () => {
    const mockNodes = [
      {
        id: "node-1",
        data: {
          id: "class-1",
          name: "Factura",
          attributes: [
            { id: "a1", name: "folio", isPrimaryKey: true, position: 0, isNullable: false, dataType: null },
            { id: "a2", name: "fecha", isPrimaryKey: false, position: 1, isNullable: false, dataType: null },
            { id: "a3", name: "folio", isPrimaryKey: false, isForeignKey: true, position: 2, isNullable: false, dataType: null },
          ],
        },
      },
    ];

    const candidates = mockNodes.map((node) => ({
      name: node.data.name,
      attributes: node.data.attributes,
    }));

    const result = validateDiagramNames(candidates);
    assert.equal(result.isValid, false);
    if (!result.isValid) {
      assert.equal(result.errorType, "DUPLICATE_ATTRIBUTES");
      assert.equal(result.conflictClassName, "Factura");
      assert.match(result.message, /Hay atributos con nombres iguales en la clase 'Factura'/);
    }
  });

  it("permite reintento exitoso (US2) tras corregir los nombres conflictivos", () => {
    // 1. Estado inicial con duplicado en Factura
    const initialNodes = [
      {
        id: "node-1",
        data: {
          id: "class-1",
          name: "Factura",
          attributes: [
            { id: "a1", name: "codigo", isPrimaryKey: true, position: 0, isNullable: false, dataType: null },
            { id: "a2", name: "codigo", isPrimaryKey: false, position: 1, isNullable: false, dataType: null },
          ],
        },
      },
    ];

    const initialValidation = validateDiagramNames(
      initialNodes.map((n) => ({ name: n.data.name, attributes: n.data.attributes }))
    );
    assert.equal(initialValidation.isValid, false);

    // 2. Corrección del usuario: renombra el segundo atributo a 'fecha'
    const correctedNodes = [
      {
        id: "node-1",
        data: {
          id: "class-1",
          name: "Factura",
          attributes: [
            { id: "a1", name: "codigo", isPrimaryKey: true, position: 0, isNullable: false, dataType: null },
            { id: "a2", name: "fecha", isPrimaryKey: false, position: 1, isNullable: false, dataType: null },
          ],
        },
      },
    ];

    const correctedValidation = validateDiagramNames(
      correctedNodes.map((n) => ({ name: n.data.name, attributes: n.data.attributes }))
    );
    assert.equal(correctedValidation.isValid, true);
  });
});
