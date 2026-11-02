import { useKey } from "../../hooks/useKey";
import type { HotkeyProps } from "./types";

/**
 * @description Declares a keyboard hotkey. Renders nothing.
 * @param {HotkeyProps} props - Keyboard listener options.
 * @param {string} props.combo - KeyboardEvent.code or "*" for any key.
 * @param {(event: KeyboardEvent) => void} props.onPress - Matching-event callback.
 * @param {boolean} [props.enabled] - Enable the listener; defaults to true.
 * @param {"keydown" | "keyup"} [props.event] - Event type; defaults to keydown.
 * @param {boolean} [props.ignoreEditable] - Skip editable targets; defaults to false.
 * @returns {null} No rendered DOM.
 *
 * @example
 * ```tsx
 * <Hotkey combo="Escape" onPress={close} />
 * <Hotkey combo="KeyS" onPress={save} ignoreEditable />
 * ```
 */
export function Hotkey({ combo, onPress, ...options }: HotkeyProps): null {
  useKey(combo, onPress, options);
  return null;
}
