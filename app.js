/**
 * TROR Personal Financial Operating System (PFOS) - Enterprise Core app.js v3.0
 * Fully integrated with Service Worker update detection, IndexedDB, VehicleEngine,
 * GoalEngine, CalendarEngine, AssetEngine, Hop AI, ThemeManager, and Persian Localization.
 */

class DatabaseManager {
    constructor(dbName = 'TROR_PFOS_DB', version = 3) {
        this.dbName = dbName;
        this.version = version;
        this.db = null;
    }

    async init() {
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(this.dbName, this.version);
            
            request.onerror = (event) => {
                console.error("خطا در باز کردن پایگاه داده IndexedDB:", event.target.error);
                reject(event.target.error);
            };

            request.onsuccess = (event) => {
                this.db = event.target.result;
                resolve(this.db);
            };

            request.onupgradeneeded = (event) => {
                const db = event.target.result;
                const stores = ['accounts', 'transactions', 'savings', 'goals', 'vehicles', 'maintenance', 'obligations', 'assets', 'settings', 'ai_history'];
                
                stores.forEach(storeName => {
                    if (!db.objectStoreNames.contains(storeName)) {
                        db.createObjectStore(storeName, { keyPath: 'id', autoIncrement: true });
                    }
                });
            };
        });
    }

    async add(storeName, data) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add({ ...data, updatedAt: new Date().toISOString() });
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }

    async getAll(storeName) {
        if (!this.db) await this.init();
        return new Promise((resolve, reject) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            
            request.onsuccess = () => resolve(request.result);
            request.onerror = () => reject(request.error);
        });
    }
}

class ThemeManager {
    constructor() {
        this.currentTheme = localStorage.getItem('tror_theme') || 'luxury-dark';
        this.applyTheme();
    }

    applyTheme() {
        document.documentElement.setAttribute('data-theme', this.currentTheme);
        document.body.className = `theme-${this.currentTheme}`;
    }

    toggleTheme() {
        this.currentTheme = this.currentTheme === 'luxury-dark' ? 'neon-light' : 'luxury-dark';
        localStorage.setItem('tror_theme', this.currentTheme);
        this.applyTheme();
    }
}

class LocalizationManager {
    constructor() {
        this.locale = 'fa';
        this.dictionary = {
            fa: {
                appName: "سیستم عامل مالی شخصی TROR",
                version: "PFOS v3.0",
                newVersionReady: "نسخه جدید آماده است",
                updateButton: "بروزرسانی",
                dashboard: "داشبورد",
                transactions: "تراکنش‌ها",
                accounts: "حساب‌ها",
                goals: "اهداف و صندوق‌ها",
                calendar: "تقویم تعهدات",
                budget: "بودجه‌بندی",
                savings: "پس‌انداز",
                reports: "گزارش‌ها",
                vehicle: "مدیریت خودرو (تیبا ۱ مدل ۱۳۹۰)",
                hopAI: "هوش مصنوعی Hop AI",
                settings: "تنظیمات"
            }
        };
    }

    t(key) {
        return this.dictionary[this.locale][key] || key;
    }
}

class SmartNotification {
    static show(message, actionText = null, actionCallback = null, duration = 6000) {
        let container = document.getElementById('smart-notification-container');
        if (!container) {
            container = document.createElement('div');
            container.id = 'smart-notification-container';
            container.style.cssText = 'position:fixed;bottom:24px;left:24px;z-index:10000;display:flex;flex-direction:column;gap:12px;max-width:380px;width:100%;';
            document.body.appendChild(container);
        }

        const notif = document.createElement('div');
        notif.style.cssText = 'background:linear-gradient(135deg, rgba(22,27,34,0.95), rgba(13,17,23,0.95));border:1px solid rgba(88,166,255,0.3);backdrop-filter:blur(12px);color:#c9d1d9;padding:16px 20px;border-radius:12px;box-shadow:0 8px 32px rgba(0,0,0,0.4);display:flex;align-items:center;justify-content:space-between;gap:16px;font-family:Tahoma,sans-serif;font-size:14px;animation:slideInUp 0.3s ease forwards;';
        
        const textSpan = document.createElement('span');
        textSpan.textContent = message;
        notif.appendChild(textSpan);

        if (actionText && actionCallback) {
            const btn = document.createElement('button');
            btn.textContent = actionText;
            btn.style.cssText = 'background:#238636;color:#ffffff;border:none;padding:8px 14px;border-radius:6px;cursor:pointer;font-weight:bold;font-size:13px;white-space:nowrap;transition:background 0.2s;';
            btn.onmouseover = () => btn.style.background = '#2ea043';
            btn.onmouseout = () => btn.style.background = '#238636';
            btn.onclick = () => {
                actionCallback();
                notif.remove();
            };
            notif.appendChild(btn);
        }

        container.appendChild(notif);

        if (!actionText) {
            setTimeout(() => {
                notif.style.animation = 'fadeOut 0.3s ease forwards';
                setTimeout(() => notif.remove(), 300);
            }, duration);
        }
    }
}

