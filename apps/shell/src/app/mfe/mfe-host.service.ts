import { Injectable, signal } from '@angular/core';
import { ShellBridge, ShellContext } from '@mfe/bridge';

export interface LoggedEvent {
  from: string;
  name: string;
  data: unknown;
  at: Date;
}

@Injectable({ providedIn: 'root' })
export class MfeHostService {
  readonly context = signal<ShellContext>({
    theme: 'light',
    locale: navigator.language,
    user: { name: 'Demo User' },
  });
  readonly events = signal<LoggedEvent[]>([]);

  private readonly bridges = new Set<ShellBridge>();

  toggleTheme() {
    this.context.update((c) => ({
      ...c,
      theme: c.theme === 'light' ? 'dark' : 'light',
    }));
  }

  register(bridge: ShellBridge) {
    this.bridges.add(bridge);
    return () => this.bridges.delete(bridge);
  }

  publish(from: string, name: string, data: unknown) {
    this.events.update((list) =>
      [{ from, name, data, at: new Date() }, ...list].slice(0, 20)
    );
    for (const bridge of this.bridges) {
      if (bridge.app !== from) bridge.relayEvent(name, data, from);
    }
  }
}
