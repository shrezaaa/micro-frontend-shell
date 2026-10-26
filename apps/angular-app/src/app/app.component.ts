import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { MfeBridgeService } from './mfe-bridge.service';

@Component({
  imports: [RouterModule],
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss',
})
export class AppComponent {
  readonly bridge = inject(MfeBridgeService);
  title = 'angular-app';
}
