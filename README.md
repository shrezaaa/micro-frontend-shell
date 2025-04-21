# Micro Frontend Shell with Traefik and Docker

This repository contains a micro frontend shell application that integrates Angular, React, and Vue applications using `iframe`s. The routing is managed using Traefik, and the apps are served locally on different ports.

## Table of Contents
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Setup](#setup)
- [Folder Structure](#folder-structure)
- [Running the Project](#running-the-project)
- [Traefik Configuration](#traefik-configuration)
- [Shell UI](#shell-ui)
- [Known Limitations](#known-limitations)
- [Future Improvements](#future-improvements)

---

## Architecture
```
┌─────────────┐       ┌────────────┐
│  Shell App  │──────▶ Angular App│
│ (iframe UI) │──────▶ React App  │
│             │──────▶ Vue App    │
└─────────────┘       └────────────┘
         │
         ▼
   Traefik Proxy (on port 8082)
```

Each app runs on its own port:
- Shell: `5000`
- Angular: `5001`
- React: `5002`
- Vue: `5003`

Traefik is configured to route `/shell`, `/angular-app`, `/react-app`, and `/vue-app` to their respective services.

## Tech Stack
- Angular (Shell + App)
- React (Vite + Nx)
- Vue (Vite + Nx)
- Traefik (v1.7.34-alpine)
- Docker Compose

## Setup
### Prerequisites
- Node.js (LTS recommended)
- Docker & Docker Compose
- Nx CLI (optional)

### Install Dependencies
```bash
npm install
```

### Start Each App Individually
From your Nx workspace:
```bash
nx serve shell
nx serve angular-app
nx serve react-app
nx serve vue-app
```

### Start Traefik
```bash
docker-compose up
```
Traefik dashboard: [http://localhost:8080](http://localhost:8080)  
Shell app: [http://localhost:8082/shell](http://localhost:8082/shell)

## Folder Structure
```
/apps
  /shell
  /angular-app
  /react-app
  /vue-app
/docker-compose.yml
/traefik.yml
```

## Running the Project
1. Run all apps individually using Nx.
2. Start Docker Compose to bring up Traefik:
   ```bash
   docker-compose up
   ```
3. Visit `http://localhost:8082/shell` to use the shell and navigate to different apps.

## Traefik Configuration
### docker-compose.yml
```yaml
services:
  traefik:
    image: traefik:v1.7.34-alpine
    ports:
      - "8082:80"
      - "8090:8080"
    volumes:
      - ./traefik.yml:/traefik/traefik.yml
    extra_hosts:
      - "host.docker.internal:host-gateway"
```

### traefik.yml
```yaml
http:
  routers:
    shell:
      rule: "PathPrefix(`/shell`)"
      service: shell
    angular-app:
      rule: "PathPrefix(`/angular-app`)"
      service: angular-app
    react-app:
      rule: "PathPrefix(`/react-app`)"
      service: react-app   
    vue-app:
      rule: "PathPrefix(`/vue-app`)"
      service: vue-app

  services:
    shell:
      loadBalancer:
        servers:
          - url: "http://host.docker.internal:5000"
    angular-app:
      loadBalancer:
        servers:
          - url: "http://host.docker.internal:5001"
    react-app:
      loadBalancer:
        servers:
          - url: "http://host.docker.internal:5002"
    vue-app:
      loadBalancer:
        servers:
          - url: "http://host.docker.internal:5003"
```

## Shell UI
Each page only loads one iframe

## Known Limitations
- Route synchronization between shell and micro apps is not implemented.
- SEO and SSR are not fully supported in iframe-based setup.

## Future Improvements
- 🔄 Implement route sync using `postMessage` API between iframe and shell.
- 🛡️ Auth token passing securely to child apps.
- 📱 Responsive design.
- 🧪 Add integration tests.

---

Feel free to fork and build upon this template!

