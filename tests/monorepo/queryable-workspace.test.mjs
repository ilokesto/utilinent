import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { test } from "node:test";
import { releaseOrder } from "../../scripts/publish-packages.mjs";

test("queryable: private beta manifest -> excluded from npm release automation", async () => {
  const path = new URL("../../packages/queryable/package.json", import.meta.url);

  const manifest = JSON.parse(await readFile(path, "utf8"));

  assert.equal(manifest.name, "@ilokesto/queryable");
  assert.equal(manifest.version, "0.0.1");
  assert.equal(manifest.private, true);
  assert.equal(releaseOrder.includes("queryable"), false);
  assert.deepEqual(manifest.dependencies ?? {}, {});
});
