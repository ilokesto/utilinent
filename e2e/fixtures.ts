import { test as base, expect, chromium } from "@playwright/test";
import type { Browser, Page, TestInfo } from "@playwright/test";
import { spawn } from "node:child_process";
import { EventEmitter, once } from "node:events";
import { mkdtemp, rm, stat } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createServer as createViteServer } from "vite";
import type { ViteDevServer } from "vite";
import type { Signal } from "./HarnessApp";

export class BrowserHarness {
  readonly signals: Signal[] = [];
  readonly errors: string[] = [];
  readonly events = new EventEmitter();
  expectedHydrationErrors = 0;

  constructor(readonly page: Page, readonly origin: string, readonly testInfo: TestInfo) {}

  async until(kind: string, matches: (value: unknown) => boolean, action: () => Promise<unknown>) {
    let timer: ReturnType<typeof setTimeout> | undefined;
    let listener: (signal: Signal) => void = () => {};
    const received = new Promise<Signal>((resolveSignal, reject) => {
      listener = signal => {
        if (signal.kind === kind && matches(signal.value)) { resolveSignal(signal); }
      };
      this.events.on("signal", listener);
      timer = setTimeout(() => reject(new Error(`Missing ${kind}; received ${JSON.stringify(this.signals)}`)), 5_000);
    });
    try {
      const [signal] = await Promise.all([received, action()]);
      return signal;
    } finally {
      clearTimeout(timer);
      this.events.off("signal", listener);
    }
  }

  async open(route: string) {
    await this.until("ready", value => typeof value === "string" && value.startsWith("19."),
      async () => {
        await this.page.goto(this.origin + route);
        await this.page.bringToFront();
      });
  }

  async hydrate(kind: string, matches: (value: unknown) => boolean) {
    await this.until(kind, matches, () => this.page.evaluate(() => window.harness.hydrate()));
  }

  async click(id: string, kind: string, matches: (value: unknown) => boolean) {
    await this.until(kind, matches, () => this.page.locator(`#${id}`).click());
  }

  async scroll(bottom: boolean, matches: (value: unknown) => boolean) {
    await this.until("load-state", matches, () => this.page.locator("#scroll-root").evaluate((node, end) => {
      node.scrollTop = end ? node.scrollHeight : 0;
    }, bottom));
  }

  async unmount() {
    const screenshot = this.testInfo.outputPath("mounted.png");
    await this.page.screenshot({ path: screenshot });
    await this.testInfo.attach("mounted", { path: screenshot, contentType: "image/png" });
    await this.until("unmounted", value => value === true,
      () => this.page.evaluate(() => window.harness.unmount()));
    expect(await this.page.evaluate(() => window.harness.resources())).toEqual({
      listeners: 0, targets: 0, timers: 0,
    });
  }
}

