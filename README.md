# @ilokesto/utilinent

Small React components for conditional rendering, lists, and asynchronous UI.

[![npm](https://img.shields.io/npm/v/@ilokesto/utilinent?style=flat&color=555)](https://www.npmjs.com/package/@ilokesto/utilinent)
[![License: MIT](https://img.shields.io/badge/license-MIT-555?style=flat)](https://opensource.org/license/mit)

[한국어](./README.ko.md)

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

For async rendering, pass `Mount` a **factory**, not a Promise directly. Use cancellation and error handling for asynchronous work.

<details>
<summary>Development</summary>

Use Node 24.22.1 and pnpm 10.17.1 from this repository.

```sh
pnpm install --frozen-lockfile
pnpm exec playwright install chromium
pnpm typecheck
pnpm test
```

`pnpm test` builds once and runs `test:unit`, `test:types` (including `test:types:react19`), `test:tooling`, `test:react18`, and `test:browser`. `pnpm typecheck` checks library source only. Standalone declaration checks require a prior build. Tests live under `tests/{unit,types,tooling,browser,fixtures}`.


See [browser testing](./BROWSER_TESTING.md) and [React runtime testing](./REACT_RUNTIME_TESTING.md).
Pull requests run Verify CI. Main merges create or update a Changesets release PR; merging
that PR publishes only the exact successful Verify artifact through GitHub Actions. Enable
`Allow GitHub Actions to create and approve pull requests` and configure `NPM_TOKEN` in the
`Production` environment before rollout. Never publish locally.

</details>

MIT licensed.
