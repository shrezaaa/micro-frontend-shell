import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { AppLoaderComponent } from './app-loader.component';

describe('AppLoaderComponent', () => {
  let fixture: ComponentFixture<AppLoaderComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppLoaderComponent],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { data: { app: 'vue-app' } } } },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(AppLoaderComponent);
    fixture.detectChanges();
  });

  it('points the iframe at the micro app once', () => {
    const iframe = (fixture.nativeElement as HTMLElement).querySelector('iframe');
    expect(iframe?.getAttribute('title')).toBe('vue-app');
    expect(iframe?.src).toMatch(/\/vue-app\/$/);
  });
});
