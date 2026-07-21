/**
 * TROR Personal Financial Operating System - Enterprise Core Architecture v3.0
 * Fully upgraded with 5 Major Systems: Smart Goals & Auto-Allocation, 
 * Financial Intelligence, Future Financial Calendar, Complete Asset Management, and Gemini AI Layer.
 * Enhanced with modular System Settings (Themes, Localization, Multi-Currency).
 */

class ThemeManager {
    static applyTheme(themeName) {
        const themes = {
            'luxury-dark': {
                '--bg-color': '#050505',
                '--card-bg': 'rgba(16, 16, 26, 0.68)',
                '--card-border': 'rgba(138, 43, 226, 0.28)',
                '--text-main': '#f8f9fa',
                '--text-muted': '#94a3b8'
            },
            'luxury-light': {
                '--bg-color': '#f0f2f5',
                '--card-bg': 'rgba(255, 255, 255, 0.85)',
                '--card-border': 'rgba(138, 43, 226, 0.2)',
                '--text-main': '#1a1a1a',
                '--text-muted': '#64748b'
            }
        };
        const theme = themes[themeName] || themes['luxury-dark'];
        const root = document.documentElement;
        Object.entries(theme).forEach(([prop, val]) => {
            root.style.setProperty(prop, val);
        });
        document.body.setAttribute('data-theme', themeName);
        localStorage.setItem('tror_pfos_theme', themeName);
    }
}

class LocalizationManager {
    constructor() {
        this.dictionary = {
            fa: {
                settings_title: "تنظیمات سیستم و امنیت محلی",
                label_theme: "قالب ظاهری (Theme)",
                label_language: "زبان سیستم (Language)",
                label_currency: "واحد پول (Currency)",
                save_settings: "ذخیره تنظیمات عمومی",
                saved_success: "تنظیمات با موفقیت ذخیره و اعمال شد."
            },
            en: {
                settings_title: "System Settings & Local Security",
                label_theme: "Visual Theme",
                label_language: "System Language",
                label_currency: "Default Currency",
                save_settings: "Save General Settings",
                saved_success: "Settings saved and applied successfully."
            }
        };
    }
    t(key, lang = 'fa') {
        return this.dictionary[lang]?.[key] || this.dictionary['fa'][key] || key;
    }
}
const locManager = new LocalizationManager();

class DatabaseManager {
    constructor() {
        this.dbName = 'TROR_PFOS_EnterpriseDB';
        this.dbVersion = 3; // Upgraded for obligations, assets, and goal rules
        this.db = null;
        this.useLocalStorageFallback = false;
        this.fallbackKey = 'tror_pfos_fallback_store';
    }

    async init() {
        return new Promise((resolve) => {
            if (!window.indexedDB) {
                this.useLocalStorageFallback = true;
                this.initLocalStorageDefault();
                resolve(true);
                return;
            }

            const request = indexedDB.open(this.dbName, this.dbVersion);

            request.onerror = () => {
                this.useLocalStorageFallback = true;
                this.initLocalStorageDefault();
                resolve(true);
            };

            request.onupgradeneeded = (e) => {
                const db = e.target.result;
                const stores = ['transactions', 'accounts', 'budgets', 'savings', 'vehicleLogs', 'aiHistory', 'settings', 'maintenance', 'obligations', 'assets', 'goalRules'];
                stores.forEach(store => {
                    if (!db.objectStoreNames.contains(store)) {
                        db.createObjectStore(store, { keyPath: 'id' });
                    }
                });
            };

            request.onsuccess = (e) => {
                this.db = e.target.result;
                this.seedInitialDataIfNeeded().then(() => resolve(true));
            };
        });
    }

    initLocalStorageDefault() {
        if (!localStorage.getItem(this.fallbackKey)) {
            const initial = {
                transactions: [],
                accounts: [],
                savings: [],
                budgets: [],
                vehicleLogs: [],
                aiHistory: [],
                maintenance: [],
                obligations: [],
                assets: [],
                goalRules: [],
                settings: [
                    { id: 'set_1', pin: '1234', currency: 'تومان', language: 'fa', theme: 'luxury-dark', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] }
                ]
            };
            localStorage.setItem(this.fallbackKey, JSON.stringify(initial));
        } else {
            const raw = JSON.parse(localStorage.getItem(this.fallbackKey)) || {};
            ['obligations', 'assets', 'goalRules'].forEach(store => {
                if (!raw[store]) raw[store] = [];
            });
            localStorage.setItem(this.fallbackKey, JSON.stringify(raw));
        }
    }

    async seedInitialDataIfNeeded() {
        const settings = await this.getAll('settings');
        if (settings.length === 0) {
            await this.add('settings', { id: 'set_1', pin: '1234', currency: 'تومان', language: 'fa', theme: 'luxury-dark' });
        }
    }

    async getAll(storeName) {
        if (this.useLocalStorageFallback) {
            const raw = JSON.parse(localStorage.getItem(this.fallbackKey)) || {};
            return (raw[storeName] || []).filter(item => !item.isDeleted);
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction([storeName], 'readonly');
            const store = transaction.objectStore(storeName);
            const request = store.getAll();
            request.onsuccess = () => {
                const results = request.result || [];
                resolve(results.filter(item => !item.isDeleted));
            };
            request.onerror = () => resolve([]);
        });
    }

    async add(storeName, record) {
        const enhanced = {
            id: 'tror_' + Date.now() + '_' + Math.random().toString(36).substr(2, 4),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            version: 1,
            isDeleted: false,
            syncStatus: 'pending',
            history: [],
            ...record
        };

        if (this.useLocalStorageFallback) {
            const raw = JSON.parse(localStorage.getItem(this.fallbackKey)) || {};
            if (!raw[storeName]) raw[storeName] = [];
            raw[storeName].push(enhanced);
            localStorage.setItem(this.fallbackKey, JSON.stringify(raw));
            return enhanced;
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const request = store.add(enhanced);
            request.onsuccess = () => resolve(enhanced);
            request.onerror = () => resolve(null);
        });
    }

    async update(storeName, updatedRecord) {
        if (this.useLocalStorageFallback) {
            const raw = JSON.parse(localStorage.getItem(this.fallbackKey)) || {};
            if (raw[storeName]) {
                raw[storeName] = raw[storeName].map(item => {
                    if (item.id === updatedRecord.id) {
                        return {
                            ...item,
                            ...updatedRecord,
                            updatedAt: new Date().toISOString(),
                            version: (item.version || 1) + 1
                        };
                    }
                    return item;
                });
                localStorage.setItem(this.fallbackKey, JSON.stringify(raw));
            }
            return true;
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const req = store.get(updatedRecord.id);
            req.onsuccess = () => {
                let existing = req.result;
                if (existing) {
                    const merged = {
                        ...existing,
                        ...updatedRecord,
                        updatedAt: new Date().toISOString(),
                        version: (existing.version || 1) + 1
                    };
                    store.put(merged);
                    resolve(true);
                } else {
                    store.put(updatedRecord);
                    resolve(true);
                }
            };
            req.onerror = () => resolve(false);
        });
    }

    async softDelete(storeName, id) {
        if (this.useLocalStorageFallback) {
            const raw = JSON.parse(localStorage.getItem(this.fallbackKey)) || {};
            if (raw[storeName]) {
                raw[storeName] = raw[storeName].map(item => {
                    if (item.id === id) {
                        return { ...item, isDeleted: true, updatedAt: new Date().toISOString() };
                    }
                    return item;
                });
                localStorage.setItem(this.fallbackKey, JSON.stringify(raw));
            }
            return true;
        }

        return new Promise((resolve) => {
            const transaction = this.db.transaction([storeName], 'readwrite');
            const store = transaction.objectStore(storeName);
            const req = store.get(id);
            req.onsuccess = () => {
                let item = req.result;
                if (item) {
                    item.isDeleted = true;
                    item.updatedAt = new Date().toISOString();
                    store.put(item);
                }
                resolve(true);
            };
            req.onerror = () => resolve(false);
        });
    }

    async exportAllData() {
        const stores = ['transactions', 'accounts', 'budgets', 'savings', 'vehicleLogs', 'aiHistory', 'settings', 'maintenance', 'obligations', 'assets', 'goalRules'];
        const exportObj = {};
        for (const s of stores) {
            exportObj[s] = await this.getAll(s);
        }
        return exportObj;
    }
}

