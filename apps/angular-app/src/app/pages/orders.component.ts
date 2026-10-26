import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-orders',
  imports: [RouterLink],
  template: `
    <h2>Angular · Orders</h2>
    <ul>
      @for (id of ids; track id) {
      <li><a [routerLink]="['/orders', id]">Order #{{ id }}</a></li>
      }
    </ul>
  `,
})
export class OrdersComponent {
  ids = [101, 102, 103];
}
