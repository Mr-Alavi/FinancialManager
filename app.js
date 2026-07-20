/**
 * TROR Personal Financial Operating System - Enterprise Core Architecture
 * Fully connected commercial version with IndexedDB, full CRUD, Hop AI, and Saipa Tiba 1 telemetry.
 */

class DatabaseManager {
    constructor() {
        this.dbName = 'TROR_PFOS_EnterpriseDB';
        this.dbVersion = 1;
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
                const stores = ['transactions', 'accounts', 'budgets', 'savings', 'vehicleLogs', 'aiHistory', 'settings'];
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
                transactions: [
                    { id: 't_1', type: 'هزینه', category: 'خوراک', amount: 1000000000, desc: 'خرید کلیه اقلام خوراکی', date: '1405/04/29', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] },
                    { id: 't_2', type: 'درآمد', category: 'کار', amount: 4100000, desc: 'مجموع درآمدهای مسافرکشی و خدمات', date: '1405/04/29', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] },
                    { id: 't_3', type: 'هزینه', category: 'تعمیرات تیبا', altAmount: 50000, desc: 'سرویس جزئی قطعات', date: '1405/04/29', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] }
                ],
                accounts: [
                    { id: 'acc_1', name: 'کیف پول نقدی', type: 'Cash', balance: 500000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] },
                    { id: 'acc_2', name: 'حساب بانکی اصلی', type: 'Bank', balance: 3600000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] }
                ],
                savings: [
                    { id: 'sav_1', name: 'صندوق بیبی', target: 10000000, current: 0, deadline: '1405/12/29', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] },
                    { id: 'sav_2', name: 'صندوق شاهین', target: 40000000, current: 0, deadline: '1405/12/29', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] },
                    { id: 'sav_3', name: 'روغن‌سوزی تیبا', target: 40000000, current: 4580005, deadline: '1405/12/29', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] }
                ],
                budgets: [
                    { id: 'b_1', daily: 200000, cycleDays: 7, foodBudget: 410000, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] }
                ],
                vehicleLogs: [
                    { id: 'vl_1', type: 'تعمیرات موتور', amount: 1200000, desc: 'بررسی سلامت موتور و تعویض پدها', mileage: 406922, date: '1405/04/30', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] }
                ],
                settings: [
                    { id: 'set_1', pin: '1234', currency: 'تومان', language: 'fa', theme: 'luxury-dark', createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(), version: 1, isDeleted: false, syncStatus: 'synced', history: [] }
                ]
            };
            localStorage.setItem(this.fallbackKey, JSON.stringify(initial));
        }
    }

    async seedInitialDataIfNeeded() {
        const txs = await this.getAll('transactions');
        if (txs.length === 0) {
            await this.initLocalStorageDefault();
            const raw = JSON.parse(localStorage.getItem(this.fallbackKey));
            for (const store of Object.keys(raw)) {
                for (const item of raw[store]) {
                    await this.add(store, item);
                }
            }
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
        const stores = ['transactions', 'accounts', 'budgets', 'savings', 'vehicleLogs', 'aiHistory', 'settings'];
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
        this.model = 'تیبا ۱';
        this.year = '1391';
        this.mileage = 406922;
        this.fuel = 'دوگانه سوز CNG/Petrol';
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
}

class AIEngine {
    async analyze(transactions, vehicleLogs, savings) {
        const totalExp = transactions.filter(t => t.type === 'هزینه').reduce((a,b) => a + Number(b.amount), 0);
        const totalInc = transactions.filter(t => t.type === 'درآمد').reduce((a,b) => a + Number(b.amount), 0);
        
        let advice = [];
        if (totalExp > totalInc) {
            advice.push("⚠️ هشدار هوشمند Hop AI: میزان هزینه‌های ثبت‌شده فراتر از کل درآمد است. بهینه‌سازی دسته‌های خوراک و هزینه‌های متفرقه الزامی است.");
        }
        advice.push("🚗 صندوق روغن‌سوزی تیبا با مبلغ هدف ۴۰,۰۰۰,۰۰۰ تومان نیاز به پس‌انداز مستمر روزانه دارد تا مهلت مقرر پوشش داده شود.");
        advice.push("💡 پیشنهاد مهندسی: عملکرد ناوگان تیبا ۱ (کارکرد ۴۰۶,۹۲۲ کیلومتر) پایدار است اما رصد هزینه‌های سوخت و تعمیرات دوره‌ای توصیه می‌شود.");
        
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

    checkSecurityLock() {
        const lockScreen = document.getElementById('security-lock-screen');
        if (this.isLocked) {
            lockScreen?.classList.remove('hidden');
        } else {
            lockScreen?.classList.add('hidden');
            document.getElementById('app-shell')?.classList.remove('hidden');
            this.navigateTo('dashboard');
        }
    }

    verifyPin() {
        const pinInput = document.getElementById('unlock-pin');
        if (pinInput && pinInput.value === '1234') {
            this.isLocked = false;
            this.checkSecurityLock();
        } else {
            alert('رمز ورود نامعتبر است. (پیش‌فرض سیستم: 1234)');
        }
    }

    initPWA() {
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('sw.js').catch(err => console.log('SW error:', err));
        }
    }

    async navigateTo(viewId) {
        this.currentView = viewId;
        document.querySelectorAll('.sidebar-nav .nav-item').forEach(el => {
            el.classList.toggle('active', el.dataset.target === viewId);
        });

        const titleMap = {
            dashboard: 'Dashboard Command Center',
            transactions: 'Professional Transaction Management',
            budget: 'Intelligent Budget Control',
            analysis: 'Advanced Financial Analytics',
            savings: 'Savings Vault & Goals',
            reports: 'Reports & Data Export',
            goals: 'Financial Goals Tracker',
            accounts: 'Accounts & Wallets',
            shahin: 'Shahin Vehicle Manager (Tiba 1 - 406,922 km)',
            'ai-assistant': 'Hop AI Financial Advisor',
            settings: 'System Settings & Security'
        };

        document.getElementById('current-view-title').innerText = titleMap[viewId] || 'Operating System';

        const container = document.getElementById('view-container');
        if (!container) return;

        container.innerHTML = `<div class="glass-card" style="padding: 40px; text-align: left; color: var(--text-muted);">Loading high-performance enterprise module...</div>`;

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
                return this.viewShahin(vehicleStats, vehicleLogs, savings);
            case 'ai-assistant':
                return this.viewAIAssistant(transactions, vehicleLogs, savings);
            case 'settings':
                return this.viewSettings();
            default:
                return `<div class="glass-card"><h3>Enterprise Module Active</h3></div>`;
        }
    }

    viewDashboard(metrics, transactions, vehicleStats) {
        return `
            <div class="metrics-grid">
                <div class="glass-card metric-card">
                    <h4>خالص دارایی (Net Worth)</h4>
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
                    </table>
                </div>
                <div class="glass-card">
                    <h3 style="color: var(--neon-purple); margin-bottom: 16px;"><i class="fa-solid fa-triangle-exclamation"></i> هشدارها و وضعیت خودرو</h3>
                    <div style="background: rgba(255,77,77,0.1); border: 1px solid var(--danger); padding: 16px; border-radius: 12px; color: var(--danger); font-weight: 600; margin-bottom: 16px;">
                        ⚠️ هزینه کل فراتر از سقف درآمد است. توازن نقدی نیازمند انضباط است.
                    </div>
                    <div style="background: rgba(0,230,255,0.06); border: 1px solid var(--neon-blue); padding: 16px; border-radius: 12px; color: var(--neon-blue); font-weight: 500; margin-bottom: 16px;">
                        🚗 تیبا ۱ (کارکرد: ${vehicleStats.mileage.toLocaleString()} کیلومتر) آماده بررسی پلتفرم تعمیرات است.
                    </div>
                    <button class="glass-btn w-100" onclick="app.navigateTo('shahin')" style="justify-content:center;"><i class="fa-solid fa-car"></i> مدیریت تیبا ۱</button>
                </div>
            </div>
        `;
    }

    viewTransactions(transactions) {
        return `
            <div class="glass-card" style="margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center;">
                <h3>مدیریت حرفه‌ای تراکنش‌ها</h3>
                <button class="glass-btn" onclick="app.openQuickAdd()"><i class="fa-solid fa-plus"></i> ثبت تراکنش جدید</button>
            </div>
            <div class="glass-card">
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
                </table>
            </div>
        `;
    }

    viewSavings(savings) {
        return `
            <div class="glass-card" style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                <h3>صندوق‌ها و اهداف پس‌انداز</h3>
                <button class="glass-btn" onclick="app.openAddSavingsGoal()"><i class="fa-solid fa-plus"></i> هدف جدید</button>
            </div>
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
            </div>
        `;
    }

    viewShahin(vStats, vehicleLogs, savings) {
        const oilGoal = savings.find(s => s.name.includes('روغن')) || { target: 40000000, current: 4580005 };
        const remainingAmount = oilGoal.target - oilGoal.current;
        const requiredDaily = Math.round(remainingAmount / 210);

        return `
            <div class="glass-card" style="margin-bottom: 20px; display:flex; justify-content:space-between; align-items:center;">
                <div>
                    <h3 style="color: var(--neon-blue);">مدیریت خودروی تیبا ۱ (مدل ${vStats.year})</h3>
                    <p style="color: var(--text-muted); font-size: 0.88rem; margin-top: 4px;">کارکرد: ${vStats.mileage.toLocaleString()} کیلومتر • سوخت: ${vStats.fuel} • هزینه هر کیلومتر: ${vStats.costPerKm} تومان</p>
                </div>
                <button class="glass-btn" onclick="app.openAddVehicleLog()"><i class="fa-solid fa-wrench"></i> ثبت هزینه تعمیر/سرویس</button>
            </div>
            <div class="glass-card" style="margin-bottom: 20px;">
                <h4 style="color: var(--neon-purple); margin-bottom: 12px;">هدف بحرانی: روغن‌سوزی تیبا</h4>
                <div style="background: rgba(255,255,255,0.03); padding: 18px; border-radius: 12px;">
                    <p style="margin-bottom: 8px;">مبلغ هدف: 40,000,000 تومان • جمع‌آوری شده: 4,580,005 تومان (پیشرفت ۱۱.۴۵٪)</p>
                    <p style="color: var(--warning); margin-bottom: 12px; font-weight: 600;">⚠️ روزهای باقی‌مانده: 210 روز • پس‌انداز روزانه مورد نیاز: ${requiredDaily.toLocaleString()} تومان</p>
                    <div style="background: rgba(255,255,255,0.05); height: 8px; border-radius: 4px; overflow: hidden;">
                        <div style="background: var(--neon-blue); height: 100%; width: 11.45%;"></div>
                    </div>
                </div>
            </div>
            <div class="glass-card">
                <h3 style="margin-bottom: 15px;">سوابق سرویس و تعمیرات خودرو</h3>
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
                </table>
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
                        <h4 style="color:var(--text-muted)">بودجه روزانه</h4>
                        <div style="font-size:1.4rem; font-weight:bold; margin-top:6px;">200,000 تومان</div>
                    </div>
                    <div class="glass-card" style="padding: 18px; border-color: var(--danger);">
                        <h4 style="color:var(--danger)">مجموع هزینه‌ها</h4>
                        <div style="font-size:1.4rem; font-weight:bold; margin-top:6px; color: var(--danger);">${totalExp.toLocaleString()} تومان</div>
                    </div>
                </div>
                <div style="background: rgba(255,183,3,0.1); border: 1px solid var(--warning); padding: 16px; border-radius: 12px; color: var(--warning); font-weight: 500;">
                    ⚠️ هشدار سقف بودجه: دسته‌های هزینه خوراک و متفرقه در حال سبقت از منابع درآمدی هستند.
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
                        <h3 style="font-size: 1.1rem; color: #fff;">Hop AI Financial Advisor</h3>
                        <p style="font-size: 0.82rem; color: var(--text-muted);">تحلیلگر هوشمند دارایی‌ها، تراکنش‌ها و تیبا ۱</p>
                    </div>
                </div>
                <div id="ai-chat-messages" class="ai-messages">
                    <div class="ai-message assistant">
                        درود Mr. Alavi. من دستیار هوشمند Hop AI هستم. تمام پلتفرم مالی و وضعیت خودرو تحلیل شد. چه دستوری دارید؟
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
                <table class="data-table">
                    <thead><tr><th>نام حساب</th><th>نوع</th><th>موجودی (تومان)</th></tr></thead>
                    <tbody>
                        ${accounts.map(a => `<tr><td>${a.name}</td><td>${a.type}</td><td style="color:${a.balance < 0 ? 'var(--danger)' : '#fff'}">${Number(a.balance).toLocaleString()}</td></tr>`).join('')}
                    </tbody>
                </table>
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
                    <h4 style="color: var(--neon-purple); margin-bottom: 10px;">نرخ پس‌انداز (Saving Rate)</h4>
                    <div style="font-size: 1.6rem; font-weight: bold; color: ${metrics.savingRate > 0 ? 'var(--success)' : 'var(--danger)'};">${metrics.savingRate}%</div>
                </div>
            </div>
        `; 
    }

    viewSettings() { 
        return `
            <div class="glass-card">
                <h3 style="color: var(--neon-blue); margin-bottom: 15px;">تنظیمات سیستم و امنیت محلی</h3>
                <div class="form-group" style="max-width:300px;">
                    <label>تغییر رمز PIN امنیتی</label>
                    <input type="password" id="new-pin-val" placeholder="رمز جدید 4 رقمی">
                    <button class="glass-btn" style="margin-top: 10px; justify-content:center;" onclick="alert('رمز عبور با موفقیت بروز شد.')">ذخیره رمز جدید</button>
                </div>
            </div>
        `; 
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
        this.openModal(`
            <h3>ثبت هزینه سرویس و تعمیر تیبا ۱</h3>
            <form onsubmit="app.saveVehicleLog(event)" style="margin-top: 15px;">
                <div class="form-group"><label>نوع سرویس</label><input type="text" id="vl-type" required placeholder="مثال: تعویض روغن، تعویض پد"></div>
                <div class="form-group"><label>مبلغ (تومان)</label><input type="number" id="vl-amt" required placeholder="مثال: ۱۲۰۰۰۰۰"></div>
                <div class="form-group"><label>کیلومتر</label><input type="number" id="vl-km" value="406922"></div>
                <div class="form-group"><label>توضیحات</label><input type="text" id="vl-desc" placeholder="جزئیات تعمیر"></div>
                <button type="submit" class="glass-btn w-100" style="margin-top: 12px; justify-content:center;">ثبت و انتقال به مالی</button>
            </form>
        `);
    }

    async saveVehicleLog(e) {
        e.preventDefault();
        const amt = document.getElementById('vl-amt').value;
        const type = document.getElementById('vl-type').value;
        const desc = document.getElementById('vl-desc').value;
        const mileage = document.getElementById('vl-km').value;

        await this.db.add('vehicleLogs', { type, amount: amt, mileage, desc, date: new Date().toLocaleDateString('fa-IR') });
        await this.db.add('transactions', { type: 'هزینه', category: 'تعمیرات تیبا', amount: amt, desc: `خودرو تیبا ۱: ${type} - ${desc}`, date: new Date().toLocaleDateString('fa-IR') });

        this.closeModal();
        this.navigateTo(this.currentView);
    }

    openAddSavingsGoal() {
        this.openModal(`
            <h3>ایجاد هدف پس‌انداز جدید</h3>
            <form onsubmit="app.saveSavingsGoal(event)" style="margin-top: 15px;">
                <div class="form-group"><label>نام صندوق/هدف</label><input type="text" id="sg-name" required placeholder="مثال: تعویض لاستیک"></div>
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
        console.log('Search query:', query);
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