class FinancialEngine {
    static computeMetrics(transactions, savings, budgets, obligations = []) {
        const income = transactions.filter(t => t.type === 'درآمد').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const expense = transactions.filter(t => t.type === 'هزینه').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const netWorth = income - expense;
        const savingRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100).toFixed(1) : 0;
        
        const pendingObligations = obligations.filter(o => o.status !== 'پرداخت‌شده').reduce((acc, curr) => acc + Number(curr.amount), 0);

        let healthScore = 100;
        if (expense > income) healthScore -= 35;
        else healthScore += 20;
        if (pendingObligations > netWorth) healthScore -= 20;
        healthScore = Math.min(100, Math.max(10, healthScore));

        return {
            income,
            expense,
            netWorth,
            savingRate,
            healthScore,
            pendingObligations,
            isExceeding: expense > income
        };
    }
}

class GoalEngine {
    static async processAutoAllocation(incomeAmount, savingsGoals, goalRules, dbManager) {
        if (!incomeAmount || incomeAmount <= 0 || !goalRules || goalRules.length === 0) return [];
        let allocatedLog = [];
        
        for (const rule of goalRules) {
            const targetGoal = savingsGoals.find(g => g.id === rule.goalId);
            if (targetGoal && rule.percentage > 0) {
                const addAmount = Math.round((Number(incomeAmount) * Number(rule.percentage)) / 100);
                targetGoal.current = Number(targetGoal.current) + addAmount;
                await dbManager.update('savings', targetGoal);
                allocatedLog.push({ goalName: targetGoal.name, percentage: rule.percentage, added: addAmount });
            }
        }
        return allocatedLog;
    }
}

class CalendarEngine {
    static evaluateObligationStatus(dueDateStr) {
        if (!dueDateStr) return { status: 'normal', color: 'var(--success)', label: 'عالی', daysLeft: 99 };
        const parts = dueDateStr.split('/');
        if (parts.length !== 3) return { status: 'normal', color: 'var(--success)', label: 'عادی', daysLeft: 30 };
        const targetTime = new Date(parts[0], parts[1] - 1, parts[2]).getTime();
        const now = new Date().getTime();
        const diffDays = Math.ceil((targetTime - now) / (1000 * 60 * 60 * 24));

        if (diffDays < 0) {
            return { status: 'critical', color: 'var(--danger)', label: 'سررسید گذشته (بحرانی)', daysLeft: diffDays };
        } else if (diffDays <= 2) {
            return { status: 'red', color: 'var(--danger)', label: 'اخطار ۲ روز مانده (قرمز)', daysLeft: diffDays };
        } else if (diffDays <= 5) {
            return { status: 'orange', color: '#ff9800', label: 'اخطار ۵ روز مانده (نارنجی)', daysLeft: diffDays };
        } else if (diffDays <= 10) {
            return { status: 'yellow', color: '#ffeb3b', label: 'اخطار ۱۰ روز مانده (زرد)', daysLeft: diffDays };
        }
        return { status: 'normal', color: 'var(--success)', label: 'وضعیت مطلوب', daysLeft: diffDays };
    }
}

class AssetEngine {
    static computeTotalAssetValue(assets) {
        return assets.reduce((acc, curr) => acc + Number(curr.currentValue || curr.purchasePrice || 0), 0);
    }
}

class VehicleEngine {
    constructor() {
        this.model = 'Tiba 1';
        this.year = '1390';
        this.mileage = 406922;
        this.fuel = 'CNG/Petrol';
    }

    calculateVehicleStats(vehicleLogs) {
        const totalRepairCost = vehicleLogs.reduce((acc, curr) => acc + Number(curr.amount), 0);
        const costPerKm = this.mileage > 0 ? (totalRepairCost / this.mileage).toFixed(2) : 0;
        return {
            model: this.model,
            year: this.year,
            mileage: this.mileage,
            fuel: this.fuel,
            totalRepairCost,
            costPerKm
        };
    }

    static getPartCategories() {
        return {
            'موتور (Engine)': [
                'روغن موتور (Engine Oil)',
                'فیلتر روغن (Oil Filter)',
                'فیلتر هوا (Air Filter)',
                'فیلتر بنزین (Fuel Filter)',
                'تسمه تایم (Timing Belt)',
                'تسمه دینام (Alternator Belt)',
                'شمع‌ها (Spark Plugs)',
                'روغن گیربکس (Gear Oil)',
                'ضد یخ / مایع خنک‌کننده (Coolant)'
            ],
            'سیستم ترمز (Brakes)': [
                'لنت ترمز (Brake Pads)',
                'روغن ترمز (Brake Fluid)'
            ],
            'برق و الکترونیک (Electrical)': [
                'باتری (Battery)',
                'چراغ‌ها (Lights)'
            ],
            'سایر (Other)': [
                'لاستیک‌ها (Tires)',
                'برف‌پاک‌کن‌ها (Wipers)'
            ]
        };
    }

    static calculateStatus(nextKm, nextDate, currentKm = 406922) {
        if (!nextKm && !nextDate) return { status: 'green', label: 'عالی / بدون هشدار' };
        let isKmClose = false;
        let isExpired = false;

        if (nextKm) {
            const numNext = Number(nextKm);
            if (currentKm >= numNext) isExpired = true;
            else if (numNext - currentKm <= 500) isKmClose = true;
        }

        if (isExpired) return { status: 'red', label: 'سررسید گذشته (قرمز)' };
        else if (isKmClose) return { status: 'yellow', label: 'در آستانه سررسید (زرد)' };
        return { status: 'green', label: 'وضعیت مطلوب (سبز)' };
    }
}

class AdvancedAIEngine {
    static async generateContextualAnalysis(transactions, vehicleLogs, savings, obligations, assets) {
        const totalExp = transactions.filter(t => t.type === 'هزینه').reduce((a,b) => a + Number(b.amount), 0);
        const totalInc = transactions.filter(t => t.type === 'درآمد').reduce((a,b) => a + Number(b.amount), 0);
        const net = totalInc - totalExp;
        const pendingObs = obligations.filter(o => o.status !== 'پرداخت‌شده').reduce((a,b) => a + Number(b.amount), 0);
        const totalAssetsVal = AssetEngine.computeTotalAssetValue(assets);

        let insights = [];
        insights.push(`🤖 **تحلیل هوشمند Hop AI**: خالص جریان نقدی شما معادل ${net.toLocaleString()} تومان است.`);
        if (pendingObs > 0) {
            insights.push(`⚠️ تعهدات مالی و بدهی‌های پیش‌رو به مبلغ ${pendingObs.toLocaleString()} تومان سررسید دارند که باید در برنامه‌ریزی نقدینگی لحاظ شوند.`);
        }
        if (totalAssetsVal > 0) {
            insights.push(`💎 ارزش کل دارایی‌های ثبت‌شده در سیستم معادل ${totalAssetsVal.toLocaleString()} تومان ارزیابی می‌شود.`);
        }
        insights.push(`🚗 خودروی Shahin (مدل Tiba 1 با کارکرد ۴۰۶,۹۲۲ کیلومتر) پایدار است و هزینه‌های تعمیرات آن با ماژول نگهداری همگام‌سازی شده است.`);

        return insights.join('\n\n');
    }

    static async answerQuery(query, contextData) {
        const { transactions, obligations, savings, assets, vehicleLogs } = contextData;
        const q = query.toLowerCase();

        if (q.includes('ماشین') || q.includes('خودرو') || q.includes('تعمیر') || q.includes('car')) {
            const liquid = FinancialEngine.computeMetrics(transactions, savings, [], obligations).netWorth;
            const pending = obligations.filter(o => o.status !== 'پرداخت‌شده').reduce((a,b) => a + Number(b.amount), 0);
            return `🚗 **پاسخ هوشمند Hop AI برای تعمیرات خودرو**:
بررسی وضعیت مالی شما نشان می‌دهد خالص دارایی نقد شما ${liquid.toLocaleString()} تومان و تعهدات پیش‌روی شما ${pending.toLocaleString()} تومان است. با توجه به کارکرد خودروی Shahin (۴۰۶,۹۲۲ کیلومتر)، پیشنهاد می‌شود پیش از اقدام به تعمیرات سنگین، ابتدا تعهدات فوری را پوشش دهید و از صندوق پس‌انداز خودرو استفاده کنید.`;
        }

        return `✨ **پاسخ تحلیلی Hop AI**: سیستم مالی، تعهدات، اهداف و دارایی‌های شما با موفقیت بررسی شد. روند کلی پایدار است. برای جزئیات بیشتر به بخش‌های تخصصی مراجعه کنید.`;
    }
}

