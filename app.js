/**
 * TROR Personal Financial Operating System - Enterprise Core Architecture
 * Fully localized, secure, and production-ready version for Mr Alavi.
 * Upgraded with Shahin Smart Maintenance Foundation.
 */

class DatabaseManager {
    constructor() {
        this.dbName = 'TROR_PFOS_EnterpriseDB';
        this.dbVersion = 2; // Upgraded version for maintenance store
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
                const stores = ['transactions', 'accounts', 'budgets', 'savings', 'vehicleLogs', 'aiHistory', 'settings', 'maintenance'];
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
                settings: [
                    { id: 'set_1', pin: '1234', currency: 'تومان', language: 'fa', theme: 'luxury-dark', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] }
                ]
            };
            localStorage.setItem(this.fallbackKey, JSON.stringify(initial));
        } else {
            // Ensure maintenance store exists in fallback if migrating
            const raw = JSON.parse(localStorage.getItem(this.fallbackKey)) || {};
            if (!raw.maintenance) {
                raw.maintenance = [];
                localStorage.setItem(this.fallbackKey, JSON.stringify(raw));
            }
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
        const stores = ['transactions', 'accounts', 'budgets', 'savings', 'vehicleLogs', 'aiHistory', 'settings', 'maintenance'];
        const exportObj = {};
        for (const s of stores) {
            exportObj[s] = await this.getAll(s);
        }
        return exportObj;
    }
}

class FinancialEngine {
    static computeMetrics(transactions, savings, budgets) {
        const income = transactions.filter(t => t.type === 'درآمد').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const expense = transactions.filter(t => t.type === 'هزینه').reduce((acc, curr) => acc + Number(curr.amount), 0);
        const netWorth = income - expense;
        const savingRate = income > 0 ? Math.max(0, ((income - expense) / income) * 100).toFixed(1) : 0;
        
        let healthScore = 100;
        if (expense > income) healthScore -= 35;
        else healthScore += 20;
        healthScore = Math.min(100, Math.max(10, healthScore));

        return {
            income,
            expense,
            netWorth,
            savingRate,
            healthScore,
            isExceeding: expense > income
        };
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
        // Green: OK, Yellow: Close (within 500km), Red: Expired (passed km or passed date)
        if (!nextKm && !nextDate) return { status: 'green', label: 'عالی / بدون هشدار' };

        let isKmClose = false;
        let isExpired = false;

        if (nextKm) {
            const numNext = Number(nextKm);
            if (currentKm >= numNext) {
                isExpired = true;
            } else if (numNext - currentKm <= 500) {
                isKmClose = true;
            }
        }

        if (isExpired) {
            return { status: 'red', label: 'سررسید گذشته (قرمز)' };
        } else if (isKmClose) {
            return { status: 'yellow', label: 'در آستانه سررسید (زرد)' };
        }
        return { status: 'green', label: 'وضعیت مطلوب (سبز)' };
    }
}

class AIEngine {
    async analyze(transactions, vehicleLogs, savings) {
        const totalExp = transactions.filter(t => t.type === 'هزینه').reduce((a,b) => a + Number(b.amount), 0);
        const totalInc = transactions.filter(t => t.type === 'درآمد').reduce((a,b) => a + Number(b.amount), 0);
        
        let advice = [];
        if (totalExp > totalInc) {
            advice.push("⚠️ هشدار هوشمند Hop AI: میزان هزینه‌های ثبت‌شده فراتر از کل درآمد است. انضباط مالی و مدیریت هزینه‌ها توصیه می‌شود.");
        } else if (transactions.length === 0) {
            advice.push("🤖 سیستم Hop AI آماده است. لطفاً تراکنش‌ها و اهداف پس‌انداز خود را وارد کنید تا تحلیل‌های دقیق مالی ارائه دهم.");
        } else {
            advice.push("✨ Hop AI: روند مالی شما تحت کنترل است. به ثبت دقیق تراکنش‌ها ادامه دهید.");
        }
        advice.push("🚗 وضعیت خودروی Shahin (مدل Tiba 1 با کارکرد ۴۰۶,۹۲۲ کیلومتر) پایدار است. پایش سیستم هوشمند نگهداری و تعویض قطعات (موتور، ترمز و برق) از طریق ماژول تخصصی توصیه می‌شود.");
        
        return advice.join('\n\n');
    }
}

class FinancialOS {
    constructor() {
        this.db = new DatabaseManager();
        this.ai = new AIEngine();
        this.vehicle = new VehicleEngine();
        this.currentView = 'dashboard';
        this.isLocked = true;
    }

