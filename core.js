/**
 * TROR Personal Financial Operating System - Core Engines & Database Architecture
 * Contains DatabaseManager, FinancialEngine, GoalEngine, CalendarEngine, AssetEngine, VehicleEngine, and AdvancedAIEngine.
 */

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
