export class Router {
  constructor() {
    this.routes = {};
    this.mainContainer = document.getElementById('app-main');
  }

  addRoute(path, component) {
    this.routes[path] = component;
  }

  init() {
    window.addEventListener('hashchange', () => this.handleRoute());
    window.addEventListener('load', () => this.handleRoute());
  }

  handleRoute() {
    const hash = window.location.hash.slice(1) || '/';
    const target = this.routes[hash] || (() => '<div style="padding: 20px; text-align: center;">صفحه اصلی زیرساخت آماده است</div>');
    
    if (this.mainContainer) {
      this.mainContainer.innerHTML = typeof target === 'function' ? target() : target;
    }
  }
}
