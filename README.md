# Micro Frontend Shell with Traefik, Gateway, and Docker

This repository contains a micro frontend shell architecture integrating Angular, React, and Vue applications using **iframes**. Routing is centralized through a custom **Gateway** app, which decides whether to serve static builds or proxy to local dev servers. **Traefik v2** is used for routing incoming traffic to the gateway.

---

## Table of Contents

- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Folder Structure](#folder-structure)
- [Running the Project](#running-the-project)
- [Gateway Configuration](#gateway-configuration)
- [Traefik Configuration](#traefik-configuration)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Architecture

```
┌───────────────┐
│   Traefik     │
│  (port 8082)  │
└──────┬────────┘
       │
       ▼
 ┌───────────────┐        ┌────────────────┐
 │   Gateway     │───────▶ shell (dev or static)
 │  (port 9000)  │───────▶ angular-app
 └───────────────┘───────▶ react-app
                         └▶ vue-app
```

Each app can run in one of two modes:

- **Serve mode**: Gateway proxies requests to local development servers (e.g., `localhost:500X`).
- **Static mode**: Gateway serves built static files from `dist/[appName]`.

Modes are controlled via `app-mode-config.json`:

```json
{
  "shell": "serve",
  "angular-app": "serve",
  "react-app": "serve",
  "vue-app": "serve"
}
```

---

## Tech Stack

- **Angular** (Shell + App)
- **React** (Vite + Nx)
- **Vue** (Vite + Nx)
- **Express.js** (Gateway)
- **Traefik v2** (Reverse proxy)
- **Docker & Docker Compose**
- **Nx Monorepo**

---

## Setup

### Prerequisites

- Node.js (LTS)
- Docker & Docker Compose
- Nx CLI (optional)

### Install Dependencies

```bash
npm install
```

### Build Micro Apps (for Static Mode)

```bash
nx build shell
nx build angular-app
nx build react-app
nx build vue-app
```

---

## Folder Structure

```
/apps
  /shell
  /angular-app
  /react-app
  /vue-app
  /gateway
    Dockerfile
    main.ts
/docker compose.yml
/traefik.yml
/app-mode-config.json
```

---

## Running the Project

### Development Mode (Proxy Mode)

1. Ensure `app-mode-config.json` has apps set to `"serve"`.
2. Run apps locally:
   ```bash
   nx serve shell
   nx serve angular-app
   nx serve react-app
   nx serve vue-app
   ```
3. Start Traefik + Gateway:
   ```bash
   docker compose up
   ```
4. Browse to [http://localhost:8082/shell](http://localhost:8082/shell).

### Production Mode (Static Builds)

1. Build all apps (see **Build Micro Apps** above).
2. Set apps to `"static"` in `app-mode-config.json`.
3. Start Traefik + Gateway:
   ```bash
   docker compose up
   ```
4. Browse to [http://localhost:8082/shell](http://localhost:8082/shell).

---

## Gateway Configuration

The **Gateway** (Express.js) reads `app-mode-config.json` and for each route:

- **Serve mode**: Proxies to `http://host.docker.internal:500X`.
- **Static mode**: Serves files from `dist/[appName]`, with SPA fallback.

Example `app-mode-config.json`:

```json
{
  "shell": "static",
  "angular-app": "serve",
  "react-app": "static",
  "vue-app": "serve"
}
```

---

## Traefik Configuration

### docker compose.yml

```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v2.10
    command:
      - '--api.insecure=true'
      - '--providers.docker=false'
      - '--entrypoints.web.address=:80'
      - '--providers.file.directory=/traefik/'
      - '--providers.file.watch=true'
    ports:
      - '8082:80' # User traffic
      - '8090:8080' # Dashboard
    volumes:
      - ./traefik.yml:/traefik/traefik.yml
    extra_hosts:
      - 'host.docker.internal:host-gateway'

  gateway:
    build:
      context: .
      dockerfile: apps/gateway/Dockerfile
    ports:
      - '9000:9000'
    extra_hosts:
      - 'host.docker.internal:host-gateway'
```

### traefik.yml

```yaml
http:
  routers:
    gateway:
      rule: |
        PathPrefix(`/`) ||
        PathPrefix(`/shell`) ||
        PathPrefix(`/angular-app`) ||
        PathPrefix(`/react-app`) ||
        PathPrefix(`/vue-app`)
      service: gateway
      entryPoints:
        - web

  services:
    gateway:
      loadBalancer:
        servers:
          - url: 'http://gateway:9000'
```

---

## Known Limitations

- Route synchronization between shell and micro apps is not implemented.
- SEO and SSR are not fully supported due to iframe-based architecture.

---

## Future Improvements

- Sync routes between shell and iframe apps via `postMessage`.
- Propagate auth tokens securely.
