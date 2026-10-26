# Micro Frontend Shell

A working, deliberately small example of a **micro frontend** architecture. One **Angular shell** hosts three independently built apps (**Angular**, **React**, **Vue**) inside iframes. An Express **Gateway** behind **Traefik** decides, per app, whether to serve a static build or proxy to a local dev server. A tiny framework-agnostic library, **`@mfe/bridge`**, keeps routes, theme and events in sync across the iframe boundary.

Use this repo to learn what micro frontends are, try one integration style end to end, and see the problems you have to solve no matter which style you pick.

---

## Table of Contents

- [What is a micro frontend?](#what-is-a-micro-frontend)
- [When should you (not) use one?](#when-should-you-not-use-one)
- [Integration approaches](#integration-approaches)
- [This repo's architecture](#this-repos-architecture)
- [Cross-app communication: `@mfe/bridge`](#cross-app-communication-mfebridge)
- [Running the project](#running-the-project)
- [Gateway and Traefik configuration](#gateway-and-traefik-configuration)
- [Known limitations and roadmap](#known-limitations-and-roadmap)

---

## What is a micro frontend?

> Micro frontends apply the microservices idea to the browser: **split one product UI into pieces that separate teams can build, test and deploy on their own**, then compose those pieces into what users see as one app.

Every micro frontend setup has the same three parts, whatever the tooling:

| Part | Job | In this repo |
| --- | --- | --- |
| **Host / shell** | Owns the page frame (header, nav, auth, layout) and decides which micro app to show | `apps/shell` (Angular) |
| **Micro apps (remotes)** | Each owns one business area, end to end, and can ship on its own schedule | `apps/angular-app`, `apps/react-app`, `apps/vue-app` |
| **Composition + contract** | How remotes get onto the page, and how they talk to the shell and each other | iframes + `@mfe/bridge` (postMessage) |

The key word is **independent**: independent repos or projects, independent builds, independent deploys, and often independent frameworks. If you have to redeploy everything to change one piece, you have a modular monolith rather than micro frontends. A modular monolith is often the better choice anyway.

## When should you (not) use one?

**Good reasons**

- Several teams work on one product and keep blocking each other's releases.
- Business areas are clearly separate (billing, reporting, admin…) and change at different speeds.
- You are migrating a legacy app piece by piece (strangler pattern), e.g. AngularJS → Angular/React.
- You must embed apps built by other teams, vendors or acquisitions.

**Bad reasons**

- "It's modern." A small team gets the costs and none of the benefits.
- You want to mix frameworks for fun. Every extra framework is more bytes, more upgrades and more knowledge to maintain.
- Your domain boundaries aren't clear yet. Splitting too early freezes the wrong seams.

**What you pay for it:** more infrastructure, duplicated dependencies, cross-app UX consistency (a design system becomes mandatory), routing and state sync, shared auth, end-to-end testing across apps, and versioning of the contracts between them.

## Integration approaches

| Approach | How it composes | Isolation | Performance | Shared deps | Best for |
| --- | --- | --- | --- | --- | --- |
| **iframes** *(this repo)* | Browser loads each app as a separate document | ★★★ Full: JS, CSS, globals, crashes | ★ Each frame boots its own framework; extra requests | None | Legacy/third-party embedding, hard isolation, mixed frameworks, fastest start |
| **Webpack Module Federation** / **Native Federation** | Host loads remote JS modules at runtime from a `remoteEntry` | ★ Same document; CSS/global leaks possible | ★★★ Shared singletons (one Angular/React) | Yes, version-negotiated | Many teams, same framework, one SPA feel |
| **single-spa** | Root config mounts/unmounts framework apps by route | ★ Same document | ★★ | Via import maps | Mixed frameworks in one document |
| **Web Components** | Each app ships a custom element (`<billing-app>`) | ★★ Shadow DOM isolates CSS | ★★ | Optional | Framework-agnostic widgets, design systems |
| **Server/edge composition** (e.g. AWS CloudFront + S3 per app, Lambda@Edge, SSI/ESI) | Pages or fragments assembled before reaching the browser | ★★ | ★★★ SEO and first paint | N/A | Content sites, SEO-critical pages |
| **Build-time composition** (npm packages, **Bit** components) | Pieces are versioned packages built into one bundle | ✗ | ★★★ | Yes | Sharing UI/components. You get independent *development* but not independent *deployment* |

Notes:

- **AWS** has no single "micro frontend service". You build one from parts: each team deploys to its own **S3 bucket + CloudFront** behavior (or **Amplify Hosting** app), CloudFront routes by path, and **Lambda@Edge / CloudFront Functions** can rewrite or compose. AWS Prescriptive Guidance documents this pattern. It handles the hosting/routing layer, which plays the same role as the Gateway + Traefik here; you still need one of the client-side approaches above.
- **Bit** shines at sharing and independently versioning *components* across teams. It complements runtime composition; it does not replace it.
- You can **mix approaches**: e.g. Module Federation for first-party Angular apps plus iframes for a legacy or vendor app.

### Quick decision guide

```
Need hard isolation, or embedding apps you don't control?  → iframes
Same framework, many teams, want it to feel like one SPA?  → Module / Native Federation
Different frameworks in one document?                      → single-spa or Web Components
SEO / first paint is the top priority?                     → server or edge composition
Only want shared components, deploy together?              → npm / Bit (not really micro frontends)
```

---

## This repo's architecture

```
 Browser  http://localhost:8082/shell/vue-app/about
   │
   ▼
┌──────────────┐   every path   ┌──────────────────────────┐
│   Traefik    │ ─────────────▶ │  Gateway (Express :9000) │
│   (:8082)    │                │  reads app-mode-config   │
└──────────────┘                └────────────┬─────────────┘
                                             │ per app: "serve" → proxy to dev server
                                             │          "static" → dist/apps/<app>
             ┌──────────────┬────────────────┼───────────────┬──────────────┐
             ▼              ▼                ▼               ▼
        /shell (:5000) /angular-app (:5001) /react-app (:5002) /vue-app (:5003)

 In the browser:
┌─────────────────────────── shell (Angular) ───────────────────────────┐
│ header · nav · theme toggle · event log                               │
│ ┌──────────────── <iframe src="/vue-app/about"> ───────────────────┐  │
│ │  vue-app, unaware it's embedded except for @mfe/bridge           │  │
│ └──────────────────────────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────────────────────────┘
          ▲ postMessage (same origin, validated envelope) ▼
```

**Why everything goes through one origin:** the Gateway serves every app under its own path prefix (`/shell`, `/vue-app`, …) on the same host. The iframes are therefore **same-origin**, so there's no CORS, cookies are shared, and `postMessage` can be locked down to `window.location.origin`.

| Folder | What it is |
| --- | --- |
| `apps/shell` | Angular host. Routes `/<app>/**` to `AppLoaderComponent`, which renders one iframe per app |
| `apps/angular-app` · `apps/react-app` · `apps/vue-app` | Independent micro apps, each with its own router and base path |
| `libs/mfe-bridge` | Framework-agnostic messaging contract used by the shell and all remotes |
| `apps/gateway` | Express server: proxy-or-static per app, SPA fallback |
| `traefik.yml`, `docker-compose.yml` | Edge router and container setup |
| `app-mode-config.json` | `serve` or `static` per app |

---

## Cross-app communication: `@mfe/bridge`

Iframes isolate everything, so the shell and the remotes can only talk through `window.postMessage`. `libs/mfe-bridge` wraps that in a small, typed protocol with no framework dependencies. Any app, in any framework, can use it.

### Message contract

Every message uses the same envelope, and anything that doesn't match it is ignored:

```ts
{ protocol: 'mfe-bridge', version: 1, type, app, payload }
```

| Direction | `type` | Payload | Purpose |
| --- | --- | --- | --- |
| remote → shell | `ready` | `{ path }` | Remote booted; shell replies with `context` (and `navigate` if needed) |
| remote → shell | `route-changed` | `{ path }` | Remote navigated internally; shell mirrors it in the address bar |
| remote → shell | `event` | `{ name, data }` | Domain event (e.g. "item added"); shell logs it and re-broadcasts to other frames |
| shell → remote | `navigate` | `{ path }` | Shell URL changed (back button, deep link, shell link) |
| shell → remote | `context` | `{ theme, user, locale }` | Shared state owned by the shell |
| shell → remote | `event` | `{ name, data, from }` | Re-broadcast of another app's event |

### Security rules built in

- `targetOrigin` is always `window.location.origin`, never `'*'`.
- Incoming messages are dropped unless `event.origin` matches, **and** `event.source` is the expected window (the shell only accepts messages from its own iframe; remotes only accept messages from `window.parent`), **and** the envelope is valid.
- Without a parent frame (app opened directly at `:5003`), the bridge does nothing and the app works standalone.

### Route synchronisation

```
User clicks "About" inside vue-app
  vue-router → /about ──▶ bridge: route-changed {path:'/about'}
                              shell: router.navigate('/vue-app/about', { replaceUrl: true })
                              address bar: /shell/vue-app/about   ✓ shareable, refresh-safe

User presses Back / opens a deep link / clicks a shell link
  shell URL → /shell/vue-app/ ──▶ bridge: navigate {path:'/'}
                                   vue-router.replace('/') ──▶ route-changed {path:'/'}
                                   shell sees same path → stops (no loop)
```

Design choices:

- **The iframe `src` is set once per app.** Later navigation goes through messages, so the remote never reloads.
- **The shell uses `replaceUrl` when mirroring a remote.** The iframe's own `pushState` already adds the history entry (iframes share the tab's joint session history), so pushing again would make Back need two presses.
- **Loop guard:** each side remembers the last path it reported or received and ignores no-op updates.

### Using it in a remote

```ts
import { createRemoteBridge } from '@mfe/bridge';

const bridge = createRemoteBridge({
  app: 'vue-app',
  onNavigate: (path) => router.replace(path),
  onContext: (ctx) => document.documentElement.dataset.theme = ctx.theme,
});
router.afterEach((to) => bridge.routeChanged(to.fullPath));
bridge.emit('cart:item-added', { sku: 'A-42' });
```

There are ready-made adapters for each framework in `apps/*/src`: look for `bridge` in the Angular app's `app.config.ts`, React's `app.tsx`, and Vue's `main.ts`.

---

## Running the project

### Prerequisites

- Node.js (LTS) and npm
- Docker & Docker Compose

```bash
npm install
```

### Development mode (proxy to dev servers)

1. Set every app to `"serve"` in `app-mode-config.json`.
2. Start all dev servers (shell :5000, angular :5001, react :5002, vue :5003):
   ```bash
   npm run apps
   ```
3. Start Traefik and the Gateway:
   ```bash
   docker compose up --build
   ```
4. Open **http://localhost:8082/shell**. Always go through `:8082`; the apps only share an origin behind the gateway.

### Static mode (built apps)

```bash
npx nx run-many -t build -p shell angular-app react-app vue-app
```

Set apps to `"static"` in `app-mode-config.json`, then run `docker compose up`. The compose file mounts `./dist/apps` and the config into the gateway container. To switch modes, edit the config and restart the gateway container; no image rebuild needed.

You can mix modes, e.g. run only the app you're working on in `serve` and everything else from `static`. Teams develop this way in real micro frontend setups.

---

## Gateway and Traefik configuration

The **Gateway** (`apps/gateway/src/main.ts`) reads `app-mode-config.json` at startup (path overridable with `APP_MODE_CONFIG`). For each app:

- Port defaults to `9000` (override with `PORT`).
- **serve** → proxies `/<app>/**` to `http://host.docker.internal:500X` (WebSockets included, so HMR works).
- **static** → serves `dist/apps/<app>` with an SPA fallback to `index.html`.

**Traefik** forwards everything on `:8082` to the gateway (dashboard on `:8090`). In a real deployment, this layer is your CDN or ingress (CloudFront behaviors, an Nginx/Kubernetes ingress…), and each app's path points to its own independently deployed bucket or service.

---

## Known limitations and roadmap

Done in this repo:

- [x] Route sync between shell and iframes, both directions, including deep links and Back/Forward
- [x] Shell → remote shared context (theme), remote → shell → remotes event bus
- [x] Iframe no longer re-created on every change detection; deep-link routes (`/shell/vue-app/about`)
- [x] Gateway reads its config at runtime; static builds are mounted into the container

Still open:

- [ ] **Auth:** pass tokens via the `context` message or rely on same-origin cookies, plus a refresh strategy
- [ ] **Iframe sizing:** remotes fill the main area; content-height auto-resize (a `resize` message) isn't implemented
- [ ] **Resilience:** show a fallback when a remote's server is down or `ready` never arrives (timeout)
- [ ] **Shared design system:** remotes look different today. Share tokens/components, e.g. via a Bit or npm package
- [ ] **SEO/SSR:** not possible with iframes; use server/edge composition if you need it
- [ ] **Contract versioning:** the envelope has a `version` field, but there's no negotiation yet
- [ ] **E2E tests** across the shell + remotes (Playwright can drive iframes)
