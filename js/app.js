import { Router } from './router.js';
import { CONFIG } from '../shared/constants/config.js';

class App {
  constructor() {
    this.init();
  }

  init() {
    console.log(`${CONFIG.name} v${CONFIG.version} initialized.`);
    this.initTheme();
    this.initRouter();
    this.registerServiceWorker();
  }

  initTheme() {
    // Default to dark theme as per design system
    const savedTheme = localStorage.getItem('tror_theme') || 'dark';
    const themeStyleLink = document.getElementById('theme-style');
    if (themeStyleLink) {
      themeStyleLink.href = `./themes/${savedTheme}.css`;
    }
  }

  initRouter() {
    const router = new Router();
    router.init();
  }

  registerServiceWorker() {
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker.register('./service-worker.js')
          .then(reg => console.log('ServiceWorker registered successfully:', reg.scope))
          .catch(err => console.error('ServiceWorker registration failed:', err));
      });
    }
  }
}

new App();
