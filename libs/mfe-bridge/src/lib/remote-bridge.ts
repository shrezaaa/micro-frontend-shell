import {
  envelope,
  isEnvelope,
  normalizePath,
  RemoteMessages,
  ShellContext,
  ShellEnvelope,
} from './protocol';

export interface RemoteBridgeOptions {
  app: string;
  onNavigate?: (path: string) => void;
  onContext?: (context: ShellContext) => void;
  onEvent?: (name: string, data: unknown, from: string) => void;
  win?: Window;
}

export interface RemoteBridge {
  readonly embedded: boolean;
  readonly context: ShellContext | null;
  routeChanged(path: string): void;
  emit(name: string, data?: unknown): void;
  destroy(): void;
}

export function createRemoteBridge(options: RemoteBridgeOptions): RemoteBridge {
  const win = options.win ?? window;
  const parent = win.parent;
  const embedded = parent !== win;
  const origin = win.location.origin;

  let lastPath: string | null = null;
  let context: ShellContext | null = null;
  let readySent = false;

  const post = <K extends keyof RemoteMessages>(
    type: K,
    payload: RemoteMessages[K]
  ) => {
    if (!embedded) return;
    parent.postMessage(envelope<RemoteMessages, K>(options.app, type, payload), origin);
  };

  const onMessage = (event: MessageEvent) => {
    if (event.origin !== origin || event.source !== parent) return;
    if (!isEnvelope(event.data)) return;
    const msg = event.data as ShellEnvelope;
    if (msg.app !== options.app) return;

    switch (msg.type) {
      case 'navigate': {
        const path = normalizePath(msg.payload.path);
        if (path === lastPath) return;
        lastPath = path;
        options.onNavigate?.(path);
        break;
      }
      case 'context':
        context = msg.payload;
        options.onContext?.(msg.payload);
        break;
      case 'event':
        options.onEvent?.(msg.payload.name, msg.payload.data, msg.payload.from);
        break;
    }
  };

  if (embedded) win.addEventListener('message', onMessage);

  return {
    embedded,
    get context() {
      return context;
    },
    routeChanged(rawPath: string) {
      const path = normalizePath(rawPath);
      if (!readySent) {
        readySent = true;
        lastPath = path;
        post('ready', { path });
        return;
      }
      if (path === lastPath) return;
      lastPath = path;
      post('route-changed', { path });
    },
    emit(name: string, data?: unknown) {
      post('event', { name, data });
    },
    destroy() {
      win.removeEventListener('message', onMessage);
    },
  };
}
