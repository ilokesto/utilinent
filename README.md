# @ilokesto/utilinent

Small React components for conditional rendering, lists, and asynchronous UI.

[![npm](https://img.shields.io/npm/v/@ilokesto/utilinent?style=flat&color=555)](https://www.npmjs.com/package/@ilokesto/utilinent)
[![License: MIT](https://img.shields.io/badge/license-MIT-555?style=flat)](https://opensource.org/license/mit)

[Docs](https://ilokesto.ayden94.com/en/utilinent) | [API](./docs/reference) | [한국어](./README.ko.md)

- **Readable JSX** with `Show`, `For`, and `Switch` / `Match`.
- **Async rendering** with `Mount`, lazy loading, and explicit fallbacks.
- **Components and hooks** for browser events, visibility, and layout.

## Installation

```sh
pnpm add @ilokesto/utilinent
```

Requires React 18 or 19.

## Quick start

```tsx
import { For, Show } from '@ilokesto/utilinent';

type User = { id: string; name: string };

export function UserList({
  users,
  loading,
}: {
  users: User[];
  loading: boolean;
}) {
  return (
    <Show when={!loading} fallback={<p>Loading users...</p>}>
      <For.ul each={users} fallback={<li>No users found.</li>}>
        {(user) => <li key={user.id}>{user.name}</li>}
      </For.ul>
    </Show>
  );
}
```

For async rendering, pass `Mount` a **factory**, not a Promise directly. See the
[Mount contract](./docs/reference/mount.mdx) for cancellation and error handling.

## Further reading

- [Getting started](./docs/quick-start.mdx)
- [Lists and empty states](./docs/guides/list-and-empty-states.mdx)
- [Custom proxy components](./docs/guides/custom-proxy-components.mdx)
- [Hooks](./docs/reference/use-event-listener.mdx) — also available from `@ilokesto/utilinent/hooks`.

<details>
<summary>Development</summary>

Use Node 22 and pnpm 10.17.1 from this repository.

```sh
pnpm install --frozen-lockfile
pnpm build
pnpm typecheck
pnpm test
pnpm test:react18
pnpm test:browser
pnpm typecheck:react19
pnpm test:tooling
pnpm migrate:verify
pnpm docs:publication:verify
pnpm docs:typecheck
pnpm docs:build
pnpm docs:test
```

See [browser testing](./BROWSER_TESTING.md) and [React runtime testing](./REACT_RUNTIME_TESTING.md).
Publishing and documentation deployment remain disabled during bootstrap.

</details>

MIT licensed.