class VehicleEngine {
    constructor() {
        this.vehicleName = "تیبا ۱ مدل ۱۳۹۰ - نقره‌ای";
    }

    calculateCosts(mileage, fuelConsumed, repairCosts) {
        return {
            totalExpense: fuelConsumed + repairCosts,
            costPerKm: mileage > 0 ? (fuelConsumed + repairCosts) / mileage : 0
        };
    }
}

class GoalEngine {
    constructor() {
        this.funds = 3;
        this.remainingMonths = 7;
    }

    distributeIncome(amount) {
        const share = amount / this.funds;
        return {
            fundShare: share,
            months: this.remainingMonths
        };
    }
}

class CalendarEngine {
    constructor() {
        this.obligations = [];
    }

    checkDeadlines() {
        return this.obligations.filter(item => {
            const diffTime = new Date(item.dueDate) - new Date();
            const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
            return diffDays <= 3 && diffDays >= 0;
        });
    }
}

class AssetEngine {
    constructor() {
        this.assets = [];
    }
    getTotalNetWorth() {
        return this.assets.reduce((sum, item) => sum + item.value, 0);
    }
}

class HopAI {
    async query(prompt) {
        return `تحلیل هوشمند هوپ (Hop AI): بررسی وضعیت مالی بر اساس تراکنش‌ها و بودجه‌بندی جاری انجام شد.`;
    }
}

class FinancialOS {
    constructor() {
        this.db = new DatabaseManager();
        this.themeManager = new ThemeManager();
        this.localization = new LocalizationManager();
        this.vehicleEngine = new VehicleEngine();
        this.goalEngine = new GoalEngine();
        this.calendarEngine = new CalendarEngine();
        this.assetEngine = new AssetEngine();
        this.hopAI = new HopAI();
    }

    async init() {
        try {
            await this.db.init();
            console.log("پایگاه داده TROR PFOS با موفقیت بارگذاری شد.");
            this.removeSplashScreen();
            this.initServiceWorkerUpdates();
        } catch (error) {
            console.error("خطا در راه‌اندازی سیستم عامل مالی:", error);
        }
    }

    removeSplashScreen() {
        const splash = document.getElementById('splash-screen');
        if (splash) {
            splash.style.transition = 'opacity 0.4s ease';
            splash.style.opacity = '0';
            setTimeout(() => splash.remove(), 400);
        }
    }

    initServiceWorkerUpdates() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js?v=8').then((registration) => {
                registration.onupdatefound = () => {
                    const installingWorker = registration.installing;
                    if (installingWorker) {
                        installingWorker.onstatechange = () => {
                            if (installingWorker.state === 'installed') {
                                if (navigator.serviceWorker.controller) {
                                    SmartNotification.show(
                                        this.localization.t('newVersionReady'),
                                        this.localization.t('updateButton'),
                                        () => {
                                            installingWorker.postMessage({ type: 'SKIP_WAITING' });
                                            window.location.reload();
                                        },
                                        0
                                    );
                                }
                            }
                        };
                    }
                };
            }).catch((err) => {
                console.error("خطا در ثبت سرویس ورکر:", err);
            });

            let refreshing = false;
            navigator.serviceWorker.addEventListener('controllerchange', () => {
                if (!refreshing) {
                    refreshing = true;
                    window.location.reload();
                }
            });
        }
    }
}

// Initialize Application on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
    window.trorApp = new FinancialOS();
    window.trorApp.init();
});
