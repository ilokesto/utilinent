import { createRequire } from "node:module";
import { createRef, useState, version } from "react";
import { version as rendererVersion } from "react-dom";
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";
import { Slot } from "../src";

const require = createRequire(import.meta.url);
const testingLibraryRequire = createRequire(require.resolve("@testing-library/react"));
const rendererRequire = createRequire(testingLibraryRequire.resolve("react-dom"));
const expectedVersion = process.env.UTILINENT_RUNTIME_VERSION ??
  require("../package.json").devDependencies.react;

it("runtime: Testing Library renders a stateful component -> React and renderer use the expected version", () => {
  function Probe() {
    const [count, setCount] = useState(0);
    return <button onClick={() => setCount(count + 1)}>{version}:{count}</button>;
  }
  render(<Probe />);

  fireEvent.click(screen.getByRole("button"));

  expect(screen.getByRole("button")).toHaveTextContent(`${expectedVersion}:1`);
  expect(version).toBe(expectedVersion);
  expect(rendererVersion).toBe(expectedVersion);
  expect(testingLibraryRequire("react").version).toBe(expectedVersion);
  expect(testingLibraryRequire("react-dom").version).toBe(expectedVersion);
  expect(rendererRequire("react").version).toBe(expectedVersion);
  expect(testingLibraryRequire.resolve("react")).toBe(require.resolve("react"));
  expect(rendererRequire.resolve("react")).toBe(require.resolve("react"));
  expect(testingLibraryRequire.resolve("react-dom")).toBe(require.resolve("react-dom"));
  process.stdout.write(
    `Runtime verified: React=${version} ReactDOM=${rendererVersion} ` +
    `RTL React=${testingLibraryRequire("react").version} ` +
    `renderer React=${rendererRequire("react").version}\n`,
  );
});

it("Slot: ordinary callback and object refs -> attach once and clear on unmount", () => {
  const callbackRef = vi.fn();
  const objectRef = createRef<HTMLButtonElement>();
  const rendered = render(
    <Slot ref={callbackRef}><button ref={objectRef}>Target</button></Slot>,
  );
  const button = screen.getByRole("button");
  expect(callbackRef).toHaveBeenCalledTimes(1);
  expect(callbackRef).toHaveBeenCalledWith(button);
  expect(objectRef.current).toBe(button);

  rendered.unmount();

  expect(callbackRef).toHaveBeenCalledTimes(2);
  expect(callbackRef).toHaveBeenLastCalledWith(null);
  expect(objectRef.current).toBeNull();
});
