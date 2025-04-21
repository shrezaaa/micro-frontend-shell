import { Route } from '@angular/router';
import { AppLoaderComponent } from './app-loader/app-loader.component';

export const appRoutes: Route[] = [
  {
    path: 'angular-app',
    component: AppLoaderComponent,
    data: {
      appPath: /angular-app/,
    },
  },
  {
    path: 'react-app',
    component: AppLoaderComponent,
    data: {
      appPath: /react-app/,
    },
  },
];
