# Utilinent documentation website

This private local website documents only `@ilokesto/utilinent`. Canonical current MDX lives in `../docs`; frozen released MDX and its receipt remain under `../docs-publication/releases/utilinent/`.

- Keep `/en/utilinent`, `/ko/utilinent`, and their `/next` routes distinct. Released pages use the immutable selected snapshot; next pages use this repository's source.
- Scope home cards, search, LLM/Markdown, OG, and the existing Utilinent demo to this package. Keep the complete eight-package foreign-link classification in `lib/docs-links.ts`; foreign links resolve to the retained host and Utilinent links remain local.
- Keep the existing visual system and both locales. Do not duplicate package MDX in this directory or add unrelated package demos/API routes.
- Run root `pnpm docs:publication:verify`, `pnpm docs:typecheck`, `pnpm docs:build`, and `pnpm docs:test`; exercise the demo in desktop/mobile and both themes.
- This app is local-only during migration. Do not deploy or change hosting.
