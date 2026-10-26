import {
  AfterViewInit,
  Component,
  DestroyRef,
  ElementRef,
  effect,
  inject,
  signal,
  viewChild,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, NavigationEnd, Router } from '@angular/router';
import { createShellBridge, ShellBridge } from '@mfe/bridge';
import { filter } from 'rxjs';
import { MfeHostService } from '../mfe/mfe-host.service';

@Component({
  selector: 'app-app-loader',
  templateUrl: './app-loader.component.html',
  styleUrl: './app-loader.component.scss',
})
export class AppLoaderComponent implements AfterViewInit {
  private readonly router = inject(Router);
  private readonly host = inject(MfeHostService);
  private readonly destroyRef = inject(DestroyRef);

  readonly app: string = inject(ActivatedRoute).snapshot.data['app'];
  readonly loading = signal(true);

  private readonly frame = viewChild.required<ElementRef<HTMLIFrameElement>>('frame');
  private bridge?: ShellBridge;

  constructor() {
    effect(() => {
      const context = this.host.context();
      this.bridge?.setContext(context);
    });
  }

  ngAfterViewInit() {
    const frame = this.frame().nativeElement;
    const bridge = createShellBridge({
      app: this.app,
      frame,
      initialContext: this.host.context(),
      onReady: () => this.loading.set(false),
      onRouteChanged: (path) => this.mirrorRemotePath(path),
      onEvent: (name, data) => this.host.publish(this.app, name, data),
    });
    this.bridge = bridge;
    const unregister = this.host.register(bridge);
    this.destroyRef.onDestroy(() => {
      unregister();
      bridge.destroy();
    });

    this.router.events
      .pipe(
        filter((e) => e instanceof NavigationEnd),
        takeUntilDestroyed(this.destroyRef)
      )
      .subscribe(() => bridge.navigate(this.remotePath()));

    frame.src = `/${this.app}${this.remotePath()}`;
  }

  private remotePath() {
    return this.router.url.slice(this.app.length + 1) || '/';
  }

  private mirrorRemotePath(path: string) {
    if (path === this.remotePath()) return;
    this.router.navigateByUrl(`/${this.app}${path === '/' ? '' : path}`, {
      replaceUrl: true,
    });
  }
}