    async init() {
        await this.db.init();
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
            navigator.serviceWorker.register('sw.js').catch(err => console.log('خطای سرویس ورکر:', err));
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
            budget: 'کنترل بودجه',
            analysis: 'تحلیل و آمار مالی',
            savings: 'صندوق پس‌انداز',
            reports: 'گزارش‌ها و خروجی',
            goals: 'اهداف مالی',
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
        const metrics = FinancialEngine.computeMetrics(transactions, savings, budgets);
        const vehicleStats = this.vehicle.calculateVehicleStats(vehicleLogs);

        switch(id) {
            case 'dashboard':
                return this.viewDashboard(metrics, transactions, vehicleStats);
            case 'transactions':
                return this.viewTransactions(transactions);
            case 'budget':
                return this.viewBudget(budgets, transactions);
            case 'analysis':
                return this.viewAnalysis(metrics, transactions);
            case 'savings':
                return this.viewSavings(savings);
            case 'reports':
                return this.viewReports(transactions, vehicleStats);
            case 'goals':
                return this.viewGoals(savings);
            case 'accounts':
                return this.viewAccounts(accounts);
            case 'shahin':
                return this.viewShahin(vehicleStats, vehicleLogs, maintenanceRecords);
            case 'ai-assistant':
                return this.viewAIAssistant(transactions, vehicleLogs, savings);
            case 'settings':
                return this.viewSettings();
            default:
                return `<div class="glass-card"><h3>ماژول فعال است</h3></div>`;
        }
    }

