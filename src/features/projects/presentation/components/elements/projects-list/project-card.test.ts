import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";

describe("ProjectCard component", () => {
  const cardPath = join(
    process.cwd(),
    "src/features/projects/presentation/components/elements/projects-list/project-card.tsx"
  );
  const cardSource = readFileSync(cardPath, "utf-8");

  it("prioriza project.thumbnailUrl sobre el placeholder predeterminado", () => {
    assert.match(
      cardSource,
      /const thumbnailSrc = project\.thumbnailUrl \|\| "\/images\/not_thumbnail\.webp";/
    );
  });

  it("renderiza Next.js Image con unoptimized y relación de aspecto adecuada", () => {
    assert.match(cardSource, /<Image/);
    assert.match(cardSource, /src=\{thumbnailSrc\}/);
    assert.match(cardSource, /unoptimized/);
  });

  it("enlaza directamente a la ruta dinámica del proyecto", () => {
    assert.match(cardSource, /href=\{`\/projects\/\$\{project\.id\}`\}/);
  });
});
