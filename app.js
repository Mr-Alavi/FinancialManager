/**
 * TROR PFOS - Core Application Orchestrator & Router
 * Manages view routing, module lazy loading, and core lifecycle events.
 */
class TRORApp {
    static init() {
        document.addEventListener('DOMContentLoaded', () => {
            this.setupRouter();
            this.initNavigation();
        });
    }

    static setupRouter() {
        window.addEventListener('hashchange', () => {
            this.handleRoute();
        });
        
        // Initial route load on startup
        this.handleRoute();
    }

    static initNavigation() {
        document.body.addEventListener('click', (e) => {
            const target = e.target.closest('[data-route]');
            if (target) {
                e.preventDefault();
                const route = target.getAttribute('data-route');
                this.navigate(route);
            }
        });
    }

    static handleRoute() {
        const hash = window.location.hash.replace('#', '') || 'dashboard';
        const containerElement = document.getElementById('app-container') || document.getElementById('main-content') || document.getElementById('tror-main-view') || document.body;

        this.routeTo(hash, containerElement);
    }

    static routeTo(route, containerElement) {
        // 1. Accounts & Wallets Route Hook (Isolated Modular Integration)
        if (route === 'accounts') {
            if (window.AccountsModule && typeof window.AccountsModule.mount === 'function') {
                window.AccountsModule.mount(containerElement);
            } else {
                this.loadScript('./features/accounts/accounts.js', () => {
                    if (window.AccountsModule) {
                        window.AccountsModule.mount(containerElement);
                    }
                });
            }
        }
        // 2. Shahin Vehicle Module Route
        else if (route === 'shahin') {
            if (window.ShahinModule && typeof window.ShahinModule.mount === 'function') {
                window.ShahinModule.mount(containerElement);
            }
        }
        // 3. Default Dashboard / Core Route
        else {
            if (window.DashboardModule && typeof window.DashboardModule.mount === 'function') {
                window.DashboardModule.mount(containerElement);
            }
        }

        // Update active UI classes on navigation items
        document.querySelectorAll('[data-route]').forEach(el => {
            if (el.getAttribute('data-route') === route) {
                el.classList.add('active', 'tror-nav-active');
            } else {
                el.classList.remove('active', 'tror-nav-active');
            }
        });
    }

    static loadScript(src, callback) {
        if (document.querySelector(`script[src="${src}"]`)) {
            if (callback) callback();
            return;
        }
        const script = document.createElement('script');
        script.src = src;
        script.onload = callback;
        document.head.appendChild(script);
    }

    static navigate(route) {
        window.location.hash = route;
    }
}

// Initialize application core orchestrator
TRORApp.init();

// Expose globally for external module triggers
window.TRORApp = TRORApp;