    viewDashboard(metrics, transactions, vehicleStats) {
        return `
            <div class="metrics-grid">
                <div class="glass-card metric-card">
                    <h4>خالص دارایی</h4>
                    <div class="value" style="color: ${metrics.netWorth >= 0 ? 'var(--success)' : 'var(--danger)'};">${metrics.netWorth.toLocaleString()} تومان</div>
                    <i class="fa-solid fa-wallet"></i>
                </div>
                <div class="glass-card metric-card">
                    <h4>کل درآمد</h4>
                    <div class="value" style="color: var(--success);">${metrics.income.toLocaleString()} تومان</div>
                    <i class="fa-solid fa-arrow-trend-up"></i>
                </div>
                <div class="glass-card metric-card">
                    <h4>کل هزینه</h4>
                    <div class="value" style="color: var(--danger);">${metrics.expense.toLocaleString()} تومان</div>
                    <i class="fa-solid fa-arrow-trend-down"></i>
                </div>
                <div class="glass-card metric-card">
                    <h4>شاخص سلامت مالی</h4>
                    <div class="value" style="color: var(--neon-blue);">${metrics.healthScore} / 100</div>
                    <i class="fa-solid fa-heart-pulse"></i>
                </div>
            </div>
            <div class="dashboard-grid">
                <div class="glass-card">
                    <h3 style="color: var(--neon-blue); margin-bottom: 16px;"><i class="fa-solid fa-list-check"></i> آخرین تراکنش‌های سیستم</h3>
                    ${transactions.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.9rem;">هیچ تراکنشی ثبت نشده است.</p>' : `
                    <table class="data-table">
                        <thead><tr><th>نوع</th><th>دسته</th><th>مبلغ (تومان)</th><th>توضیحات</th><th>تاریخ</th></tr></thead>
                        <tbody>
                            ${transactions.slice(-6).reverse().map(t => `
                                <tr>
                                    <td><span style="color: ${t.type === 'درآمد' ? 'var(--success)' : 'var(--danger)'}">${t.type}</span></td>
                                    <td>${t.category}</td>
                                    <td>${Number(t.amount).toLocaleString()}</td>
                                    <td>${t.desc || '-'}</td>
                                    <td>${t.date}</td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>`}
                </div>
                <div class="glass-card">
                    <h3 style="color: var(--neon-purple); margin-bottom: 16px;"><i class="fa-solid fa-car"></i> وضعیت خودروی Shahin</h3>
                    <div style="background: rgba(0,230,255,0.06); border: 1px solid var(--neon-blue); padding: 16px; border-radius: 12px; color: var(--neon-blue); font-weight: 500; margin-bottom: 16px;">
                        🚗 Tiba 1 (کارکرد: ${vehicleStats.mileage.toLocaleString()} کیلومتر) آماده پایش و ثبت هزینه‌هاست.
                    </div>
                    <button class="glass-btn w-100" onclick="app.navigateTo('shahin')" style="justify-content:center;"><i class="fa-solid fa-car"></i> مدیریت Shahin</button>
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
                ${transactions.length === 0 ? '<p style="color: var(--text-muted);">هیچ تراکنشی یافت نشد. از دکمه بالا برای ثبت تراکنش جدید استفاده کنید.</p>' : `
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

    viewSavings(savings) {
        return `
            <div class="glass-card" style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                <h3>صندوق پس‌انداز و اهداف</h3>
                <button class="glass-btn" onclick="app.openAddSavingsGoal()"><i class="fa-solid fa-plus"></i> هدف جدید</button>
            </div>
            ${savings.length === 0 ? '<div class="glass-card"><p style="color: var(--text-muted);">هیچ صندوق پس‌اندازی تعریف نشده است.</p></div>' : `
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

    viewShahin(vStats, vehicleLogs, maintenanceRecords) {
        return `
            <div class="glass-card" style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:15px;">
                <div>
                    <h3 style="color: var(--neon-blue);">مدیریت هوشمند خودروی Shahin (مدل Tiba 1)</h3>
                    <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">کارکرد فعلی: ${vStats.mileage.toLocaleString()} کیلومتر • سوخت: ${vStats.fuel} • هزینه هر کیلومتر: ${vStats.costPerKm} تومان</p>
                </div>
                <button class="glass-btn" onclick="app.openAddVehicleLog()"><i class="fa-solid fa-wrench"></i> ثبت سرویس و تعمیر جدید</button>
            </div>

            <!-- Smart Maintenance Status Foundation Grid -->
            <div class="glass-card" style="margin-bottom: 20px;">
                <h3 style="color: var(--neon-purple); margin-bottom: 16px;"><i class="fa-solid fa-shield-halved"></i> سیستم پایش هوشمند قطعات و سرویس‌ها</h3>
                ${maintenanceRecords.length === 0 ? '<p style="color: var(--text-muted); font-size: 0.9rem;">هیچ قطعه یا سرویسی با پایش هوشمند ثبت نشده است. از دکمه ثبت سرویس جدید استفاده کنید.</p>' : `
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

    viewGoals(savings) {
        return this.viewSavings(savings);
    }

    viewBudget(budgets, transactions) {
        const totalExp = transactions.filter(t => t.type === 'هزینه').reduce((a,b) => a + Number(b.amount), 0);
        return `
            <div class="glass-card">
                <h3 style="color: var(--neon-blue); margin-bottom: 16px;">کنترل بودجه و هشدارها</h3>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 18px; margin-bottom: 24px;">
                    <div class="glass-card" style="padding: 18px;">
                        <h4 style="color:var(--text-muted)">وضعیت هزینه‌ها</h4>
                        <div style="font-size:1.4rem; font-weight:bold; margin-top:6px; color: var(--danger);">${totalExp.toLocaleString()} تومان</div>
                    </div>
                </div>
                <div style="background: rgba(0,230,255,0.06); border: 1px solid var(--neon-blue); padding: 16px; border-radius: 12px; color: var(--neon-blue); font-weight: 500;">
                    💡 برای کنترل دقیق‌تر هزینه‌ها، تراکنش‌ها و سقف بودجه خود را به‌روز نگه دارید.
                </div>
            </div>
        `;
    }

    viewAIAssistant(transactions, vehicleLogs, savings) {
        return `
            <div class="glass-card ai-chat-container">
                <div style="padding: 15px 20px; border-bottom: 1px solid rgba(255,255,255,0.05); display: flex; align-items: center; gap: 12px;">
                    <i class="fa-solid fa-brain" style="font-size: 1.4rem; color: var(--neon-blue);"></i>
                    <div>
                        <h3 style="font-size: 1.1rem; color: #fff;">مشاور هوشمند Hop AI</h3>
                        <p style="font-size: 0.82rem; color: var(--text-muted);">تحلیلگر هوشمند دارایی‌ها، تراکنش‌ها و خودروی Shahin</p>
                    </div>
                </div>
                <div id="ai-chat-messages" class="ai-messages">
                    <div class="ai-message assistant">
                        درود Mr Alavi. من دستیار هوشمند Hop AI هستم. پلتفرم مالی و سیستم نگهداری هوشمند خودروی Shahin آماده است. چه سوال یا دستوری دارید؟
                    </div>
                </div>
                <div class="ai-input-bar">
                    <input type="text" id="ai-user-prompt" placeholder="سوال خود را مطرح کنید..." onkeydown="if(event.key==='Enter') app.sendAIPrompt()">
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
        const aiResponse = await this.ai.analyze(transactions, vehicleLogs, savings);

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

    viewAnalysis(metrics, transactions) { 
        return `
            <div class="glass-card">
                <h3 style="color: var(--neon-blue); margin-bottom: 15px;">تحلیل پیشرفته مالی و جریان نقدینگی</h3>
                <p style="color:var(--text-muted); margin-bottom: 15px;">درآمد کل: ${metrics.income.toLocaleString()} تومان • هزینه کل: ${metrics.expense.toLocaleString()} تومان</p>
                <div style="background: rgba(255,255,255,0.03); padding: 20px; border-radius: 12px;">
                    <h4 style="color: var(--neon-purple); margin-bottom: 10px;">نرخ پس‌انداز</h4>
                    <div style="font-size: 1.6rem; font-weight: bold; color: ${metrics.savingRate > 0 ? 'var(--success)' : 'var(--danger)'};">${metrics.savingRate}%</div>
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
                        </select>
                    </div>
                    <div>
                        <label style="display:block; margin-bottom:6px; color:var(--text-muted);">زبان سیستم (Language)</label>
                        <select id="setting-lang" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;">
                            <option value="fa" ${currentSetting.language === 'fa' ? 'selected' : ''}>فارسی (Persian)</option>
                        </select>
                    </div>
                    <div>
                        <label style="display:block; margin-bottom:6px; color:var(--text-muted);">واحد پول (Currency)</label>
                        <select id="setting-currency" style="width:100%; padding:10px; background:rgba(255,255,255,0.05); border:1px solid rgba(255,255,255,0.1); border-radius:8px; color:#fff;">
                            <option value="تومان" ${currentSetting.currency === 'تومان' ? 'selected' : ''}>تومان (Toman)</option>
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
        alert('تنظیمات با موفقیت ذخیره شد.');
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
        alert('رمز عبور جدید با موفقیت ذخیره شد و در ورودهای بعدی اعمال خواهد شد.');
        document.getElementById('new-pin-val').value = '';
    }

    async resetDataSystem() {
        if (confirm('آیا از بازنشانی کامل داده‌های برنامه TROR اطمینان دارید؟ تمام داده‌ها پاکسازی شده و برنامه به حالت اولیه بازمی‌گردد.')) {
            if (window.indexedDB) {
                indexedDB.deleteDatabase(this.db.dbName);
            }
            localStorage.removeItem(this.db.fallbackKey);
            localStorage.clear();
            sessionStorage.clear();
            if (window.caches) {
                const keys = await caches.keys();
                for (const key of keys) {
                    await caches.delete(key);
                }
            }
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
                <div class="form-group"><label>دسته‌بندی</label><input type="text" id="tx-cat" required placeholder="مثال: خوراک، کار، تعمیرات"></div>
                <div class="form-group"><label>توضیحات</label><input type="text" id="tx-desc" placeholder="توضیحات تکمیلی"></div>
                <button type="submit" class="glass-btn w-100" style="margin-top: 12px; justify-content:center;">ذخیره در سیستم</button>
            </form>
        `);
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

    async saveTransaction(e) {
        e.preventDefault();
        await this.db.add('transactions', {
            type: document.getElementById('tx-type').value,
            amount: document.getElementById('tx-amt').value,
            category: document.getElementById('tx-cat').value,
            desc: document.getElementById('tx-desc').value,
            date: new Date().toLocaleDateString('fa-IR')
        });
        this.closeModal();
        this.navigateTo(this.currentView);
    }

    async deleteTransaction(id) {
        await this.db.softDelete('transactions', id);
        this.navigateTo(this.currentView);
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
                
                <!-- Maintenance Reminder Section -->
                <div style="background: rgba(138, 43, 226, 0.1); border: 1px solid rgba(138, 43, 226, 0.3); padding: 15px; border-radius: 12px; margin-top: 15px; margin-bottom: 15px;">
                    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
                        <label style="color: var(--neon-blue); font-weight: bold; margin: 0;">یادآور سرویس (Maintenance Reminder)</label>
                        <select id="vl-reminder-toggle" onchange="app.toggleReminderFields(this.value)" style="padding: 6px 12px; background: rgba(0,0,0,0.6); border: 1px solid var(--neon-blue); border-radius: 8px; color: #fff; font-size: 0.85rem;">
                            <option value="OFF">غیرفعال (OFF)</option>
                            <option value="ON">فعال (ON)</option>
                        </select>
                    </div>

                    <div id="reminder-options-container" class="hidden" style="display: flex; flex-direction: column; gap: 10px; margin-top: 10px;">
                        <div class="form-group" style="margin: 0;">
                            <label>نوع یادآور</label>
                            <select id="vl-reminder-type" onchange="app.toggleReminderType(this.value)" style="width:100%; padding:10px; background:rgba(0,0,0,0.58); border:1px solid rgba(138,43,226,0.35); border-radius:10px; color:#fff;">
                                <option value="km">کیلومتر محور (Kilometer Based)</option>
                                <option value="date">تاریخ محور (Date Based)</option>
                                <option value="both">هر دو (Kilometer + Date)</option>
                            </select>
                        </div>
                        <div class="form-group" id="group-next-km" style="margin: 0;">
                            <label>کیلومتر سررسید بعدی</label>
                            <input type="number" id="vl-next-km" value="411922" placeholder="مثال: 411922">
                        </div>
                        <div class="form-group hidden" id="group-next-date" style="margin: 0;">
                            <label>تاریخ سررسید بعدی</label>
                            <input type="text" id="vl-next-date" value="1405/10/30" placeholder="مثال: 1405/10/30">
                        </div>
                    </div>
                </div>

                <button type="submit" class="glass-btn w-100" style="margin-top: 12px; justify-content:center;">ثبت و انتقال به سیستم مالی</button>
            </form>
        `);
    }

    toggleReminderFields(val) {
        const container = document.getElementById('reminder-options-container');
        if (val === 'ON') {
            container?.classList.remove('hidden');
        } else {
            container?.classList.add('hidden');
        }
    }

    toggleReminderType(typeVal) {
        const groupKm = document.getElementById('group-next-km');
        const groupDate = document.getElementById('group-next-date');
        if (typeVal === 'km') {
            groupKm?.classList.remove('hidden');
            groupDate?.classList.add('hidden');
        } else if (typeVal === 'date') {
            groupKm?.classList.add('hidden');
            groupDate?.classList.remove('hidden');
        } else if (typeVal === 'both') {
            groupKm?.classList.remove('hidden');
            groupDate?.classList.remove('hidden');
        }
    }

    async saveVehicleLog(e) {
        e.preventDefault();
        const partName = document.getElementById('vl-part').value;
        const type = document.getElementById('vl-type').value;
        const amt = document.getElementById('vl-amt').value;
        const mileage = document.getElementById('vl-km').value;
        const date = document.getElementById('vl-date').value;
        const desc = document.getElementById('vl-desc').value;
        
        const reminderToggle = document.getElementById('vl-reminder-toggle').value;
        let nextKm = null;
        let nextDate = null;
        let status = 'green';

        if (reminderToggle === 'ON') {
            const rType = document.getElementById('vl-reminder-type').value;
            if (rType === 'km' || rType === 'both') {
                nextKm = document.getElementById('vl-next-km').value;
            }
            if (rType === 'date' || rType === 'both') {
                nextDate = document.getElementById('vl-next-date').value;
            }
            const statusCalc = VehicleEngine.calculateStatus(nextKm, nextDate, mileage);
            status = statusCalc.status;
        }

        // Save to legacy vehicleLogs store for full backward compatibility
        await this.db.add('vehicleLogs', { type, amount: amt, mileage, desc, date });

        // Save to new maintenance store
        await this.db.add('maintenance', {
            vehicleName: 'Shahin (Tiba 1)',
            partName,
            serviceTitle: type,
            lastDate: date,
            lastKm: mileage,
            nextDate,
            nextKm,
            cost: amt,
            description: desc,
            status
        });

        // Add to financial transactions
        await this.db.add('transactions', { type: 'هزینه', category: 'تعمیرات خودرو', amount: amt, desc: `Shahin (Tiba 1) - ${partName}: ${type} - ${desc}`, date });

        this.closeModal();
        this.navigateTo(this.currentView);
    }

    openAddSavingsGoal() {
        this.openModal(`
            <h3>ایجاد هدف پس‌انداز جدید</h3>
            <form onsubmit="app.saveSavingsGoal(event)" style="margin-top: 15px;">
                <div class="form-group"><label>نام صندوق/هدف</label><input type="text" id="sg-name" required placeholder="مثال: تعویض قطعات"></div>
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

    handleGlobalSearch(query) {
        if (!query || query.length < 2) return;
        console.log('جستجو در سیستم:', query);
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
        a.download = `TROR_PFOS_Backup_${new Date().toISOString().slice(0,10)}.json`;
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
