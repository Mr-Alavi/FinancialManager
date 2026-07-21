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
        // 3. Default Dashboard / Core Route (Fixed Fallback to prevent blank/black screen)
        else {
            if (window.DashboardModule && typeof window.DashboardModule.mount === 'function') {
                window.DashboardModule.mount(containerElement);
            } else {
                // Safe Fallback: If no DashboardModule exists, render core dashboard UI or restore container
                if (containerElement && (!containerElement.innerHTML.trim() || containerElement === document.body)) {
                    // Check if there is an existing home template or show default dashboard shell
                    const existingMain = document.getElementById('main-app-content') || document.getElementById('dashboard-view');
                    if (existingMain) {
                        containerElement.innerHTML = existingMain.innerHTML;
                    } else {
                        // Render standard TROR PFOS luxury dark glassmorphism dashboard placeholder
                        containerElement.innerHTML = `
                            <div style="padding: 24px; color: #f8fafc; font-family: inherit;">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px;">
                                    <h2 style="font-size: 20px; font-weight: bold; background: linear-gradient(135deg, #38bdf8, #818cf8); -webkit-background-clip: text; -webkit-text-fill-color: transparent;">سیستم مالی TROR PFOS</h2>
                                    <button data-route="accounts" style="background: rgba(56, 189, 248, 0.1); border: 1px solid rgba(56, 189, 248, 0.3); color: #38bdf8; padding: 10px 18px; border-radius: 12px; cursor: pointer; font-weight: 500;">مدیریت حساب‌ها</button>
                                </div>
                                <div style="background: rgba(30, 41, 59, 0.5); border: 1px solid rgba(255, 255, 255, 0.08); padding: 24px; border-radius: 16px; backdrop-filter: blur(12px); text-align: center;">
                                    <div style="font-size: 40px; margin-bottom: 12px;">📊</div>
                                    <h3 style="font-size: 16px; color: #e2e8f0; margin-bottom: 8px;">خوش آمدید، آقای علوی</h3>
                                    <p style="color: #94a3b8; font-size: 14px;">سیستم آماده و عملیاتی است. از منوی بالا یا دکمه‌های دسترسی سریع برای ورود به بخش‌ها استفاده کنید.</p>
                                </div>
                            </div>
                        `;
                    }
                }
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
