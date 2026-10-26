import { createRemoteBridge } from './remote-bridge';
import { createShellBridge } from './shell-bridge';
import { envelope, normalizePath, RemoteMessages, ShellContext } from './protocol';

const flush = () => new Promise((r) => setTimeout(r, 0));
const ctx: ShellContext = { theme: 'dark', locale: 'en', user: null };

const ORIGIN = 'http://localhost:8082';

type FakeWindow = Window & {
  deliver(data: unknown, source: unknown, origin?: string): void;
};

function fakeWindow(): FakeWindow {
  const listeners = new Set<(e: MessageEvent) => void>();
  const win = {
    location: { origin: ORIGIN },
    addEventListener: (_: string, fn: (e: MessageEvent) => void) => listeners.add(fn),
    removeEventListener: (_: string, fn: (e: MessageEvent) => void) => listeners.delete(fn),
    deliver: (data: unknown, source: unknown, origin = ORIGIN) =>
      setTimeout(() => listeners.forEach((fn) => fn({ data, source, origin } as MessageEvent))),
  };
  return win as unknown as FakeWindow;
}

function setup() {
  const shellWin = fakeWindow();
  const remoteWin = fakeWindow();
  Object.assign(shellWin, {
    parent: shellWin,
    postMessage: (data: unknown) => shellWin.deliver(data, remoteWin),
  });
  Object.assign(remoteWin, {
    parent: shellWin,
    postMessage: (data: unknown) => remoteWin.deliver(data, shellWin),
  });
  const frame = { contentWindow: remoteWin } as unknown as HTMLIFrameElement;

  const shellSpy = { route: jest.fn(), event: jest.fn(), ready: jest.fn() };
  const remoteSpy = { navigate: jest.fn(), context: jest.fn(), event: jest.fn() };

  const shell = createShellBridge({
    app: 'vue-app',
    frame,
    win: shellWin,
    initialContext: ctx,
    onRouteChanged: shellSpy.route,
    onEvent: shellSpy.event,
    onReady: shellSpy.ready,
  });
  const remote = createRemoteBridge({
    app: 'vue-app',
    win: remoteWin,
    onNavigate: (p) => {
      remoteSpy.navigate(p);
      remote.routeChanged(p);
    },
    onContext: remoteSpy.context,
    onEvent: remoteSpy.event,
  });

  return { shellWin, shell, remote, shellSpy, remoteSpy };
}

describe('normalizePath', () => {
  it.each([
    ['', '/'],
    ['about', '/about'],
    ['/about/', '/about'],
    ['/a/b//?x=1#h', '/a/b?x=1#h'],
  ])('%s → %s', (input, expected) => {
    expect(normalizePath(input)).toBe(expected);
  });
});

describe('shell ↔ remote', () => {
  it('handshakes, sends context and mirrors the initial route', async () => {
    const { remote, shellSpy, remoteSpy } = setup();
    remote.routeChanged('/about');
    await flush();
    await flush();
    expect(shellSpy.ready).toHaveBeenCalledWith('/about');
    expect(shellSpy.route).toHaveBeenCalledWith('/about');
    expect(remoteSpy.context).toHaveBeenCalledWith(ctx);
  });

  it('reports internal navigation once and ignores duplicates', async () => {
    const { remote, shellSpy } = setup();
    remote.routeChanged('/');
    remote.routeChanged('/about');
    remote.routeChanged('/about/');
    await flush();
    expect(shellSpy.route.mock.calls).toEqual([['/'], ['/about']]);
  });

  it('does not loop when the shell echoes the remote path back', async () => {
    const { shell, remote, remoteSpy } = setup();
    remote.routeChanged('/');
    remote.routeChanged('/about');
    await flush();
    shell.navigate('/about');
    await flush();
    expect(remoteSpy.navigate).not.toHaveBeenCalled();
  });

  it('navigates the remote when the shell URL changes', async () => {
    const { shell, remote, shellSpy, remoteSpy } = setup();
    remote.routeChanged('/');
    await flush();
    shell.navigate('/about');
    await flush();
    await flush();
    expect(remoteSpy.navigate).toHaveBeenCalledWith('/about');
    expect(shellSpy.route).toHaveBeenCalledTimes(1);
  });

  it('applies a navigation queued before the remote was ready', async () => {
    const { shell, remote, shellSpy, remoteSpy } = setup();
    shell.navigate('/about');
    remote.routeChanged('/');
    await flush();
    await flush();
    expect(remoteSpy.navigate).toHaveBeenCalledWith('/about');
    expect(shellSpy.route).not.toHaveBeenCalledWith('/');
  });

  it('forwards events both ways', async () => {
    const { shell, remote, shellSpy, remoteSpy } = setup();
    remote.routeChanged('/');
    remote.emit('cart:item-added', { sku: 'A' });
    await flush();
    expect(shellSpy.event).toHaveBeenCalledWith('cart:item-added', { sku: 'A' });
    shell.relayEvent('user:logout', null, 'react-app');
    await flush();
    expect(remoteSpy.event).toHaveBeenCalledWith('user:logout', null, 'react-app');
  });

  it('ignores messages from other windows, origins or apps', async () => {
    const { shellWin, shellSpy } = setup();
    const msg = envelope<RemoteMessages, 'route-changed'>('vue-app', 'route-changed', { path: '/x' });
    shellWin.deliver(msg, fakeWindow());
    shellWin.deliver(msg, shellWin, 'https://evil.test');
    shellWin.deliver({ ...msg, app: 'react-app' }, shellWin);
    shellWin.deliver({ type: 'ready' }, shellWin);
    await flush();
    await flush();
    expect(shellSpy.route).not.toHaveBeenCalled();
  });
});

describe('standalone remote', () => {
  it('is a no-op without a parent frame', () => {
    const post = jest.spyOn(window, 'postMessage');
    const remote = createRemoteBridge({ app: 'vue-app' });
    remote.routeChanged('/');
    remote.emit('x');
    expect(remote.embedded).toBe(false);
    expect(post).not.toHaveBeenCalled();
  });
});
