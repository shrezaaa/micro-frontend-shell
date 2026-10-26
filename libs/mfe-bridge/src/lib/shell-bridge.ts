import {
  envelope,
  isEnvelope,
  normalizePath,
  RemoteEnvelope,
  ShellContext,
  ShellMessages,
} from './protocol';

export interface ShellBridgeOptions {
  app: string;
  frame: HTMLIFrameElement;
  onRouteChanged?: (path: string) => void;
  onEvent?: (name: string, data: unknown) => void;
  onReady?: (path: string) => void;
  initialContext?: ShellContext;
  win?: Window;
}

export interface ShellBridge {
  readonly app: string;
  readonly ready: boolean;
  navigate(path: string): void;
  setContext(context: ShellContext): void;
  relayEvent(name: string, data: unknown, from: string): void;
  destroy(): void;
}

export function createShellBridge(options: ShellBridgeOptions): ShellBridge {
  const win = options.win ?? window;
  const origin = win.location.origin;
  const { app, frame } = options;

  let ready = false;
  let lastPath: string | null = null;
  let pendingPath: string | null = null;
  let context: ShellContext | undefined = options.initialContext;

  const post = <K extends keyof ShellMessages>(type: K, payload: ShellMessages[K]) => {
    if (!ready) return;
    frame.contentWindow?.postMessage(envelope<ShellMessages, K>(app, type, payload), origin);
  };

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== origin || event.source !== frame.contentWindow) return;
    if (!isEnvelope(event.data)) return;
    const msg = event.data as RemoteEnvelope;
    if (msg.app !== app) return;

    switch (msg.type) {
      case 'ready': {
        ready = true;
        const reported = normalizePath(msg.payload.path);
        lastPath = reported;
        options.onReady?.(reported);
        if (context) post('context', context);
        if (pendingPath !== null && pendingPath !== reported) {
          const target = pendingPath;
          pendingPath = null;
          lastPath = target;
          post('navigate', { path: target });
        } else {
          pendingPath = null;
          options.onRouteChanged?.(reported);
        }
        break;
      }
      case 'route-changed': {
        const path = normalizePath(msg.payload.path);
        if (path === lastPath) return;
        lastPath = path;
        options.onRouteChanged?.(path);
        break;
      }
      case 'event':
        options.onEvent?.(msg.payload.name, msg.payload.data);
        break;
    }
  };

  win.addEventListener('message', onMessage);

  return {
    app,
    get ready() {
      return ready;
    },
    navigate(rawPath: string) {
      const path = normalizePath(rawPath);
      if (!ready) {
        pendingPath = path;
        return;
      }
      if (path === lastPath) return;
      lastPath = path;
      post('navigate', { path });
    },
    setContext(next: ShellContext) {
      context = next;
      post('context', next);
    },
    relayEvent(name: string, data: unknown, from: string) {
      post('event', { name, data, from });
    },
    destroy() {
      win.removeEventListener('message', onMessage);
    },
  };
}
