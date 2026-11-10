import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";
import {
  AURORA_HORIZONTAL_PHASE_SPEED,
  sampleAuroraRidge,
} from "./agent-aurora-geometry.ts";

const source = readFileSync(new URL("./agent-aurora-overlay.tsx", import.meta.url), "utf8");
const styles = readFileSync(new URL("./agent-aurora-overlay.module.css", import.meta.url), "utf8");

test("la cresta tiene picos más cortos y desiguales con movimiento de avance", () => {
  const ridge = Array.from({ length: 121 }, (_, index) =>
    sampleAuroraRidge(index * 12, 1440, 100, 0, 0),
  );
  const elevations = ridge.map(({ y }) => y);

  assert.ok(ridge.every(({ y }) => y > 30 && y < 85));
  assert.ok(Math.max(...elevations) - Math.min(...elevations) > 18);
  const detailed = Array.from({ length: 241 }, (_, index) =>
    sampleAuroraRidge(index * 6, 1440, 100, 0, 0),
  );
  const peaks = detailed.filter(({ y }, index) =>
    index > 0 && index < detailed.length - 1 &&
    y > detailed[index - 1].y && y > detailed[index + 1].y,
  );
  assert.ok(peaks.length >= 4);
  assert.ok(peaks.slice(1).every((peak, index) => peak.x - peaks[index].x < 500));
  assert.ok(Math.max(...peaks.map(({ y }) => y)) - Math.min(...peaks.map(({ y }) => y)) > 3);
  assert.ok(Math.abs(
    sampleAuroraRidge(0, 1440, 100, 4, 0).y -
    sampleAuroraRidge(1440, 1440, 100, 4, 0).y,
  ) > 5);
  assert.ok(Math.abs(
    sampleAuroraRidge(0, 1440, 100, 1.75, 0).y -
    sampleAuroraRidge(0, 1440, 100, 5.24, 0).y,
  ) > 5);
  assert.equal(AURORA_HORIZONTAL_PHASE_SPEED, 0.9);
  assert.ok(AURORA_HORIZONTAL_PHASE_SPEED > 0.5625);

  const near = Array.from({ length: 121 }, (_, index) =>
    sampleAuroraRidge(index * 12, 1440, 100, 1.75, 0),
  );
  const far = Array.from({ length: 121 }, (_, index) =>
    sampleAuroraRidge(index * 12, 1440, 100, 5.24, 0),
  );
  assert.ok(near[0].depth > 0.95 && far[0].depth < 0.05);
  assert.ok(Math.max(...near.map(({ y }) => y)) > Math.max(...far.map(({ y }) => y)) + 10);
});

test("la aurora rellena una superficie continua hasta los bordes y limita la animación", () => {
  assert.match(source, /<AuroraEdge position="top" \/>/);
  assert.match(source, /<AuroraEdge position="bottom" \/>/);
  assert.match(source, /traceRidge\(ctx, ridge\);\s*ctx\.lineTo\(width, 0\);\s*ctx\.lineTo\(0, 0\);\s*ctx\.closePath\(\)/);
  assert.match(styles, /\.edgeBottom\s*\{[^}]*transform: scaleY\(-1\)/);
  assert.equal(source.match(/ctx\.fill\(\)/g)?.length, 2);
  assert.match(source, /SHEET_COLORS\.forEach/);
  assert.doesNotMatch(source, /for \(let index = 0; index < ridge\.length - 1/);
  assert.equal(source.match(/ctx\.stroke\(\)/g)?.length, 2);
  assert.match(source, /blur\(\$\{\(9 \+ depth \* 2\)/);
  assert.match(source, /blur\(\$\{\(3 \+ depth \* 1\.5\)/);
  assert.doesNotMatch(source, /sampleAuroraSheetBottom|traceRibbon|LIGHT_COLUMNS|ctx\.createRadialGradient/);
  assert.match(source, /ctx\.globalCompositeOperation = "destination-in"/);
  assert.match(source, /ctx\.createLinearGradient\(0, height \* 0\.78, 0, height\)/);
  assert.match(source, /edgeFade\.addColorStop\(1, "rgba\(0, 0, 0, 0\)"\)/);
  assert.match(source, /ctx\.fillRect\(0, 0, width, height\)/);
  assert.match(source, /ctx\.filter = `blur\(/);
  assert.match(source, /drawAurora\(ctx, width, height, ridge\)/);
  assert.match(source, /FRAME_MS = 1000 \/ 30/);
  assert.match(source, /MAX_DPR = 1\.5/);
  assert.match(source, /visibilitychange/);
});

test("las crestas no se cortan en los bordes del canvas", () => {
  for (const seed of [0, 2.4]) {
    for (let seconds = 0; seconds <= 30; seconds += 0.5) {
      for (let x = 0; x <= 1440; x += 24) {
        const sample = sampleAuroraRidge(x, 1440, 100, seconds, seed);
        const glowReach = (18 + sample.depth * 5) / 2 + 9 + sample.depth * 2;
        assert.ok(sample.y - glowReach > 0 && sample.y + glowReach < 100);
      }
    }
  }
});

test("la aurora conserva accesibilidad y no captura el puntero", () => {
  assert.match(source, /pointer-events-none/);
  assert.match(source, /fixed inset-0 z-\[25\]/);
  assert.match(source, /prefers-reduced-motion: reduce/);
  assert.match(source, /cancelAnimationFrame/);
  assert.match(styles, /height: clamp\(80px, 12vh, 116px\)/);
  assert.doesNotMatch(styles, /mask-image|background:/);
  assert.match(source, /aria-hidden=\"true\"/);
});

test("la aurora se disuelve antes de desmontarse y respeta movimiento reducido", () => {
  assert.match(source, /useState\(isLocked\)/);
  assert.match(source, /requestAnimationFrame\(\(\) => setShouldRender\(true\)\)/);
  assert.match(source, /setShouldRender\(false\)/);
  assert.match(source, /reducedMotion \? 150 : EXIT_MS/);
  assert.match(source, /window\.clearTimeout\(timeoutId\)/);
  assert.match(styles, /\.leaving \.edge\s*\{[^}]*opacity: 0;[^}]*filter: blur\(14px\)/);
  assert.match(styles, /\.leaving \.status\s*\{[^}]*opacity: 0;[^}]*filter: blur\(8px\)/);
  assert.match(styles, /prefers-reduced-motion: reduce/);
});
