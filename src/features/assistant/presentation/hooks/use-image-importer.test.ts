import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const source = readFileSync(
  new URL("./use-image-importer.ts", import.meta.url),
  "utf8"
);

test("useImageImporter valida formatos de imagen soportados y tamaño máximo", () => {
  assert.match(source, /image\/png/);
  assert.match(source, /image\/jpeg/);
  assert.match(source, /image\/webp/);
  assert.match(source, /10 \* 1024 \* 1024/);
  assert.match(source, /Formato no compatible/);
  assert.match(source, /tamaño máximo/);
});

test("useImageImporter envía sendImageCommand y maneja estados isSending", () => {
  assert.equal((source.match(/sendImageCommand\(/g) ?? []).length, 1);
  assert.match(source, /setIsSending\(true\)/);
  assert.match(source, /setIsSending\(false\)/);
  assert.match(source, /onSuccess\?\.()/);
  assert.match(source, /Diagrama recreado exitosamente/);
});
