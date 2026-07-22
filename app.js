import { RenderHeader, RenderBottomNav } from './components.js';
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
  }
  async handleRoute() {
    let hash = window.location.hash.slice(1) || '/dashboard';
    if (hash === '/') hash = '/dashboard';
    const viewFn = this.routes[hash] || DashboardView;
    if (this.main) {
      this.main.innerHTML = '';
      this.main.appendChild(await viewFn());
    }
  }
}

document.addEventListener('DOMContentLoaded', () => {
  const savedTheme = localStorage.getItem('tror_theme') || 'dark';
  document.documentElement.setAttribute('data-theme', savedTheme);
  
  RenderHeader();
  RenderBottomNav();
  
  const router = new Router();
  router.init();

  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('sw.js').catch(err => console.error(err));
  }
});
