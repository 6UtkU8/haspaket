import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';

if (typeof document !== 'undefined' && typeof localStorage !== 'undefined') {
  const t = localStorage.getItem('haspaket_theme_v1');
  const mode = t === 'light' ? 'light' : 'dark';
  const html = document.documentElement;
  const body = document.body;
  html.setAttribute('data-theme', mode);
  html.classList.remove('theme-dark', 'theme-light');
  body?.classList.remove('theme-dark', 'theme-light');
  html.classList.add(mode === 'light' ? 'theme-light' : 'theme-dark');
  body?.classList.add(mode === 'light' ? 'theme-light' : 'theme-dark');
}

bootstrapApplication(App, appConfig).catch((err) => console.error(err));
