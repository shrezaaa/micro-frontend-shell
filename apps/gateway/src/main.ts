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

// const apps = {
//   "shell":       { staticDir: path.join(__dirname, "../shell/browser"),       devUrl: "http://localhost:5000" },
//   "angular-app": { staticDir: path.join(__dirname, "../angular-app/browser"), devUrl: "http://localhost:5001" },
//   "react-app":   { staticDir: path.join(__dirname, "../react-app"),   devUrl: "http://localhost:5002" },
//   "vue-app":     { staticDir: path.join(__dirname, "../vue-app"),     devUrl: "http://localhost:5003" },
// };

const apps = {
  "shell":       { staticDir: path.join(__dirname, "../shell/browser"),       devUrl: "http://host.docker.internal:5000" },
  "angular-app": { staticDir: path.join(__dirname, "../angular-app/browser"), devUrl: "http://host.docker.internal:5001" },
  "react-app":   { staticDir: path.join(__dirname, "../react-app"),   devUrl: "http://host.docker.internal:5002" },
  "vue-app":     { staticDir: path.join(__dirname, "../vue-app"),     devUrl: "http://host.docker.internal:5003" },
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
        // pathRewrite: (p) => p.replace(new RegExp(`^/${name}`), ""),
      })
    );
  }
});

app.listen(PORT, () => {
  console.log(`Gateway listening on http://localhost:${PORT}`);
});