import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AppComponent } from './app.component';
import { MfeHostService } from './mfe/mfe-host.service';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AppComponent],
      providers: [provideRouter([])],
    }).compileComponents();
  });

  it('renders a nav link per micro app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    const links = (fixture.nativeElement as HTMLElement).querySelectorAll('.shell-nav a');
    expect(links.length).toBe(3);
  });

  it('applies the theme to the document', () => {
    const fixture = TestBed.createComponent(AppComponent);
    fixture.detectChanges();
    TestBed.inject(MfeHostService).toggleTheme();
    fixture.detectChanges();
    expect(document.documentElement.dataset['theme']).toBe('dark');
  });
});
