import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import { parse } from "yaml";

const workflow = parse(await readFile(
  new URL("../../.github/workflows/ci.yml", import.meta.url), "utf8",
));
const runtimeCommand = "pnpm --filter @ilokesto/utilinent test:react18";

for (const [jobName, unitCommand, condition] of [
  ["full", "pnpm test", undefined],
  ["packages", 'pnpm --filter "$PACKAGE" --if-present run test', "matrix.package == '@ilokesto/utilinent'"],
]) {
  test(`React 18 CI: ${jobName} verification -> required runtime follows normal unit tests`, () => {
    const job = workflow.jobs[jobName];
    const unitIndex = job.steps.findIndex((step) => step.run === unitCommand);

    const runtimeSteps = job.steps.filter((step) => step.run === runtimeCommand);

    assert.equal(runtimeSteps.length, 1);
    assert.equal(runtimeSteps[0].if, condition);
    assert.ok(unitIndex >= 0);
    assert.ok(job.steps.indexOf(runtimeSteps[0]) > unitIndex);
    assert.equal(runtimeSteps[0]["continue-on-error"], undefined);
    assert.equal(job["continue-on-error"], undefined);
    assert.ok(workflow.jobs.verify.needs.includes(jobName));
  });
}

test("React 18 fixture: installation contract -> private exact versions outside workspace dependencies", async () => {
  const packageRoot = new URL("../../packages/utilinent/", import.meta.url);
  const packageManifest = JSON.parse(await readFile(new URL("package.json", packageRoot), "utf8"));
  const fixture = JSON.parse(await readFile(new URL("test/react18/package.json", packageRoot), "utf8"));
  const lock = parse(await readFile(new URL("test/react18/pnpm-lock.yaml", packageRoot), "utf8"));

  const runtimeDependencies = fixture.devDependencies;

  assert.equal(packageManifest.scripts["test:react18"], "node scripts/test-react18.mjs");
  assert.equal(packageManifest.devDependencies.react, "19.2.8");
  assert.equal(packageManifest.devDependencies["react-dom"], "19.2.8");
  assert.equal(packageManifest.peerDependencies.react, ">=18.0.0");
  assert.equal(fixture.private, true);
  assert.equal(runtimeDependencies.react, "18.3.1");
  assert.equal(runtimeDependencies["react-dom"], "18.3.1");
  for (const [name, version] of Object.entries(runtimeDependencies)) {
    assert.match(version, /^\d+\.\d+\.\d+$/);
    assert.equal(lock.importers["."].devDependencies[name].specifier, version);
  }
});
