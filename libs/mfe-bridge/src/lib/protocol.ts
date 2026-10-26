export const PROTOCOL = 'mfe-bridge' as const;
export const PROTOCOL_VERSION = 1 as const;

export type Theme = 'light' | 'dark';

export interface ShellContext {
  theme: Theme;
  locale: string;
  user: { name: string } | null;
}

export interface RemoteMessages {
  ready: { path: string };
  'route-changed': { path: string };
  event: { name: string; data?: unknown };
}

export interface ShellMessages {
  navigate: { path: string };
  context: ShellContext;
  event: { name: string; data?: unknown; from: string };
}

export type Envelope<M, K extends keyof M = keyof M> = {
  protocol: typeof PROTOCOL;
  version: typeof PROTOCOL_VERSION;
  app: string;
  type: K;
  payload: M[K];
};

export type RemoteEnvelope = {
  [K in keyof RemoteMessages]: Envelope<RemoteMessages, K>;
}[keyof RemoteMessages];

export type ShellEnvelope = {
  [K in keyof ShellMessages]: Envelope<ShellMessages, K>;
}[keyof ShellMessages];

export function envelope<M, K extends keyof M>(
  app: string,
  type: K,
  payload: M[K]
): Envelope<M, K> {
  return { protocol: PROTOCOL, version: PROTOCOL_VERSION, app, type, payload };
}

export function isEnvelope(data: unknown): data is Envelope<unknown, never> {
  if (typeof data !== 'object' || data === null) return false;
  const d = data as Record<string, unknown>;
  return (
    d['protocol'] === PROTOCOL &&
    d['version'] === PROTOCOL_VERSION &&
    typeof d['app'] === 'string' &&
    typeof d['type'] === 'string' &&
    'payload' in d
  );
}

export function normalizePath(path: string): string {
  const match = /^([^?#]*)(.*)$/.exec(path.trim()) ?? ['', '', ''];
  let pathname = match[1] || '/';
  if (!pathname.startsWith('/')) pathname = '/' + pathname;
  if (pathname.length > 1) pathname = pathname.replace(/\/+$/, '');
  return pathname + match[2];
}
