import { Component, inject } from '@angular/core';
import { MfeBridgeService } from '../mfe-bridge.service';

@Component({
  selector: 'app-home',
  template: `
    <h2>Angular · Home</h2>
    <p>Hello {{ bridge.user() ?? 'stranger' }}.</p>
    <button (click)="bridge.emit('angular:greeted', { at: now() })">Emit event to shell</button>
  `,
})
export class HomeComponent {
  readonly bridge = inject(MfeBridgeService);
  now = () => new Date().toISOString();
}
