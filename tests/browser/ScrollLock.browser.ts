import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { test, expect } from "../fixtures/browser/fixtures";

test("ScrollLock: nested native document locks -> blocks scrolling and restores styles and position", async ({ app }) => {
  const html = await readFile(resolve("tests/fixtures/browser/ScrollLock.html"), "utf8");
  await app.page.route("**/tests/fixtures/browser/ScrollLock.html", route =>
    route.fulfill({ contentType: "text/html", body: html }));
  await app.until("scroll-lock-state", value => value === false,
    () => app.page.goto(app.origin + "/tests/fixtures/browser/ScrollLock.html"));
  const initial = await app.page.evaluate(() => {
    window.scrollTo({ left: 120, top: 500, behavior: "instant" });
    return {
      x: window.scrollX,
      y: window.scrollY,
      marker: document.getElementById("marker")!.getBoundingClientRect().top,
      position: document.body.style.getPropertyValue("position"),
      priority: document.body.style.getPropertyPriority("position"),
      width: document.body.style.width,
    };
  });
  expect(initial.x).toBe(120);
  expect(initial.y).toBe(500);

  await app.until("scroll-lock-state", value => value === true,
    () => app.page.evaluate(() => window.scrollLockFixture.lock(true, true)));
  const locked = await app.page.evaluate(() => {
    window.scrollTo({ left: 800, top: 1200, behavior: "instant" });
    return {
      x: window.scrollX,
      y: window.scrollY,
      position: getComputedStyle(document.body).position,
      marker: document.getElementById("marker")!.getBoundingClientRect().top,
    };
  });
  expect(locked).toEqual({ x: 0, y: 0, position: "fixed", marker: initial.marker });

  await app.until("scroll-lock-state", value => value === true,
    () => app.page.evaluate(() => window.scrollLockFixture.lock(false, true)));
  expect(await app.page.evaluate(() => getComputedStyle(document.body).position)).toBe("fixed");

  await app.until("scroll-lock-state", value => value === false,
    () => app.page.evaluate(() => window.scrollLockFixture.lock(false, false)));
  expect(await app.page.evaluate(() => ({
    x: window.scrollX,
    y: window.scrollY,
    marker: document.getElementById("marker")!.getBoundingClientRect().top,
    position: document.body.style.getPropertyValue("position"),
    priority: document.body.style.getPropertyPriority("position"),
    width: document.body.style.width,
  }))).toEqual(initial);

  await app.until("scroll-lock-state", value => value === true,
    () => app.page.evaluate(() => window.scrollLockFixture.lock(true, false)));
  await app.until("scroll-lock-unmounted", value => value === true,
    () => app.page.evaluate(() => window.scrollLockFixture.unmount()));
  expect(await app.page.evaluate(() => ({
    x: window.scrollX, y: window.scrollY,
    color: document.body.style.color,
    position: document.body.style.position,
    priority: document.body.style.getPropertyPriority("position"),
  }))).toEqual({
    x: initial.x, y: initial.y, color: "rgb(20, 30, 40)",
    position: initial.position, priority: initial.priority,
  });
});