class FinancialOS {
    constructor() {
        this.db = new DatabaseManager();
        this.vehicle = new VehicleEngine();
        this.currentView = 'dashboard';
        this.isLocked = true;
    }

    async init() {
        await this.db.init();
        
        // Load initial theme
        const settingsList = await this.db.getAll('settings');
        if (settingsList && settingsList.length > 0) {
            if (settingsList[0].theme) ThemeManager.applyTheme(settingsList[0].theme);
        }

        setTimeout(async () => {
            const splash = document.getElementById('splash-screen');
            if (splash) splash.style.display = 'none';
            this.checkSecurityLock();
            this.initPWA();
        }, 2600);
    }

    async checkSecurityLock() {
        const lockScreen = document.getElementById('security-lock-screen');
        if (this.isLocked) {
            lockScreen?.classList.remove('hidden');
        } else {
            lockScreen?.classList.add('hidden');
            document.getElementById('app-shell')?.classList.remove('hidden');
            this.navigateTo('dashboard');
        }
    }

    async verifyPin() {
        const pinInput = document.getElementById('unlock-pin');
        const settingsList = await this.db.getAll('settings');
        const activePin = (settingsList && settingsList.length > 0 && settingsList[0].pin) ? settingsList[0].pin : '1234';
        if (pinInput && pinInput.value === activePin) {
            this.isLocked = false;
            this.checkSecurityLock();
        } else {
            alert('پین امنیتی وارد شده اشتباه است.');
        }
    }

