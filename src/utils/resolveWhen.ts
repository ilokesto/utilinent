export const resolveWhen = (value: unknown) =>
  Array.isArray(value) ? value.every(Boolean) : !!value;
