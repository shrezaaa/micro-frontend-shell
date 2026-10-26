import { Injectable, inject, signal } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { createRemoteBridge } from '@mfe/bridge';
import { filter } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class MfeBridgeService {
  private readonly router = inject(Router);
  readonly user = signal<string | null>(null);

  private readonly bridge = createRemoteBridge({
    app: 'angular-app',
    onNavigate: (path) => this.router.navigateByUrl(path, { replaceUrl: true }),
    onContext: (ctx) => {
      document.documentElement.dataset['theme'] = ctx.theme;
      this.user.set(ctx.user?.name ?? null);
    },
  });

  readonly embedded = this.bridge.embedded;

  connect() {
    this.router.events
      .pipe(filter((e) => e instanceof NavigationEnd))
      .subscribe((e) => this.bridge.routeChanged(e.urlAfterRedirects));
  }

  emit(name: string, data?: unknown) {
    this.bridge.emit(name, data);
  }
}
