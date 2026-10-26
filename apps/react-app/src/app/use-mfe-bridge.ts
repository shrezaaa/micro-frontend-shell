import { useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { createRemoteBridge, RemoteBridge, ShellContext } from '@mfe/bridge';

export function useMfeBridge(app: string) {
  const navigate = useNavigate();
  const location = useLocation();
  const bridge = useRef<RemoteBridge | null>(null);
  const [context, setContext] = useState<ShellContext | null>(null);

  useEffect(() => {
    const b = createRemoteBridge({
      app,
      onNavigate: (path) => navigate(path, { replace: true }),
      onContext: (ctx) => {
        document.documentElement.dataset['theme'] = ctx.theme;
        setContext(ctx);
      },
    });
    bridge.current = b;
    return () => b.destroy();
  }, [app, navigate]);

  useEffect(() => {
    bridge.current?.routeChanged(location.pathname + location.search);
  }, [location]);

  return {
    context,
    embedded: window.parent !== window,
    emit: (name: string, data?: unknown) => bridge.current?.emit(name, data),
  };
}