export const test = base.extend<{ app: BrowserHarness }, { origin: string }>({
  origin: [async ({}, use) => {
    const cacheDir = await mkdtemp(join(tmpdir(), "utilinent-vite-"));
    let vite: ViteDevServer | undefined;
    const server = createServer();
    let origin = "";
    try {
      vite = await createViteServer({
        root: resolve("."),
        configFile: false,
        cacheDir,
        appType: "custom",
        server: { middlewareMode: true, hmr: false, watch: null },
        esbuild: { jsx: "automatic" },
      });
      const active = vite;
      server.on("request", (request, response) => {
        const route = new URL(request.url ?? "/", "http://localhost").pathname;
        if (route === "/favicon.ico") {
          response.writeHead(204).end();
          return;
        }
        if (["/focus", "/visibility", "/infinite", "/pending"].includes(route)) {
          void active.ssrLoadModule("/e2e/server-entry.tsx").then(({ render }) => {
            const markup = render(route);
            response.writeHead(200, { "content-type": "text/html" }).end(
              `<!doctype html><html lang="en"><head><meta name="viewport" content="width=device-width,initial-scale=1">
              <title>utilinent browser contracts</title></head><body><div id="root">${markup}</div>
              <script type="module" src="/e2e/client.tsx"></script></body></html>`,
            );
          }).catch(error => {
            response.writeHead(500).end(String(error));
          });
          return;
        }
        active.middlewares(request, response, () => response.writeHead(404).end());
      });
      const listening = once(server, "listening");
      server.listen(0, "127.0.0.1");
      await listening;
      const address = server.address();
      if (!address || typeof address === "string") { throw new Error("Missing ephemeral server port"); }
      origin = `http://127.0.0.1:${address.port}`;
      await use(origin);
    } finally {
      try {
        if (server.listening) {
          const closed = once(server, "close");
          server.close();
          server.closeAllConnections();
          await closed;
        }
      } finally {
        try { await vite?.close(); } finally { await rm(cacheDir, { recursive: true, force: true }); }
      }
      expect(server.listening).toBe(false);
      expect(await stat(cacheDir).catch(() => null)).toBeNull();
      process.stdout.write(`CLEANUP server=${origin} closed; cache=${cacheDir} removed\n`);
    }
  }, { scope: "worker" }],

  app: async ({ origin, viewport }, use, testInfo) => {
    const profile = await mkdtemp(join(tmpdir(), "utilinent-chromium-"));
    const process = spawn(chromium.executablePath(), [
      "--headless=new", "--no-sandbox", "--disable-dev-shm-usage",
      "--no-first-run", "--no-default-browser-check",
      "--remote-debugging-port=0", `--user-data-dir=${profile}`, "about:blank",
    ], { stdio: ["ignore", "ignore", "pipe"] });
    const exited = new Promise<void>(resolveExit => process.once("close", () => resolveExit()));
    let browser: Browser | undefined;
    let app: BrowserHarness | undefined;
    try {
      const endpoint = await new Promise<string>((resolveEndpoint, reject) => {
        let stderr = "";
        const timer = setTimeout(() => finish(new Error(`Chromium startup timed out: ${stderr}`)), 10_000);
        function finish(error?: Error, url?: string) {
          clearTimeout(timer);
          process.stderr.off("data", output);
          process.off("error", finish);
          process.off("exit", earlyExit);
          if (error) { reject(error); } else if (url) { resolveEndpoint(url); }
        }
        function output(chunk: Buffer) {
          stderr += chunk.toString();
          const endpoint = /DevTools listening on (ws:\/\/[^\s]+)/.exec(stderr)?.[1];
          if (endpoint) { finish(undefined, endpoint); }
        }
        function earlyExit() { finish(new Error(`Chromium exited during startup: ${stderr}`)); }
        process.stderr.on("data", output);
        process.once("error", finish);
        process.once("exit", earlyExit);
      });
      // launchPersistentContext enables focus emulation on its own CDP session.
      // Attaching without defaults preserves real activation/visibility instead.
      browser = await chromium.connectOverCDP(endpoint, { noDefaults: true });
      const context = browser.contexts()[0];
      const page = context.pages()[0];
      if (viewport) { await page.setViewportSize(viewport); }
      app = new BrowserHarness(page, origin, testInfo);
      const harness = app;
      page.on("pageerror", error => harness.errors.push(String(error)));
      page.on("console", message => {
        if (message.type() === "error") { harness.errors.push(message.text()); }
      });
      await page.exposeBinding("reportSignal", (_source, signal: Signal) => {
        harness.signals.push(signal);
        harness.events.emit("signal", signal);
      });
      await use(app);
      expect(app.errors).toEqual([]);
      expect(app.signals.filter(signal => signal.kind === "hydration-error")).toHaveLength(app.expectedHydrationErrors);
    } finally {
      try {
        if (app) {
          await testInfo.attach("browser-events", {
            body: JSON.stringify({ signals: app.signals, errors: app.errors }, null, 2),
            contentType: "application/json",
          });
          if (!app.page.isClosed() && testInfo.status !== testInfo.expectedStatus) {
            const screenshot = testInfo.outputPath("failure.png");
            await app.page.screenshot({ path: screenshot });
            await testInfo.attach("browser", { path: screenshot, contentType: "image/png" });
          }
        }
      } finally {
        try {
          await browser?.close();
        } finally {
          if (process.exitCode === null && process.signalCode === null) { process.kill("SIGTERM"); }
          const deadline = setTimeout(() => process.kill("SIGKILL"), 5_000);
          try { await exited; } finally { clearTimeout(deadline); }
          await rm(profile, { recursive: true, force: true });
        }
      }
      expect(browser?.isConnected() ?? false).toBe(false);
      expect(await stat(profile).catch(() => null)).toBeNull();
      globalThis.process.stdout.write(`CLEANUP browser pid=${process.pid} exited; profile=${profile} removed\n`);
    }
  },
});

export { expect };
