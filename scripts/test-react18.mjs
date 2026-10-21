import { spawn } from "node:child_process";
import { cp, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const packageRoot = fileURLToPath(new URL("../", import.meta.url));
const fixture = join(packageRoot, "test/react18");
const runtime = await mkdtemp(join(tmpdir(), "utilinent-react18-"));

async function run(args) {
  const child = spawn("pnpm", args, {
    cwd: runtime,
    stdio: "inherit",
    env: { ...process.env, UTILINENT_RUNTIME_VERSION: "18.3.1" },
  });
  const code = await new Promise((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (status, signal) => {
      if (signal) {
        reject(new Error(`pnpm terminated by ${signal}`));
      } else {
        resolve(status);
      }
    });
  });
  if (code !== 0) {
    throw new Error(`pnpm ${args.join(" ")} exited with ${code}`);
  }
}

try {
  for (const name of ["package.json", "pnpm-lock.yaml", "pnpm-workspace.yaml", "vitest.config.ts"]) {
    await cp(join(fixture, name), join(runtime, name));
  }
  await cp(join(packageRoot, "src"), join(runtime, "src"), { recursive: true });
  await cp(join(packageRoot, "test"), join(runtime, "test"), {
    recursive: true,
    filter: (path) => path !== fixture,
  });
  await cp(join(packageRoot, "tsconfig.json"), join(runtime, "tsconfig.json"));
  process.stdout.write(`React 18 isolated runtime: ${runtime}\n`);
  await run(["install", "--frozen-lockfile"]);
  await run(["exec", "vitest", "run"]);
} finally {
  await rm(runtime, { recursive: true, force: true });
}
