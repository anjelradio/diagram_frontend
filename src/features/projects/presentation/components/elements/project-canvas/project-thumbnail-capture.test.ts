import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("useProjectThumbnailCapture & Non-blocking Navigation", () => {
  const hookPath = join(
    process.cwd(),
    "src/features/projects/presentation/hooks/use-project-thumbnail-capture.ts"
  );
  const hookSource = readFileSync(hookPath, "utf-8");

  const menuPath = join(
    process.cwd(),
    "src/features/projects/presentation/components/elements/project-canvas/project-actions-menu.tsx"
  );
  const menuSource = readFileSync(menuPath, "utf-8");

  it("implementa timeout estricto menor o igual a 1000ms para evitar bloqueos", () => {
    assert.match(hookSource, /timeoutMs\s*=\s*(900|1000|[1-9][0-9]{2})/);
    assert.match(hookSource, /Promise\.race\(\[runCaptureAndUpload\(\),\s*timeoutPromise\]\)/);
  });

  it("aplica captura dirigida exclusivamente al canvas (.react-flow__viewport o .react-flow)", () => {
    assert.match(hookSource, /\.react-flow__viewport/);
    assert.match(hookSource, /\.react-flow/);
    assert.match(hookSource, /html-to-image/);
  });

  it("garantiza la navegación en el bloque finally independientemente de errores o timeouts", () => {
    assert.match(hookSource, /try\s*\{[\s\S]*\}\s*catch\s*\{[\s\S]*\}\s*finally\s*\{\s*router\.push\(targetUrl\);?\s*\}/);
  });

  it("omite la captura y subida cuando no existe ninguna clase en el lienzo", () => {
    assert.match(hookSource, /if\s*\(hasClasses\s*===\s*false\)\s*\{\s*router\.push\(targetUrl\);\s*return;\s*\}/);
  });

  it("ProjectActionsMenu intercepta 'Volver a todos los proyectos' y delega a onBackToProjects", () => {
    assert.match(menuSource, /onBackToProjects\?: \(\) => void;/);
    assert.match(menuSource, /if \(onBackToProjects\)\s*\{\s*e\.preventDefault\(\);\s*onBackToProjects\(\);\s*\}/);
  });
});
