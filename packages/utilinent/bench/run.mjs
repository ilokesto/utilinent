import { execFileSync } from "node:child_process";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { arch, cpus, platform, release } from "node:os";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { parseArgs } from "node:util";
import { chromium } from "@playwright/test";
import { build } from "vite";

const packageDir = fileURLToPath(new URL("../", import.meta.url));
const require = createRequire(import.meta.url);
const { values } = parseArgs({
  options: {
    warmup: { type: "string", default: "3" },
    samples: { type: "string", default: "5" },
    targets: { type: "string", default: "100" },
    iterations: { type: "string", default: "20" },
    output: { type: "string" },
    help: { type: "boolean" },
  },
});
if (values.help) {
  process.stdout.write(
    "pnpm bench [--warmup 3] [--samples 5] [--targets 100] [--iterations 20] [--output result.json]\n",
  );
  process.exit(0);
}
const config = {};
for (const key of ["warmup", "samples", "targets", "iterations"]) {
  const count = Number(values[key]);
  if (!/^\d+$/.test(values[key]) || !Number.isSafeInteger(count) || count < (key === "warmup" ? 0 : 1)) {
    throw new Error(`--${key} must be a ${key === "warmup" ? "nonnegative" : "positive"} safe integer`);
  }
  config[key] = count;
}

const [output] = await build({
  configFile: false,
  root: packageDir,
  logLevel: "silent",
  define: { "process.env.NODE_ENV": JSON.stringify("production") },
  build: {
    write: false,
    minify: false,
    lib: {
      entry: resolve(packageDir, "bench/workload.js"),
      name: "UtilinentMeasurements",
      formats: ["iife"],
    },
  },
});
const bundle = output.output.find((entry) => entry.type === "chunk").code;
const server = createServer((request, response) => {
  response.setHeader("Content-Type", request.url === "/workload.js" ? "text/javascript" : "text/html");
  response.end(request.url === "/workload.js"
    ? bundle
    : '<!doctype html><html><head><title>utilinent measurements</title></head><body><script src="/workload.js"></script></body></html>');
});
let browser;
let result;
try {
  await new Promise((resolveReady, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolveReady);
  });
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const page = await context.newPage();
  const errors = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(`http://127.0.0.1:${server.address().port}`);
  const environment = {
    timestamp: new Date().toISOString(),
    sourceRevision: execFileSync("git", ["rev-parse", "HEAD"], { cwd: packageDir, encoding: "utf8" }).trim(),
    utilinent: JSON.parse(await readFile(resolve(packageDir, "package.json"), "utf8")).version,
    node: process.version,
    react: require("react/package.json").version,
    reactDom: require("react-dom/package.json").version,
    vite: require("vite/package.json").version,
    playwright: require("@playwright/test/package.json").version,
    chromium: browser.version(),
    platform: platform(),
    osRelease: release(),
    arch: arch(),
    cpu: cpus()[0]?.model ?? null,
    logicalCpus: cpus().length,
    viewport: { width: 1280, height: 720 },
    headless: true,
    reactMode: "production; no StrictMode",
    userAgent: await page.evaluate(() => navigator.userAgent),
  };
  const measurements = await page.evaluate((options) => window.utilinentBench.measure(options), config);
  await page.evaluate((targets) => window.utilinentBench.prepareRetention(targets), config.targets);
  const cdp = await context.newCDPSession(page);
  // CDP completes GC in a different browser task from WeakRef creation/deref.
  const retention = { gc: "Chromium CDP HeapProfiler.collectGarbage", collectionsPerCheckpoint: 2 };
  for (const checkpoint of ["controlRetained", "controlReleased"]) {
    if (checkpoint === "controlReleased") {
      await page.evaluate(() => window.utilinentBench.releaseControl());
    }
    await cdp.send("HeapProfiler.collectGarbage");
    await cdp.send("HeapProfiler.collectGarbage");
    retention[checkpoint] = await page.evaluate(() => window.utilinentBench.readRetention());
  }
  await cdp.detach();
  const invariants = await page.evaluate(() => window.utilinentBench.finish());
  if (errors.length > 0) {
    throw new Error(`Browser errors: ${errors.join("; ")}`);
  }
  const control = retention.controlRetained;
  if (control.controlTargets !== config.targets || control.controlPayloads !== config.targets) {
    throw new Error("Known retained-reference control was not detected");
  }
  result = {
    schemaVersion: 1,
    environment,
    config,
    invariants: { ...invariants, retainedControlDetected: true },
    measurements,
    retention,
    heapBytes: {
      value: null,
      reason: "No attributable retained-byte baseline; browser/React heaps and native DOM memory are not isolated.",
    },
    limits: [
      "Single Chromium build, production React, local source bundled with Vite; not a packed consumer or cross-browser comparison.",
      "Native observer methods execute unchanged; counting wrappers, React scheduling, and DOM operations contribute overhead.",
      "Timings are observations, not CI thresholds, before/after baselines, or claimed speedups.",
      "WeakRef survivors are observations after two forced collections, not proof of a leak or universal garbage-collection guarantees.",
      "Lazy allocation counts count factory-returned wrapper objects, not bytes or total engine allocations.",
    ],
  };
} finally {
  try {
    await browser?.close();
  } finally {
    await new Promise((resolveClosed, reject) => server.close((error) => error ? reject(error) : resolveClosed()));
  }
}
result.resources = { browserClosed: true, serverClosed: true, buildWrittenToDisk: false };
const json = `${JSON.stringify(result, null, 2)}\n`;
if (values.output) {
  const destination = resolve(values.output);
  await mkdir(dirname(destination), { recursive: true });
  await writeFile(destination, json);
}
process.stdout.write(json);
