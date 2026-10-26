# Image for Kubernetes: the gateway serves all four apps as static builds.
# Build for the cluster (Intel/AMD nodes):
#   docker build --platform linux/amd64 -t ghcr.io/shrezaaa/micro-frontend-shell:0.1.0 .

# ---- Stage 1:
FROM --platform=$BUILDPLATFORM node:22-slim AS build
WORKDIR /workspace

COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --ignore-scripts --fetch-retries=5 --fetch-retry-maxtimeout=120000 --fetch-timeout=600000

ENV NX_DAEMON=false

COPY . .
RUN npx nx run-many -t build -p shell angular-app react-app vue-app gateway

# ---- Stage 2: small runtime image ----
FROM node:22-alpine AS runtime
ENV NODE_ENV=production
WORKDIR /app

COPY --from=build /workspace/dist/apps ./dist/apps

# The gateway build writes its own package.json with only express + http-proxy-middleware.
RUN cd dist/apps/gateway && npm ci --omit=dev && npm cache clean --force

RUN echo '{"shell":"static","angular-app":"static","react-app":"static","vue-app":"static"}' > /app/app-mode-config.json
ENV APP_MODE_CONFIG=/app/app-mode-config.json
ENV PORT=9000

# Do not run as root. "node" (uid 1000) comes with the base image.
USER node
EXPOSE 9000
WORKDIR /app/dist/apps/gateway
CMD ["node", "main.js"]
