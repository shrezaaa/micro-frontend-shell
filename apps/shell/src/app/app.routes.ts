import { Route, UrlMatcher } from '@angular/router';
import { AppLoaderComponent } from './app-loader/app-loader.component';

export const microApps = [
  { name: 'angular-app', label: 'Angular App' },
  { name: 'react-app', label: 'React App' },
  { name: 'vue-app', label: 'Vue App' },
];

const matchApp =
  (app: string): UrlMatcher =>
  (segments) =>
    segments[0]?.path === app ? { consumed: segments } : null;

export const appRoutes: Route[] = [
  { path: '', pathMatch: 'full', redirectTo: microApps[0].name },
  ...microApps.map(
    ({ name }): Route => ({
      matcher: matchApp(name),
      component: AppLoaderComponent,
      data: { app: name },
    })
  ),
];
