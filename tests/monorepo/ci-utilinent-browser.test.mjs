import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

for (const name of ["full", "packages"]) {
  test(`utilinent browser CI: ${name} verification -> installs Chromium and requires browser contracts`, async () => {
    const { jobs } = parse(await readFile(new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8"));
    const job = jobs[name];
    const install = job.steps.findIndex(step =>
      step.run === "pnpm --filter @ilokesto/utilinent exec playwright install --with-deps chromium");
    const run = job.steps.findIndex(step =>
      step.run === "pnpm --filter @ilokesto/utilinent test:browser");

    assert.ok(install >= 0);
    assert.ok(run > install);
    for (const step of [job.steps[install], job.steps[run]]) {
      assert.equal(step.if, name === "packages" ? "matrix.package == '@ilokesto/utilinent'" : undefined);
      assert.equal(step["continue-on-error"], undefined);
      assert.equal(step.env?.UTILINENT_BROWSER_CHANNEL, undefined);
    }
    assert.equal(job["continue-on-error"], undefined);
    assert.ok(jobs.verify.needs.includes(name));
    assert.equal(jobs.verify.if, "always()");
  });
}
