# @mfe/bridge

Framework-agnostic `postMessage` contract between the shell and the micro apps it frames.

- `createShellBridge({ app, frame, ... })`: one per iframe, used by the shell.
- `createRemoteBridge({ app, ... })`: used inside each micro app; a no-op when the app isn't framed.

See the root README section "Cross-app communication" for the message table and the route-sync flow.

```bash
npx nx test mfe-bridge
```
