import { ref } from 'vue';
import type { Router } from 'vue-router';
import { createRemoteBridge, ShellContext } from '@mfe/bridge';

export const shellContext = ref<ShellContext | null>(null);

export function connectBridge(router: Router) {
  const bridge = createRemoteBridge({
    app: 'vue-app',
    onNavigate: (path) => router.replace(path),
    onContext: (ctx) => {
      document.documentElement.dataset['theme'] = ctx.theme;
      shellContext.value = ctx;
    },
  });
  router.afterEach((to) => bridge.routeChanged(to.fullPath));
  return bridge;
}