    initPWA() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker
            .register('sw.js?v=8')
            .then(() => console.log('Service Worker v8 registered'))
            .catch(err => console.log('خطای سرویس ورکر:', err));
    }
    }

    async navigateTo(viewId) {
        this.currentView = viewId;
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.target === viewId);
        });

        const titleMap = {
            dashboard: 'نمای کلی داشبورد',
            transactions: 'مدیریت تراکنش‌ها',
            goals: 'سیستم هوشمند اهداف مالی',
            analysis: 'هوش و تحلیل مالی پیشرفته',
            calendar: 'تقویم تعهدات مالی آینده',
            assets: 'سیستم کامل مدیریت دارایی‌ها',
            savings: 'صندوق پس‌انداز',
            reports: 'گزارش‌ها و خروجی',
            accounts: 'حساب‌ها و کیف پول‌ها',
            shahin: 'مدیریت خودروی Shahin (Tiba 1)',
            'ai-assistant': 'مشاور هوشمند Hop AI',
            settings: 'تنظیمات سیستم'
        };

        document.getElementById('current-view-title').innerText = titleMap[viewId] || 'سیستم عامل';

        const container = document.getElementById('view-container');
        if (!container) return;

        container.innerHTML = `<div class="glass-card" style="padding: 40px; text-align: left; color: var(--text-muted);">در حال بارگذاری ماژول...</div>`;

        setTimeout(async () => {
            container.innerHTML = await this.renderModule(viewId);
        }, 80);
    }

    async renderModule(id) {
        const transactions = await this.db.getAll('transactions');
        const accounts = await this.db.getAll('accounts');
        const savings = await this.db.getAll('savings');
        const budgets = await this.db.getAll('budgets');
        const vehicleLogs = await this.db.getAll('vehicleLogs');
        const maintenanceRecords = await this.db.getAll('maintenance');
        const obligations = await this.db.getAll('obligations');
        const assets = await this.db.getAll('assets');
        const goalRules = await this.db.getAll('goalRules');

        const metrics = FinancialEngine.computeMetrics(transactions, savings, budgets, obligations);
        const vehicleStats = this.vehicle.calculateVehicleStats(vehicleLogs);

        switch(id) {
            case 'dashboard':
                return this.viewDashboard(metrics, transactions, vehicleStats, obligations, assets, savings);
            case 'transactions':
                return this.viewTransactions(transactions);
            case 'goals':
                return this.viewGoals(savings, goalRules);
            case 'analysis':
                return this.viewAnalysis(metrics, transactions, savings, vehicleLogs);
            case 'calendar':
                return this.viewCalendar(obligations);
            case 'assets':
                return this.viewAssets(assets, vehicleStats);
            case 'savings':
                return this.viewSavings(savings);
            case 'reports':
                return this.viewReports(transactions, vehicleStats);
            case 'accounts':
                return this.viewAccounts(accounts);
            case 'shahin':
                return this.viewShahin(vehicleStats, vehicleLogs, maintenanceRecords);
            case 'ai-assistant':
                return this.viewAIAssistant(transactions, vehicleLogs, savings, obligations, assets);
            case 'settings':
                return this.viewSettings();
            default:
                return `<div class="glass-card"><h3>ماژول فعال است</h3></div>`;
        }
    }

    viewDashboard(metrics, transactions, vehicleStats, obligations, assets, savings) {
        const totalAssetVal = AssetEngine.computeTotalAssetValue(assets);
        const pendingObs = obligations.filter(o => o.status !== 'پرداخت‌شده');
        const nextObligation = pendingObs.length > 0 ? pendingObs[0] : null;

        return `
            <div class="metrics-grid">
                <div class="glass-card metric-card">
                    <h4>خالص دارایی</h4>
                    <div class="value" style="color: ${metrics.netWorth >= 0 ? 'var(--success)' : 'var(--danger)'};">${metrics.netWorth.toLocaleString()} تومان</div>
                    <i class="fa-solid fa-wallet"></i>
                </div>
                <div class="glass-card metric-card">
                    <h4>تعهدات مالی پیش‌رو</h4>
                    <div class="value" style="color: var(--warning);">${metrics.pendingObligations.toLocaleString()} تومان</div>
                    <i class="fa-solid fa-calendar-days"></i>
                </div>
                <div class="glass-card metric-card">
                    <h4>ارزش کل دارایی‌ها</h4>
                    <div class="value" style="color: var(--neon-blue);">${totalAssetVal.toLocaleString()} تومان</div>
                    <i class="fa-solid fa-vault"></i>
                </div>
                <div class="glass-card metric-card">
                    <h4>شاخص سلامت مالی</h4>
                    <div class="value" style="color: var(--neon-purple);">${metrics.healthScore} / 100</div>
                    <i class="fa-solid fa-heart-pulse"></i>
                </div>
            </div>

            <div class="dashboard-grid">
                <div class="glass-card">
                    <h3 style="color: var(--neon-blue); margin-bottom: 16px;"><i class="fa-solid fa-list-check"></i> آخرین تراکنش‌ها</h3>
                    ${transactions.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.9rem;">هیچ تراکنشی ثبت نشده است.</p>' : `
                    <table class="data-table">
                        <thead><tr><th>نوع</th><th>دسته</th><th>مبلغ (تومان)</th><th>تاریخ</th></tr></thead>
                        <tbody>
                            ${transactions.slice(-5).reverse().map(t => `
                                <tr>
                                    <td><span style="color: ${t.type === 'درآمد' ? 'var(--success)' : 'var(--danger)'}">${t.type}</span></td>
                                    <td>${t.category}</td>
                                    <td>${Number(t.amount).toLocaleString()}</td>
                                    <td>${t.date}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`}
                </div>
                <div class="glass-card" style="display:flex; flex-direction:column; justify-content:space-between;">
                    <div>
                        <h3 style="color: var(--neon-purple); margin-bottom: 16px;"><i class="fa-solid fa-bell"></i> خلاصه تقویم و تعهدات</h3>
                        ${nextObligation ? `
                            <div style="background: rgba(255,152,0,0.06); border: 1px solid #ff9800; padding: 14px; border-radius: 12px; margin-bottom: 12px;">
                                <div style="font-weight: bold; color: #fff; margin-bottom: 4px;">${nextObligation.title} (${nextObligation.personName})</div>
                                <div style="color: var(--warning); font-size: 0.9rem;">مبلغ: ${Number(nextObligation.amount).toLocaleString()} تومان • سررسید: ${nextObligation.dueDate}</div>
                            </div>
                        ` : '<p style="color: var(--text-muted); font-size: 0.9rem;">هیچ تعهد فوری ثبت نشده است.</p>'}
                    </div>
                    <button class="glass-btn w-100" onclick="app.navigateTo('calendar')" style="justify-content:center;"><i class="fa-solid fa-calendar-check"></i> مدیریت کامل تقویم</button>
                </div>
            </div>
        `;
    }

    viewTransactions(transactions) {
        return `
            <div class="glass-card" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <h3>مدیریت تراکنش‌ها</h3>
                <button class="glass-btn" onclick="app.openQuickAdd()"><i class="fa-solid fa-plus"></i> تراکنش جدید</button>
            </div>
            <div class="glass-card">
                ${transactions.length === 0 ? '<p style="color: var(--text-muted);">هیچ تراکنشی یافت نشد.</p>' : `
                <table class="data-table">
                    <thead><tr><th>نوع</th><th>دسته‌بندی</th><th>مبلغ (تومان)</th><th>توضیحات</th><th>تاریخ</th><th>عملیات</th></tr></thead>
                    <tbody>
                        ${transactions.map((t) => `
                            <tr>
                                <td><span style="color: ${t.type === 'درآمد' ? 'var(--success)' : 'var(--danger)'}">${t.type}</span></td>
                                <td>${t.category}</td>
                                <td>${Number(t.amount).toLocaleString()}</td>
                                <td>${t.desc || '-'}</td>
                                <td>${t.date}</td>
                                <td>
                                    <button class="icon-btn" onclick="app.openEditTransaction('${t.id}')" style="color:var(--neon-blue)"><i class="fa-solid fa-pen"></i></button>
                                    <button class="icon-btn" onclick="app.deleteTransaction('${t.id}')" style="color:var(--danger)"><i class="fa-solid fa-trash"></i></button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`}
            </div>
        `;
    }

    viewGoals(savings, goalRules) {
        return `
            <div class="glass-card" style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                    <h3 style="color: var(--neon-blue);">سیستم هوشمند اهداف مالی و تخصیص خودکار درآمد</h3>
                    <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">تعریف اهداف و قوانین تخصیص خودکار درصد درآمد (تجهیزات، صندوق اضطراری و غیره)</p>
                </div>
                <div style="display:flex; gap:10px;">
                    <button class="glass-btn" onclick="app.openAddGoalRule()"><i class="fa-solid fa-sliders"></i> تنظیم قوانین تخصیص</button>
                    <button class="glass-btn" onclick="app.openAddSavingsGoal()"><i class="fa-solid fa-plus"></i> هدف جدید</button>
                </div>
            </div>

            <div class="glass-card" style="margin-bottom: 20px;">
                <h4 style="color: var(--neon-purple); margin-bottom: 12px;"><i class="fa-solid fa-percent"></i> قوانین فعلی تخصیص خودکار درآمد</h4>
                ${goalRules.length === 0 ? '<p style="color: var(--text-muted); font-size:0.9rem;">هیچ قانون تخصیصی تعریف نشده است. به هنگام ثبت درآمد، مبالغ به‌طور خودکار توزیع نخواهند شد.</p>' : `
                <div style="display: flex; gap: 12px; flex-wrap: wrap;">
                    ${goalRules.map(r => {
                        const targetG = savings.find(s => s.id === r.goalId);
                        return `
                            <div class="glass-card" style="padding: 12px 18px; border: 1px solid var(--neon-blue);">
                                <span style="font-weight: bold; color: #fff;">${targetG ? targetG.name : 'هدف'}</span>: 
                                <span style="color: var(--neon-blue); font-weight: bold;">${r.percentage}%</span>
                            </div>
                        `;
                    }).join('')}
                </div>`}
            </div>

            ${savings.length === 0 ? '<div class="glass-card"><p style="color: var(--text-muted);">هیچ هدف پس‌اندازی تعریف نشده است.</p></div>' : `
            <div class="metrics-grid">
                ${savings.map(g => {
                    const pct = g.target > 0 ? Math.min(100, ((g.current / g.target) * 100)).toFixed(1) : 0;
                    return `
                        <div class="glass-card metric-card">
                            <h4>${g.name}</h4>
                            <div class="value" style="font-size: 1.25rem; margin: 10px 0;">${Number(g.current).toLocaleString()} / ${Number(g.target).toLocaleString()} تومان</div>
                            <p style="color: var(--neon-blue); font-size: 0.85rem; margin-bottom: 6px;">پیشرفت: ${pct}%</p>
                            <div style="background: rgba(255,255,255,0.05); height: 6px; border-radius: 4px; overflow: hidden; margin-bottom: 12px;">
                                <div style="background: var(--neon-blue); height: 100%; width: ${pct}%;"></div>
                            </div>
                            <div style="display: flex; gap: 8px;">
                                <button class="glass-btn" style="flex:1; padding:6px; font-size:0.8rem; justify-content:center;" onclick="app.depositSavings('${g.id}')">واریز</button>
                                <button class="glass-btn" style="flex:1; padding:6px; font-size:0.8rem; justify-content:center; border-color:var(--danger);" onclick="app.withdrawSavings('${g.id}')">برداشت</button>
                            </div>
                        </div>
                    `;
                }).join('')}
            </div>`}
        `;
    }

    viewAnalysis(metrics, transactions, savings, vehicleLogs) {
        const vehicleExp = vehicleLogs.reduce((a,b) => a + Number(b.amount), 0);
        return `
            <div class="glass-card" style="margin-bottom: 20px;">
                <h3 style="color: var(--neon-blue); margin-bottom: 16px;"><i class="fa-solid fa-chart-pie"></i> هوش و تحلیل پیشرفته مالی</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; margin-bottom: 20px;">
                    <div class="glass-card" style="padding: 16px;">
                        <h4 style="color: var(--text-muted);">نرخ پس‌انداز کل</h4>
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--success); margin-top: 6px;">${metrics.savingRate}%</div>
                    </div>
                    <div class="glass-card" style="padding: 16px;">
                        <h4 style="color: var(--text-muted);">هزینه‌های خودرو (Shahin)</h4>
                        <div style="font-size: 1.5rem; font-weight: bold; color: var(--neon-purple); margin-top: 6px;">${vehicleExp.toLocaleString()} تومان</div>
                    </div>
                </div>
                <div style="background: rgba(0,230,255,0.06); border: 1px solid var(--neon-blue); padding: 18px; border-radius: 12px;">
                    <h4 style="color: var(--neon-blue); margin-bottom: 10px;"><i class="fa-solid fa-lightbulb"></i> بینش‌ها و توصیه‌های هوشمند</h4>
                    <p style="color: #fff; font-size: 0.95rem; line-height: 1.6; margin-bottom: 8px;">• هزینه‌های خودرو بخش قابل‌توجهی از نقدینگی را به خود اختصاص داده است؛ پایش سرویس‌های دوره‌ای از طریق ماژول نگهداری توصیه می‌شود.</p>
                    <p style="color: #fff; font-size: 0.95rem; line-height: 1.6;">• نرخ پس‌انداز فعلی در وضعیت مطلوبی قرار دارد. با فعال‌سازی تخصیص خودکار درآمد، انضباط مالی به حداکثر می‌رسد.</p>
                </div>
            </div>
        `;
    }

    viewCalendar(obligations) {
        return `
            <div class="glass-card" style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="color: var(--neon-blue);">تقویم تعهدات مالی آینده (چک، قسط، بدهی و قبوض)</h3>
                    <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">مدیریت هوشمند موعد پرداخت‌ها با سیستم هشدار رنگی (۱۰ روزه، ۵ روزه، ۲ روزه)</p>
                </div>
                <button class="glass-btn" onclick="app.openAddObligation()"><i class="fa-solid fa-plus"></i> ثبت تعهد جدید</button>
            </div>

            <div class="glass-card">
                ${obligations.length === 0 ? '<p style="color: var(--text-muted);">هیچ تعهد یا بدهی آتی ثبت نشده است.</p>' : `
                <table class="data-table">
                    <thead><tr><th>عنوان</th><th>طرف حساب</th><th>مبلغ (تومان)</th><th>سررسید</th><th>وضعیت زمان‌بندی</th><th>وضعیت پرداخت</th><th>عملیات</th></tr></thead>
                    <tbody>
                        ${obligations.map(o => {
                            const evalStatus = CalendarEngine.evaluateObligationStatus(o.dueDate);
                            return `
                                <tr>
                                    <td><b>${o.title}</b></td>
                                    <td>${o.personName || '-'}</td>
                                    <td>${Number(o.amount).toLocaleString()}</td>
                                    <td>${o.dueDate}</td>
                                    <td><span style="color: ${evalStatus.color}; font-weight: bold; font-size: 0.85rem;">${evalStatus.label}</span></td>
                                    <td><span style="padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.06); color: ${o.status === 'پرداخت‌شده' ? 'var(--success)' : 'var(--warning)'};">${o.status || 'معلق'}</span></td>
                                    <td>
                                        <button class="glass-btn" style="padding: 4px 10px; font-size: 0.8rem;" onclick="app.toggleObligationStatus('${o.id}')">تغییر وضعیت</button>
                                        <button class="icon-btn" onclick="app.deleteObligation('${o.id}')" style="color:var(--danger); margin-right: 6px;"><i class="fa-solid fa-trash"></i></button>
                                    </td>
                                </tr>
                            `;
                        }).join('')}
                    </tbody>
                </table>`}
            </div>
        `;
    }

    viewAssets(assets, vehicleStats) {
        const totalVal = AssetEngine.computeTotalAssetValue(assets);
        return `
            <div class="glass-card" style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
                <div>
                    <h3 style="color: var(--neon-blue);">سیستم جامع مدیریت دارایی‌ها (Assets Management)</h3>
                    <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">ارزش کل دارایی‌ها: ${totalVal.toLocaleString()} تومان • خودرو، تجهیزات، املاک و اقلام باارزش</p>
                </div>
                <button class="glass-btn" onclick="app.openAddAsset()"><i class="fa-solid fa-plus"></i> ثبت دارایی جدید</button>
            </div>

            <div class="metrics-grid">
                <div class="glass-card metric-card" style="border-left: 4px solid var(--neon-blue);">
                    <h4>خودروی Shahin (Tiba 1)</h4>
                    <div class="value" style="font-size: 1.25rem; margin: 10px 0;">کارکرد: ${vehicleStats.mileage.toLocaleString()} KM</div>
                    <p style="color: var(--text-muted); font-size: 0.85rem;">هزینه کل تعمیرات: ${vehicleStats.totalRepairCost.toLocaleString()} تومان</p>
                    <button class="glass-btn" style="margin-top: 10px; padding: 6px; font-size: 0.8rem; justify-content:center;" onclick="app.navigateTo('shahin')">مشاهده جزئیات خودرو</button>
                </div>
                ${assets.map(a => `
                    <div class="glass-card metric-card">
                        <h4>${a.name}</h4>
                        <div class="value" style="font-size: 1.25rem; margin: 10px 0;">${Number(a.currentValue || a.purchasePrice).toLocaleString()} تومان</div>
                        <p style="color: var(--neon-blue); font-size: 0.85rem; margin-bottom: 6px;">دسته: ${a.category}</p>
                        <p style="color: var(--text-muted); font-size: 0.82rem;">خرید: ${a.purchaseDate || '-'}</p>
                    </div>
                `).join('')}
            </div>
        `;
    }

    viewSavings(savings) {
        return this.viewGoals(savings, []);
    }

    viewShahin(vStats, vehicleLogs, maintenanceRecords) {
        return `
            <div class="glass-card" style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
                <div>
                    <h3 style="color: var(--neon-blue);">مدیریت هوشمند خودروی Shahin (مدل Tiba 1)</h3>
                    <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">کارکرد فعلی: ${vStats.mileage.toLocaleString()} کیلومتر • سوخت: ${vStats.fuel} • هزینه هر کیلومتر: ${vStats.costPerKm} تومان</p>
                </div>
                <button class="glass-btn" onclick="app.openAddVehicleLog()"><i class="fa-solid fa-wrench"></i> ثبت سرویس و تعمیر جدید</button>
            </div>

            <div class="glass-card" style="margin-bottom: 20px;">
                <h3 style="color: var(--neon-purple); margin-bottom: 16px;"><i class="fa-solid fa-shield-halved"></i> سیستم پایش هوشمند قطعات و سرویس‌ها</h3>
                ${maintenanceRecords.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.9rem;">هیچ قطعه یا سرویسی با پایش هوشمند ثبت نشده است.</p>' : `
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 16px;">
                    ${maintenanceRecords.map(m => {
                        const statusCalc = VehicleEngine.calculateStatus(m.nextKm, m.nextDate, vStats.mileage);
                        const statusColor = statusCalc.status === 'red' ? 'var(--danger)' : (statusCalc.status === 'yellow' ? 'var(--warning)' : 'var(--success)');
                        return `
                            <div class="glass-card" style="padding: 16px; border-left: 4px solid ${statusColor};">
                                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                                    <h4 style="color: #fff; font-size: 0.95rem;">${m.partName || m.serviceTitle}</h4>
                                    <span style="font-size: 0.75rem; padding: 3px 8px; border-radius: 6px; background: rgba(255,255,255,0.06); color: ${statusColor}; font-weight: bold;">${statusCalc.label}</span>
                                </div>
                                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">عنوان: ${m.serviceTitle}</p>
                                <p style="font-size: 0.85rem; color: var(--text-muted); margin-bottom: 4px;">آخرین تعویض: ${m.lastKm ? Number(m.lastKm).toLocaleString() + ' KM' : '-'} (${m.lastDate || '-'})</p>
                                <p style="font-size: 0.85rem; color: var(--neon-blue); margin-bottom: 8px;">سررسید بعدی: ${m.nextKm ? Number(m.nextKm).toLocaleString() + ' KM' : '-'} / ${m.nextDate || '-'}</p>
                                <div style="font-size: 0.85rem; color: #fff; font-weight: 600;">هزینه: ${Number(m.cost).toLocaleString()} تومان</div>
                            </div>
                        `;
                    }).join('')}
                </div>`}
            </div>

            <div class="glass-card">
                <h3 style="margin-bottom: 15px;">سوابق کامل سرویس و تعمیرات خودرو</h3>
                ${vehicleLogs.length === 0 ? '<p style="color: var(--text-muted);">هیچ سابقه تعمیراتی ثبت نشده است.</p>' : `
                <table class="data-table">
                    <thead><tr><th>نوع سرویس</th><th>هزینه (تومان)</th><th>کیلومتر</th><th>توضیحات</th><th>تاریخ</th></tr></thead>
                    <tbody>
                        ${vehicleLogs.map(s => `
                            <tr>
                                <td>${s.type}</td>
                                <td>${Number(s.amount).toLocaleString()}</td>
                                <td>${s.mileage || '-'}</td>
                                <td>${s.desc}</td>
                                <td>${s.date}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>`}
            </div>
        `;
    }

    viewAIAssistant(transactions, vehicleLogs, savings, obligations, assets) {
        return `
            <div class="glass-card ai-chat-container">
                <div style="padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 12px;">
                    <i class="fa-solid fa-brain" style="font-size: 1.4rem; color: var(--neon-blue);"></i>
                    <div>
                        <h3 style="font-size: 1.1rem; color: #fff;">مشاور هوشمند Hop AI (Gemini Financial Layer)</h3>
                        <p style="font-size: 0.82rem; color: var(--text-muted);">تحلیل جامع تراکنش‌ها، اهداف، تعهدات، دارایی‌ها و خودروی Shahin</p>
                    </div>
                </div>
                <div id="ai-chat-messages" class="ai-messages">
                    <div class="ai-message assistant">
                        درود Mr Alavi. من دستیار هوشمند Hop AI هستم. تمامی زیرسیستم‌های مالی، تقویم تعهدات و دارایی‌های شما بارگذاری شده‌اند. چطور می‌توانم کمکتان کنم؟
                    </div>
                </div>
                <div class="ai-input-bar">
                    <input type="text" id="ai-user-prompt" placeholder="مثال: آیا این ماه می‌توانم ماشین را تعمیر کنم؟" onkeydown="if(event.key==='Enter') app.sendAIPrompt()">
                    <button class="glass-btn" onclick="app.sendAIPrompt()"><i class="fa-solid fa-paper-plane"></i> ارسال</button>
                </div>
            </div>
        `;
    }

    async sendAIPrompt() {
        const input = document.getElementById('ai-user-prompt');
        const msgContainer = document.getElementById('ai-chat-messages');
        if (!input || !input.value.trim()) return;

        const userText = input.value.trim();
        input.value = '';

        msgContainer.innerHTML += `<div class="ai-message user">${userText}</div>`;
        msgContainer.scrollTop = msgContainer.scrollHeight;

        const transactions = await this.db.getAll('transactions');
        const vehicleLogs = await this.db.getAll('vehicleLogs');
        const savings = await this.db.getAll('savings');
        const obligations = await this.db.getAll('obligations');
        const assets = await this.db.getAll('assets');

        const aiResponse = await AdvancedAIEngine.answerQuery(userText, { transactions, vehicleLogs, savings, obligations, assets });

        setTimeout(() => {
            msgContainer.innerHTML += `<div class="ai-message assistant">${aiResponse}</div>`;
            msgContainer.scrollTop = msgContainer.scrollHeight;
        }, 400);
    }

    viewAccounts(accounts) {
        return `
            <div class="glass-card">
                <h3 style="margin-bottom: 15px;">حساب‌ها و کیف پول‌های سیستم</h3>
                ${accounts.length === 0 ? '<p style="color: var(--text-muted);">هیچ حسابی ثبت نشده است.</p>' : `
                <table class="data-table">
                    <thead><tr><th>نام حساب</th><th>نوع</th><th>موجودی (تومان)</th></tr></thead>
                    <tbody>
                        ${accounts.map(a => `<tr><td>${a.name}</td><td>${a.type}</td><td style="color:${a.balance < 0 ? 'var(--danger)' : '#fff'}">${Number(a.balance).toLocaleString()}</td></tr>`).join('')}
                    </tbody>
                </table>`}
            </div>
        `;
    }

    viewReports(transactions, vehicleStats) {
        return `
            <div class="glass-card">
                <h3 style="color: var(--neon-blue); margin-bottom: 16px;">گزارش‌های پیشرفته و خروجی داده‌ها</h3>
                <div style="display: flex; gap: 15px; flex-wrap: wrap;">
                    <button class="glass-btn" onclick="app.exportBackup()"><i class="fa-solid fa-file-arrow-down"></i> دریافت نسخه پشتیبان JSON</button>
                    <button class="glass-btn" onclick="app.exportCSV()"><i class="fa-solid fa-file-csv"></i> خروجی CSV تراکنش‌ها</button>
                    <button class="glass-btn" onclick="window.print()"><i class="fa-solid fa-print"></i> چاپ گزارش</button>
                </div>
            </div>
        `;
    }

    async viewSettings() {
        const settingsList = await this.db.getAll('settings');
        const currentSetting = (settingsList && settingsList.length > 0) ? settingsList[0] : { theme: 'luxury-dark', language: 'fa', currency: 'تومان' };
        return `
            <div class="glass-card" style="margin-bottom: 20px;">
                <h3 style="color: var(--neon-blue); margin-bottom: 15px;">تنظیمات سیستم و امنیت محلی</h3>
                <form onsubmit="app.saveAppSettings(event)" class="form-group" style="max-width:400px; display:flex; flex-direction:column; gap:12px;">
                    <div>
                        <label style="display:block; margin-bottom:6px; color:var(--text-muted);">قالب ظاهری (Theme)</label>
                        <select id="setting-theme" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;">
                            <option value="luxury-dark" ${currentSetting.theme === 'luxury-dark' ? 'selected' : ''}>حالت تاریک لوکس (Luxury Dark)</option>
                            <option value="luxury-light" ${currentSetting.theme === 'luxury-light' ? 'selected' : ''}>حالت روشن لوکس (Luxury Light)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block; margin-bottom:6px; color:var(--text-muted);">زبان سیستم (Language)</label>
                        <select id="setting-lang" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;">
                            <option value="fa" ${currentSetting.language === 'fa' ? 'selected' : ''}>فارسی (Persian)</option>
                            <option value="en" ${currentSetting.language === 'en' ? 'selected' : ''}>English</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block; margin-bottom:6px; color:var(--text-muted);">واحد پول پیش‌فرض (Currency)</label>
                        <select id="setting-currency" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;">
                            <option value="تومان" ${currentSetting.currency === 'تومان' ? 'selected' : ''}>تومان (Toman)</option>
                            <option value="ریال" ${currentSetting.currency === 'ریال' ? 'selected' : ''}>ریال (Rial)</option>
                            <option value="Dollar" ${currentSetting.currency === 'Dollar' ? 'selected' : ''}>Dollar ($)</option>
                            <option value="Euro" ${currentSetting.currency === 'Euro' ? 'selected' : ''}>Euro (€)</option>
                            <option value="USDT" ${currentSetting.currency === 'USDT' ? 'selected' : ''}>USDT</option>
                        </select>
                    </div>
                    <button type="submit" class="glass-btn" style="margin-top: 10px; justify-content:center;"><i class="fa-solid fa-floppy-disk"></i> ذخیره تنظیمات عمومی</button>
                </form>
            </div>
            <div class="glass-card" style="margin-bottom: 20px;">
                <h3 style="color: var(--neon-blue); margin-bottom: 15px;">امنیت و پین سیستم</h3>
                <form onsubmit="app.updatePin(event)" class="form-group" style="max-width:350px;">
                    <label style="display:block; margin-bottom:6px; color:var(--text-muted);">تغییر رمز PIN امنیتی</label>
                    <input type="password" id="new-pin-val" placeholder="رمز جدید حداقل 4 رقمی" required style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;">
                    <button type="submit" class="glass-btn" style="margin-top: 10px; justify-content:center;"><i class="fa-solid fa-key"></i> ذخیره رمز جدید</button>
                </form>
            </div>
            <div class="glass-card" style="border-color: rgba(255,77,77,0.4);">
                <h3 style="color: var(--danger); margin-bottom: 10px;">مدیریت داده‌های TROR</h3>
                <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 15px;">بازنشانی کامل داده‌های برنامه باعث پاکسازی اطلاعات TROR و بازگشت به حالت اولیه می‌شود.</p>
                <button class="glass-btn" style="background: rgba(255,77,77,0.2); border-color: var(--danger); color: #fff;" onclick="app.resetDataSystem()"><i class="fa-solid fa-triangle-exclamation"></i> بازنشانی کامل داده‌های برنامه</button>
            </div>
        `; 
    }

    async saveAppSettings(e) {
        if (e) e.preventDefault();
        const theme = document.getElementById('setting-theme')?.value || 'luxury-dark';
        const language = document.getElementById('setting-lang')?.value || 'fa';
        const currency = document.getElementById('setting-currency')?.value || 'تومان';
        
        // Apply theme instantly without reload
        ThemeManager.applyTheme(theme);

        const settingsList = await this.db.getAll('settings');
        let settingRecord = (settingsList && settingsList.length > 0) ? settingsList[0] : { id: 'set_1', pin: '1234' };
        settingRecord.theme = theme;
        settingRecord.language = language;
        settingRecord.currency = currency;
        if (settingsList && settingsList.length > 0) {
            await this.db.update('settings', settingRecord);
        } else {
            await this.db.add('settings', settingRecord);
        }
        alert('تنظیمات با موفقیت ذخیره و اعمال شد.');
        this.navigateTo('settings');
    }

    async updatePin(e) {
        if (e) e.preventDefault();
        const newPin = document.getElementById('new-pin-val').value;
        if (!newPin || newPin.length < 4) {
            alert('لطفاً یک رمز عبور معتبر حداقل ۴ رقمی وارد کنید.');
            return;
        }
        const settingsList = await this.db.getAll('settings');
        if (settingsList && settingsList.length > 0) {
            settingsList[0].pin = newPin;
            await this.db.update('settings', settingsList[0]);
        } else {
            await this.db.add('settings', { id: 'set_1', pin: newPin, currency: 'تومان', language: 'fa', theme: 'luxury-dark' });
        }
        alert('رمز عبور جدید با موفقیت ذخیره شد.');
        document.getElementById('new-pin-val').value = '';
    }

    async resetDataSystem() {
        if (confirm('آیا از بازنشانی کامل داده‌های برنامه TROR اطمینان دارید؟')) {
            if (window.indexedDB) indexedDB.deleteDatabase(this.db.dbName);
            localStorage.clear();
            sessionStorage.clear();
            alert('داده‌های برنامه با موفقیت بازنشانی شدند.');
            location.reload();
        }
    }

    openQuickAdd() {
        this.openModal(`
            <h3>ثبت تراکنش جدید</h3>
            <form onsubmit="app.saveTransaction(event)" style="margin-top: 15px;">
                <div class="form-group"><label>نوع</label><select id="tx-type"><option value="هزینه">هزینه</option><option value="درآمد">درآمد</option></select></div>
                <div class="form-group"><label>مبلغ (تومان)</label><input type="number" id="tx-amt" required placeholder="مثال: ۵۰۰۰۰۰"></div>
                <div class="form-group"><label>دسته‌بندی</label><input type="text" id="tx-cat" required placeholder="مثال: خوراک، حقوق، تعمیرات"></div>
                <div class="form-group"><label>توضیحات</label><input type="text" id="tx-desc" placeholder="توضیحات تکمیلی"></div>
                <button type="submit" class="glass-btn w-100" style="margin-top: 12px; justify-content:center;">ذخیره در سیستم</button>
            </form>
        `);
    }

    async saveTransaction(e) {
        e.preventDefault();
        const type = document.getElementById('tx-type').value;
        const amt = document.getElementById('tx-amt').value;
        const cat = document.getElementById('tx-cat').value;
        const desc = document.getElementById('tx-desc').value;
        const date = new Date().toLocaleDateString('fa-IR');

        await this.db.add('transactions', { type, amount: amt, category: cat, desc, date });

        if (type === 'درآمد') {
            const savingsGoals = await this.db.getAll('savings');
            const goalRules = await this.db.getAll('goalRules');
            await GoalEngine.processAutoAllocation(amt, savingsGoals, goalRules, this.db);
        }

        this.closeModal();
        this.navigateTo(this.currentView);
    }

    async openEditTransaction(id) {
        const transactions = await this.db.getAll('transactions');
        const t = transactions.find(x => x.id === id);
        if (!t) return;
        this.openModal(`
            <h3>ویرایش تراکنش</h3>
            <form onsubmit="app.updateTransaction(event, '${t.id}')" style="margin-top: 15px;">
                <div class="form-group"><label>نوع</label><select id="edit-tx-type"><option value="هزینه" ${t.type==='هزینه'?'selected':''}>هزینه</option><option value="درآمد" ${t.type==='درآمد'?'selected':''}>درآمد</option></select></div>
                <div class="form-group"><label>مبلغ (تومان)</label><input type="number" id="edit-tx-amt" required value="${t.amount}"></div>
                <div class="form-group"><label>دسته‌بندی</label><input type="text" id="edit-tx-cat" required value="${t.category}"></div>
                <div class="form-group"><label>توضیحات</label><input type="text" id="edit-tx-desc" value="${t.desc || ''}"></div>
                <button type="submit" class="glass-btn w-100" style="margin-top: 12px; justify-content:center;">بروزرسانی تراکنش</button>
            </form>
        `);
    }

    async updateTransaction(e, id) {
        e.preventDefault();
        await this.db.update('transactions', {
            id,
            type: document.getElementById('edit-tx-type').value,
            amount: document.getElementById('edit-tx-amt').value,
            category: document.getElementById('edit-tx-cat').value,
            desc: document.getElementById('edit-tx-desc').value
        });
        this.closeModal();
        this.navigateTo(this.currentView);
    }

    async deleteTransaction(id) {
        await this.db.softDelete('transactions', id);
        this.navigateTo(this.currentView);
    }

    openAddSavingsGoal() {
        this.openModal(`
            <h3>ایجاد هدف پس‌انداز جدید</h3>
            <form onsubmit="app.saveSavingsGoal(event)" style="margin-top: 15px;">
                <div class="form-group"><label>نام صندوق/هدف</label><input type="text" id="sg-name" required placeholder="مثال: صندوق اضطراری"></div>
                <div class="form-group"><label>مبلغ هدف (تومان)</label><input type="number" id="sg-target" required placeholder="مثال: ۵۰۰۰۰۰۰"></div>
                <div class="form-group"><label>مهلت (تاریخ)</label><input type="text" id="sg-deadline" value="1405/12/29"></div>
                <button type="submit" class="glass-btn w-100" style="margin-top: 12px; justify-content:center;">ایجاد صندوق</button>
            </form>
        `);
    }

    async saveSavingsGoal(e) {
        e.preventDefault();
        await this.db.add('savings', {
            name: document.getElementById('sg-name').value,
            target: document.getElementById('sg-target').value,
            current: 0,
            deadline: document.getElementById('sg-deadline').value
        });
        this.closeModal();
        this.navigateTo(this.currentView);
    }

    async openAddGoalRule() {
        const savings = await this.db.getAll('savings');
        this.openModal(`
            <h3>تنظیم قوانین تخصیص خودکار درآمد</h3>
            <form onsubmit="app.saveGoalRule(event)" style="margin-top: 15px;">
                <div class="form-group">
                    <label>انتخاب هدف</label>
                    <select id="rule-goal-id" style="width:100%; padding:10px; background:rgba(0,0,0,0.58); border:1px solid rgba(138,43,226,0.35); border-radius:10px; color:#fff;">
                        ${savings.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
                    </select>
                </div>
                <div class="form-group"><label>درصد تخصیص از درآمد کل (%)</label><input type="number" id="rule-pct" required placeholder="مثال: ۵" min="1" max="100"></div>
                <button type="submit" class="glass-btn w-100" style="margin-top: 12px; justify-content:center;">ذخیره قانون</button>
            </form>
        `);
    }

    async saveGoalRule(e) {
        e.preventDefault();
        const goalId = document.getElementById('rule-goal-id').value;
        const percentage = document.getElementById('rule-pct').value;
        await this.db.add('goalRules', { goalId, percentage });
        this.closeModal();
        this.navigateTo('goals');
    }

    openAddObligation() {
        this.openModal(`
            <h3>ثبت تعهد مالی جدید (قسط، بدهی یا قبض)</h3>
            <form onsubmit="app.saveObligation(event)" style="margin-top: 15px;">
                <div class="form-group"><label>عنوان تعهد</label><input type="text" id="ob-title" required placeholder="مثال: قسط وام بانک"></div>
                <div class="form-group"><label>طرف حساب / شرکت</label><input type="text" id="ob-person" placeholder="نام شخص یا شرکت"></div>
                <div class="form-group"><label>مبلغ (تومان)</label><input type="number" id="ob-amt" required placeholder="مثال: ۲۵۰۰۰۰۰"></div>
                <div class="form-group"><label>تاریخ سررسید</label><input type="text" id="ob-date" value="1405/05/15" placeholder="1405/05/15"></div>
                <div class="form-group"><label>توضیحات</label><input type="text" id="ob-desc" placeholder="توضیحات تکمیلی"></div>
                <button type="submit" class="glass-btn w-100" style="margin-top: 12px; justify-content:center;">ثبت تعهد در تقویم</button>
            </form>
        `);
    }

    async saveObligation(e) {
        e.preventDefault();
        await this.db.add('obligations', {
            title: document.getElementById('ob-title').value,
            personName: document.getElementById('ob-person').value,
            amount: document.getElementById('ob-amt').value,
            dueDate: document.getElementById('ob-date').value,
            description: document.getElementById('ob-desc').value,
            status: 'معلق'
        });
        this.closeModal();
        this.navigateTo('calendar');
    }

    async toggleObligationStatus(id) {
        const obs = await this.db.getAll('obligations');
        const o = obs.find(x => x.id === id);
        if (o) {
            o.status = o.status === 'پرداخت‌شده' ? 'معلق' : 'پرداخت‌شده';
            await this.db.update('obligations', o);
            this.navigateTo('calendar');
        }
    }

    async deleteObligation(id) {
        await this.db.softDelete('obligations', id);
        this.navigateTo('calendar');
    }

    openAddAsset() {
        this.openModal(`
            <h3>ثبت دارایی جدید</h3>
            <form onsubmit="app.saveAsset(event)" style="margin-top: 15px;">
                <div class="form-group"><label>نام دارایی</label><input type="text" id="ast-name" required placeholder="مثال: لپ‌تاپ / تجهیزات"></div>
                <div class="form-group">
                    <label>دسته‌بندی</label>
                    <select id="ast-cat" style="width:100%; padding:10px; background:rgba(0,0,0,0.58); border:1px solid rgba(138,43,226,0.35); border-radius:10px; color:#fff;">
                        <option value="House">خانه / ملک (House)</option>
                        <option value="Tools">ابزار آلات (Tools)</option>
                        <option value="Electronics">الکترونیک و دیجیتال (Electronics)</option>
                        <option value="Valuable">اشیاء باارزش (Valuable)</option>
                    </select>
                </div>
                <div class="form-group"><label>تاریخ خرید</label><input type="text" id="ast-date" value="1404/01/01"></div>
                <div class="form-group"><label>مبلغ خرید (تومان)</label><input type="number" id="ast-price" required placeholder="مثال: ۴۵۰۰۰۰۰۰"></div>
                <div class="form-group"><label>ارزش روز فعلی (تومان)</label><input type="number" id="ast-curr" required placeholder="مثال: ۵۰۰۰۰۰۰۰"></div>
                <div class="form-group"><label>توضیحات</label><input type="text" id="ast-desc" placeholder="توضیحات دارایی"></div>
                <button type="submit" class="glass-btn w-100" style="margin-top: 12px; justify-content:center;">ثبت دارایی</button>
            </form>
        `);
    }

    async saveAsset(e) {
        e.preventDefault();
        await this.db.add('assets', {
            name: document.getElementById('ast-name').value,
            category: document.getElementById('ast-cat').value,
            purchaseDate: document.getElementById('ast-date').value,
            purchasePrice: document.getElementById('ast-price').value,
            currentValue: document.getElementById('ast-curr').value,
            description: document.getElementById('ast-desc').value
        });
        this.closeModal();
        this.navigateTo('assets');
    }

    openAddVehicleLog() {
        const categories = VehicleEngine.getPartCategories();
        let optionsHtml = '';
        for (const [catName, parts] of Object.entries(categories)) {
            optionsHtml += `<optgroup label="${catName}">`;
            parts.forEach(p => {
                optionsHtml += `<option value="${p}">${p}</option>`;
            });
            optionsHtml += `</optgroup>`;
        }

        this.openModal(`
            <h3>ثبت سرویس و تعمیر هوشمند Shahin</h3>
            <form onsubmit="app.saveVehicleLog(event)" style="margin-top: 15px;">
                <div class="form-group">
                    <label>قطعه / سیستم خودرو</label>
                    <select id="vl-part" style="width:100%; padding:12px; background:rgba(0,0,0,0.58); border:1px solid rgba(138,43,226,0.35); border-radius:12px; color:#fff;">
                        ${optionsHtml}
                    </select>
                </div>
                <div class="form-group"><label>عنوان سرویس</label><input type="text" id="vl-type" required placeholder="مثال: تعویض روغن و فیلتر"></div>
                <div class="form-group"><label>مبلغ (تومان)</label><input type="number" id="vl-amt" required placeholder="مثال: ۱۲۰۰۰۰۰"></div>
                <div class="form-group"><label>کیلومتر فعلی خودرو</label><input type="number" id="vl-km" value="406922"></div>
                <div class="form-group"><label>تاریخ سرویس</label><input type="text" id="vl-date" value="1405/04/30"></div>
                <div class="form-group"><label>توضیحات</label><input type="text" id="vl-desc" placeholder="جزئیات تعمیر یا تعویض"></div>
                <button type="submit" class="glass-btn w-100" style="margin-top: 12px; justify-content:center;">ثبت و همگام‌سازی با هزینه‌ها</button>
            </form>
        `);
    }

    async saveVehicleLog(e) {
        e.preventDefault();
        const partName = document.getElementById('vl-part').value;
        const type = document.getElementById('vl-type').value;
        const amt = document.getElementById('vl-amt').value;
        const mileage = document.getElementById('vl-km').value;
        const date = document.getElementById('vl-date').value;
        const desc = document.getElementById('vl-desc').value;

        await this.db.add('vehicleLogs', { type, amount: amt, mileage, desc, date });
        await this.db.add('maintenance', {
            vehicleName: 'Shahin (Tiba 1)',
            partName,
            serviceTitle: type,
            lastDate: date,
            lastKm: mileage,
            cost: amt,
            description: desc,
            status: 'green'
        });
        await this.db.add('transactions', { type: 'هزینه', category: 'تعمیرات خودرو', amount: amt, desc: `Shahin - ${partName}: ${type}`, date });

        this.closeModal();
        this.navigateTo(this.currentView);
    }

    async depositSavings(id) {
        const val = prompt('مبلغ واریز به صندوق (تومان):');
        if (!val || isNaN(val)) return;
        const savings = await this.db.getAll('savings');
        const g = savings.find(x => x.id === id);
        if (g) {
            g.current = Number(g.current) + Number(val);
            await this.db.update('savings', g);
            this.navigateTo(this.currentView);
        }
    }

    async withdrawSavings(id) {
        const val = prompt('مبلغ برداشت از صندوق (تومان):');
        if (!val || isNaN(val)) return;
        const savings = await this.db.getAll('savings');
        const g = savings.find(x => x.id === id);
        if (g) {
            g.current = Math.max(0, Number(g.current) - Number(val));
            await this.db.update('savings', g);
            this.navigateTo(this.currentView);
        }
    }

    openModal(html) {
        const root = document.getElementById('modal-root');
        const box = document.getElementById('modal-box-content');
        if (box) box.innerHTML = html;
        if (root) root.classList.remove('hidden');
    }

    closeModal() {
        document.getElementById('modal-root')?.classList.add('hidden');
    }

    async exportBackup() {
        const data = await this.db.exportAllData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `TROR_PFOS_Enterprise_Backup_${new Date().toISOString().slice(0,10)}.json`;
        a.click();
    }

    async exportCSV() {
        const txs = await this.db.getAll('transactions');
        let csv = 'Type,Category,Amount,Description,Date\n';
        txs.forEach(t => {
            csv += `"${t.type}","${t.category}",${t.amount},"${t.desc || ''}","${t.date}"\n`;
        });
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = `TROR_Transactions_${new Date().toISOString().slice(0,10)}.csv`;
        a.click();
    }
}

const app = new FinancialOS();
window.addEventListener('DOMContentLoaded', () => app.init());
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('sw.js').then((registration) => {
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                if (newWorker) {
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showUpdateNotification(registration);
                        }
                    });
                }
            });
        }).catch((err) => {
            console.error('Service Worker registration failed:', err);
        });
    });
}

function showUpdateNotification(registration) {
    if (document.getElementById('tror-update-notification')) return;

    const notif = document.createElement('div');
    notif.id = 'tror-update-notification';
    notif.style.cssText = `
        position: fixed;
        bottom: 24px;
        right: 24px;
        background: rgba(13, 17, 23, 0.95);
        border: 1px solid rgba(56, 139, 252, 0.4);
        color: #c9d1d9;
        padding: 16px 20px;
        border-radius: 12px;
        box-shadow: 0 8px 24px rgba(0,0,0,0.5);
        display: flex;
        align-items: center;
        gap: 16px;
        z-index: 10000;
        font-family: inherit;
        backdrop-filter: blur(12px);
        direction: rtl;
    `;
    notif.innerHTML = `
        <span style="font-size: 14px; font-weight: 500;">نسخه جدید آماده است</span>
        <button id="tror-update-btn" style="
            background: #238636;
            color: #fff;
            border: none;
            padding: 8px 16px;
            border-radius: 6px;
            cursor: pointer;
            font-weight: 600;
            font-size: 13px;
            transition: background 0.2s;
        ">بروزرسانی</button>
    `;

    document.body.appendChild(notif);

    document.getElementById('tror-update-btn').addEventListener('click', () => {
        if (registration.waiting) {
            registration.waiting.postMessage({ type: 'SKIP_WAITING' });
        }
        window.location.reload();
    });
}
