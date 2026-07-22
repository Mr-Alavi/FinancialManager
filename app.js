import { RenderHeader, RenderBottomNav, ShowToast } from './components.js';
import { DashboardView, TransactionsView, BudgetView, GoalsView, SearchView, SettingsView } from './features.js';

class Router {
  constructor() {
    this.routes = {
      '/': DashboardView,
      '/dashboard': DashboardView,
      '/transactions': TransactionsView,
      '/budget': BudgetView,
      '/goals': GoalsView,
      '/search': SearchView,
      '/settings': SettingsView
    };
    this.main = document.getElementById('app-main');
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
    this.handleRoute();
  }

  async handleRoute() {
    try {
      let hash = window.location.hash.slice(1) || '/dashboard';
      if (hash === '/') hash = '/dashboard';
      const viewFn = this.routes[hash] || DashboardView;
      
      if (this.main) {
        this.main.innerHTML = '<div style="text-align:center; padding:40px; color:var(--text-secondary);">در حال بارگذاری...</div>';
        const content = await viewFn();
        this.main.innerHTML = '';
        this.main.appendChild(content);
      }
    } catch (err) {
      console.error('Route Error:', err);
      if (this.main) {
        this.main.innerHTML = `<div style="padding:20px; color:var(--color-danger); text-align:center;">خطا در بارگذاری صفحه. لطفاً دوباره تلاش کنید.</div>`;
      }
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  try {
    const savedTheme = localStorage.getItem('tror_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    
    RenderHeader();
    RenderBottomNav();
    
    const router = new Router();
    router.init();

    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('sw.js').catch(err => console.log('SW registration failed:', err));
    }
  } catch (err) {
    console.error('App Init Error:', err);
  }
});
