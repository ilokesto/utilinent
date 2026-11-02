import { useDebouncedCallback, useThrottledCallback } from "../../../dist/hooks";

type Assert<Condition extends true> = Condition;
type Equal<Left, Right> =
  (<Value>() => Value extends Left ? 1 : 2) extends
  (<Value>() => Value extends Right ? 1 : 2) ? true : false;

export function useCallbackTimingReact19TypeContract() {
  const callback = (name: string, count?: number, ...flags: boolean[]) => ({
    name, count, flags,
  });
  const debounced = useDebouncedCallback(callback, 100, { leading: true });
  const throttled = useThrottledCallback(callback, 100, { trailing: false });
  const asyncCallback = useDebouncedCallback(async (id: number) => String(id), 100);
  const noArgs = useThrottledCallback(() => 42, 100);
  const acceptsArgs = (args: Parameters<typeof callback>) => {
    debounced(...args);
    throttled(...args);
  };
  return { debounced, throttled, asyncCallback, noArgs, acceptsArgs };
}

type Contract = ReturnType<typeof useCallbackTimingReact19TypeContract>;
type ExpectedArgs = [name: string, count?: number, ...flags: boolean[]];
type ExpectedResult = { name: string; count: number | undefined; flags: boolean[] };

export type CallbackTimingReact19TypeContract = [
  Assert<Equal<Parameters<Contract["debounced"]>, ExpectedArgs>>,
  Assert<Equal<Parameters<Contract["throttled"]>, ExpectedArgs>>,
  Assert<Equal<ReturnType<Contract["debounced"]>, void>>,
  Assert<Equal<ReturnType<Contract["throttled"]>, void>>,
  Assert<Equal<ReturnType<Contract["debounced"]["flush"]>, ExpectedResult | undefined>>,
  Assert<Equal<ReturnType<Contract["throttled"]["flush"]>, ExpectedResult | undefined>>,
  Assert<Equal<Parameters<Contract["debounced"]["cancel"]>, []>>,
  Assert<Equal<ReturnType<Contract["debounced"]["cancel"]>, void>>,
  Assert<Equal<Parameters<Contract["throttled"]["flush"]>, []>>,
  Assert<Equal<ReturnType<Contract["throttled"]["cancel"]>, void>>,
  Assert<Equal<ReturnType<Contract["asyncCallback"]["flush"]>, Promise<string> | undefined>>,
  Assert<Equal<Parameters<Contract["noArgs"]>, []>>,
  Assert<Equal<[number] extends Parameters<Contract["debounced"]> ? true : false, false>>,
];
