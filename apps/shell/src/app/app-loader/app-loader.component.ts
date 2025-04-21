import { Component, inject } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-app-loader',
  imports: [],
  templateUrl: './app-loader.component.html',
  styleUrl: './app-loader.component.scss',
})
export class AppLoaderComponent {
  route = inject(ActivatedRoute);
  sanitizer = inject(DomSanitizer);
  get path(): SafeResourceUrl {
    const path = this.route.snapshot.data['appPath'];
    return this.sanitizer.bypassSecurityTrustResourceUrl(path ?? '');
  }
}
