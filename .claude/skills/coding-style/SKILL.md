---
name: coding-style
description: Coding style for this micro-frontend repo (Angular shell, Angular/React/Vue remotes, Express gateway, @mfe/bridge). Use before writing or editing any code in this repository.
---

# Coding style

## Comments

- Write almost no comments. Clear names come first.
- Add a comment only when the *why* isn't obvious from the code: a browser quirk, a security check, a loop guard. Keep it to one line.
- No JSDoc on every interface or function, no banner or section-divider comments, and no comments that restate the code.
- Do not leave commented-out code behind.

## Formatting

- Prettier with `singleQuote: true`; 2-space indent; final newline; UTF-8 (`.editorconfig`).
- Prefer early returns over nested `if`s.

## TypeScript

- `strict` everywhere. No `any`; use `unknown` and narrow it.
- Prefer `interface` for object shapes and string-literal unions over enums.
- Prefer plain functions and factories (`createX()`) over classes outside of framework code.
- Shared code goes in `libs/<name>` and is imported through a `tsconfig.base.json` path alias (`@mfe/<name>`). Never use relative imports across apps.

## Angular (shell, angular-app)

- Standalone components, `inject()` instead of constructor injection, signals for local state.
- Keep templates declarative. Logic belongs in the component or a service.
- No getters that allocate in templates (e.g. a `SafeResourceUrl` built in a getter); compute once.

## React (react-app)

- Function components and hooks only. Router `basename` must match the Vite `base`.

## Vue (vue-app)

- `<script setup lang="ts">`, Composition API, `createWebHistory(import.meta.env.BASE_URL)`.

## Micro frontend rules

- Remotes never import from other apps. They talk only through `@mfe/bridge`.
- Every app must still work when opened standalone (outside the shell).
- `postMessage` always targets `window.location.origin`, never `'*'`.
- Treat a message shape change in `libs/mfe-bridge/src/lib/protocol.ts` as a cross-team API change.

## Before finishing

```bash
npx nx run-many -t lint test build
```
