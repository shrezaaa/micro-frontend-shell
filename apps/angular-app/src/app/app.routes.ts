import { Route } from '@angular/router';
import { HomeComponent } from './pages/home.component';
import { OrderDetailComponent } from './pages/order-detail.component';
import { OrdersComponent } from './pages/orders.component';

export const appRoutes: Route[] = [
  { path: '', component: HomeComponent },
  { path: 'orders', component: OrdersComponent },
  { path: 'orders/:id', component: OrderDetailComponent },
  { path: '**', redirectTo: '' },
];
