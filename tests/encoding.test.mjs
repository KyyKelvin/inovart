import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { extname, join } from "node:path";
import test from "node:test";

const roots = [
  "app",
  "components",
  "lib",
  "supabase/functions",
  "supabase/migrations",
  "tests",
];
const sourceExtensions = new Set([".js", ".mjs", ".sql", ".ts", ".tsx"]);
const mojibakeSignature =
  /[\u00c2\u00c3\u00e2](?=[\u0080-\u024f\u02c6\u02dc\u2000-\u206f\u20ac\u2122])|\ufffd/u;

function sourceFiles(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory()
      ? sourceFiles(path)
      : sourceExtensions.has(extname(entry.name))
        ? [path]
        : [];
  });
}

test("source text does not contain mojibake", () => {
  const affected = roots
    .flatMap(sourceFiles)
    .filter((path) => mojibakeSignature.test(readFileSync(path, "utf8")));

  assert.deepEqual(affected, []);
});
