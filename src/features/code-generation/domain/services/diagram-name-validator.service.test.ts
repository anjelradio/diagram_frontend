import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  validateDiagramNames,
  type DiagramClassCandidate,
} from "./diagram-name-validator.service.ts";

describe("validateDiagramNames", () => {
  it("retorna isValid: true cuando todas las clases y sus atributos tienen nombres únicos", () => {
    const candidates: DiagramClassCandidate[] = [
      {
        name: "Usuario",
        attributes: [
          { name: "id", isPrimaryKey: true },
          { name: "nombre" },
          { name: "email" },
        ],
      },
      {
        name: "Producto",
        attributes: [
          { name: "id", isPrimaryKey: true },
          { name: "codigo" },
          { name: "precio" },
        ],
      },
    ];

    const result = validateDiagramNames(candidates);
    assert.deepEqual(result, { isValid: true });
  });

  it("permite atributos con el mismo nombre en clases distintas (ej. id en ambas clases)", () => {
    const candidates: DiagramClassCandidate[] = [
      {
        name: "Cliente",
        attributes: [{ name: "id", isPrimaryKey: true }, { name: "telefono" }],
      },
      {
        name: "Proveedor",
        attributes: [{ name: "id", isPrimaryKey: true }, { name: "telefono" }],
      },
    ];

    const result = validateDiagramNames(candidates);
    assert.equal(result.isValid, true);
  });

  it("detecta clases con nombres exactamente duplicados e indica la clase en el mensaje", () => {
    const candidates: DiagramClassCandidate[] = [
      { name: "Cliente", attributes: [{ name: "id" }] },
      { name: "Cliente", attributes: [{ name: "codigo" }] },
    ];

    const result = validateDiagramNames(candidates);
    assert.equal(result.isValid, false);
    if (!result.isValid) {
      assert.equal(result.errorType, "DUPLICATE_CLASSES");
      assert.equal(result.conflictClassName, "Cliente");
      assert.match(result.message, /Hay clases con nombres iguales/);
      assert.match(result.message, /Cliente/);
    }
  });

  it("detecta clases duplicadas ignorando mayúsculas/minúsculas y espacios en blanco", () => {
    const candidates: DiagramClassCandidate[] = [
      { name: " Factura ", attributes: [] },
      { name: "factura", attributes: [] },
    ];

    const result = validateDiagramNames(candidates);
    assert.equal(result.isValid, false);
    if (!result.isValid) {
      assert.equal(result.errorType, "DUPLICATE_CLASSES");
      assert.match(result.message, /Hay clases con nombres iguales/);
    }
  });

  it("detecta atributos duplicados ordinarios dentro de una misma clase", () => {
    const candidates: DiagramClassCandidate[] = [
      {
        name: "Pedido",
        attributes: [
          { name: "numero" },
          { name: "fecha" },
          { name: "numero" },
        ],
      },
    ];

    const result = validateDiagramNames(candidates);
    assert.equal(result.isValid, false);
    if (!result.isValid) {
      assert.equal(result.errorType, "DUPLICATE_ATTRIBUTES");
      assert.equal(result.conflictClassName, "Pedido");
      assert.match(result.message, /Hay atributos con nombres iguales en la clase 'Pedido'/);
    }
  });

  it("detecta atributos duplicados cuando uno es llave primaria (PK) y otro es ordinario", () => {
    const candidates: DiagramClassCandidate[] = [
      {
        name: "Cuenta",
        attributes: [
          { name: "codigo", isPrimaryKey: true },
          { name: "codigo", isPrimaryKey: false },
        ],
      },
    ];

    const result = validateDiagramNames(candidates);
    assert.equal(result.isValid, false);
    if (!result.isValid) {
      assert.equal(result.errorType, "DUPLICATE_ATTRIBUTES");
      assert.equal(result.conflictClassName, "Cuenta");
    }
  });

  it("detecta atributos duplicados cuando uno es llave foránea (FK) y otro es ordinario", () => {
    const candidates: DiagramClassCandidate[] = [
      {
        name: "Item",
        attributes: [
          { name: "pedidoId", isForeignKey: true },
          { name: "pedidoId", isForeignKey: false },
        ],
      },
    ];

    const result = validateDiagramNames(candidates);
    assert.equal(result.isValid, false);
    if (!result.isValid) {
      assert.equal(result.errorType, "DUPLICATE_ATTRIBUTES");
      assert.equal(result.conflictClassName, "Item");
    }
  });

  it("detecta atributos duplicados con diferencias de mayúsculas y espacios (ej. ' total ' y 'TOTAL')", () => {
    const candidates: DiagramClassCandidate[] = [
      {
        name: "Venta",
        attributes: [
          { name: " total " },
          { name: "TOTAL" },
        ],
      },
    ];

    const result = validateDiagramNames(candidates);
    assert.equal(result.isValid, false);
    if (!result.isValid) {
      assert.equal(result.errorType, "DUPLICATE_ATTRIBUTES");
      assert.equal(result.conflictClassName, "Venta");
    }
  });

  it("da prioridad a reportar duplicados de clases si tanto clases como atributos están repetidos", () => {
    const candidates: DiagramClassCandidate[] = [
      {
        name: "Item",
        attributes: [{ name: "desc" }, { name: "desc" }],
      },
      {
        name: "item",
        attributes: [],
      },
    ];

    const result = validateDiagramNames(candidates);
    assert.equal(result.isValid, false);
    if (!result.isValid) {
      assert.equal(result.errorType, "DUPLICATE_CLASSES");
    }
  });

  it("aprueba listas vacías o clases sin atributos", () => {
    assert.deepEqual(validateDiagramNames([]), { isValid: true });
    assert.deepEqual(validateDiagramNames([{ name: "Vacia", attributes: [] }]), {
      isValid: true,
    });
  });
});
