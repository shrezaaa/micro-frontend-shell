import { Component, input } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-order-detail',
  imports: [RouterLink],
  template: `
    <h2>Angular · Order #{{ id() }}</h2>
    <p>Deep link me: refresh the page and you land right back here.</p>
    <a routerLink="/orders">← back to orders</a>
  `,
})
export class OrderDetailComponent {
  id = input.required<string>();
}
