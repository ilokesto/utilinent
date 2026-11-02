export interface ScrollLockProps {
  /** Whether this component owns a scroll lock. Defaults to true. */
  when?: boolean;
  /** The target document; defaults to the global document after mounting. */
  ownerDocument?: Document;
}
