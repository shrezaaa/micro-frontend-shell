import { DatePipe, JsonPipe } from '@angular/common';
import { Component, effect, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { microApps } from './app.routes';
import { MfeHostService } from './mfe/mfe-host.service';

@Component({
  imports: [RouterModule, DatePipe, JsonPipe],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly host = inject(MfeHostService);
  readonly apps = microApps;
  title = 'shell';

  constructor() {
    effect(() => {
      document.documentElement.dataset['theme'] = this.host.context().theme;
    });
  }
}
