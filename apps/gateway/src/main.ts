/**
 * This is not a production server yet!
 * This is only a minimal backend to get started.
 */

import express from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import * as path from 'path';
import config from './mode-config.json';

const app = express();
app.use('/assets', express.static(path.join(__dirname, 'assets')));
const PORT = 9000;

// Map each app to its static path or dev URL:
const apps = {
  "shell":       { staticDir: path.join(__dirname, "../dist/shell"),       devUrl: "http://host.docker.internal:5000" },
  "angular-app": { staticDir: path.join(__dirname, "../dist/angular-app"), devUrl: "http://host.docker.internal:5001" },
  "react-app":   { staticDir: path.join(__dirname, "../dist/react-app"),   devUrl: "http://host.docker.internal:5002" },
  "vue-app":     { staticDir: path.join(__dirname, "../dist/vue-app"),     devUrl: "http://host.docker.internal:5003" },
};

Object.keys(apps).forEach((name) => {
  const route = `/${name}`;
  const mode  = config[name];

  if (mode === "static") {
    // serve built files
    app.use(route, express.static(apps[name].staticDir));
    // SPA fallback
    app.use(route, (req, res, next) => {
      res.sendFile(path.join(apps[name].staticDir, "index.html"));
    });
  } else {
    // proxy to dev server
    app.use(
      route,
      createProxyMiddleware({
        target: apps[name].devUrl,
        changeOrigin: true,
        pathRewrite: (p) => p.replace(new RegExp(`^/${name}`), ""),
      })
    );
  }
});

app.listen(PORT, () => {
  console.log(`Gateway listening on http://localhost:${PORT}`);
});