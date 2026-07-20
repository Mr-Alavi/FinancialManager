/**
 * TROR PFOS - Accounts & Wallets Module (Upgraded & Future-Proof)
 * Compatible with existing IndexedDB 'accounts' store, DatabaseManager, and SmartNotification.
 */
class AccountsModule {
    // Localization dictionary for future multi-language expansion (Persian default)
    static i18n = {
        fa: {
            title: "حساب‌ها و کیف پول‌ها",
            createBtn: "+ ایجاد حساب جدید",
            emptyIcon: "🏛️",
            emptyTitle: "هیچ حسابی ثبت نشده است",
            emptyAction: "+ ایجاد اولین حساب",
            modalTitle: "ایجاد حساب یا کیف پول جدید",
            nameLabel: "نام حساب / بانک / پلتفرم",
            namePlaceholder: "مثال: حساب پاسارگاد یا کیف پول سرد",
            balanceLabel: "موجودی اولیه (تومان / واحد پایه)",
            typeLabel: "نوع حساب",
            currencyLabel: "واحد پول",
            cancel: "انصراف",
            save: "ذخیره حساب",
            successMsg: (name) => `حساب "${name}" با موفقیت ایجاد شد.`,
            types: {
                cash: "پول نقد",
                bankAccount: "حساب بانکی",
                bankCard: "کارت بانکی",
                digitalWallet: "کیف پول دیجیتال",
                savings: "پس‌انداز",
                crypto: "رمزارز",
                investment: "سرمایه‌گذاری",
                custom: "سفارشی"
            },
            currencies: ["تومان", "ریال", "Dollar", "Euro", "USDT"]
        }
    };

    static currentLang = 'fa';

    static t(key) {
        return this.i18n[this.currentLang]?.[key] || key;
    }

    static async mount(container) {
        if (!container) return;

        // Ensure stylesheet is loaded safely
        if (!document.getElementById('tror-accounts-css')) {
            const link = document.createElement('link');
            link.id = 'tror-accounts-css';
            link.rel = 'stylesheet';
            link.href = './features/accounts/accounts.css';
            document.head.appendChild(link);
        }

        const t = (k) => this.t(k);

        container.innerHTML = `
            <div class="tror-accounts-container">
                <div class="tror-accounts-header">
                    <div class="tror-accounts-title">${t('title')}</div>
                    <button class="tror-btn-primary" id="tror-open-create-account">${t('createBtn')}</button>
                </div>
                <div id="tror-accounts-content">
                    <div class="tror-empty-state">
                        <div class="tror-empty-icon">💳</div>
                        <div class="tror-empty-title">در حال بارگذاری حساب‌ها...</div>
                    </div>
                </div>
            </div>
        `;

        document.getElementById('tror-open-create-account').addEventListener('click', () => {
            this.openCreateModal();
        });

        await this.loadAccounts();
    }

    static async fetchAccountsFromDB() {
        return new Promise((resolve) => {
            if (window.DatabaseManager && typeof window.DatabaseManager.getAll === 'function') {
                window.DatabaseManager.getAll('accounts').then(res => resolve(res || [])).catch(() => resolve([]));
            } else if (window.indexedDB) {
                // Open without hardcoded version to prevent version clash
                const request = indexedDB.open('TROR_PFOS_EnterpriseDB');
                request.onerror = () => resolve([]);
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('accounts')) {
                        resolve([]);
                        return;
                    }
                    const transaction = db.transaction(['accounts'], 'readonly');
                    const store = transaction.objectStore('accounts');
                    const getAllReq = store.getAll();
                    getAllReq.onsuccess = () => resolve(getAllReq.result || []);
                    getAllReq.onerror = () => resolve([]);
                };
            } else {
                resolve([]);
            }
        });
    }

    static async loadAccounts() {
        const contentEl = document.getElementById('tror-accounts-content');
        if (!contentEl) return;

        const accounts = await this.fetchAccountsFromDB();
        const activeAccounts = accounts.filter(acc => !acc.deleted && acc.status !== 'archived');

        if (!activeAccounts || activeAccounts.length === 0) {
            contentEl.innerHTML = `
                <div class="tror-empty-state">
                    <div class="tror-empty-icon">${this.t('emptyIcon')}</div>
                    <div class="tror-empty-title">${this.t('emptyTitle')}</div>
                    <button class="tror-btn-primary" id="tror-empty-create-btn">${this.t('emptyAction')}</button>
                </div>
            `;
            document.getElementById('tror-empty-create-btn').addEventListener('click', () => {
                this.openCreateModal();
            });
            return;
        }

        let gridHTML = `<div class="tror-accounts-grid">`;
        activeAccounts.forEach(acc => {
            const currentBal = Number(acc.currentBalance !== undefined ? acc.currentBalance : (acc.balance || acc.initialBalance || 0));
            const balanceFormatted = currentBal.toLocaleString();
            const currency = acc.currency || 'تومان';
            const typeLabel = this.i18n[this.currentLang].types[acc.typeKey || acc.type] || acc.type || 'بانکی';
            
            gridHTML += `
                <div class="tror-account-card" data-account-id="${acc.id || ''}">
                    <div class="tror-account-name">${this.escapeHTML(acc.name || acc.title || 'حساب بدون نام')}</div>
                    <div class="tror-account-balance">${balanceFormatted} <span style="font-size:13px; color:#94a3b8;">${currency}</span></div>
                    <div style="font-size:12px; color:#64748b; margin-top:8px;">نوع: ${this.escapeHTML(typeLabel)}</div>
                </div>
            `;
        });
        gridHTML += `</div>`;
        contentEl.innerHTML = gridHTML;
    }

    static openCreateModal() {
        const existingModal = document.getElementById('tror-account-modal');
        if (existingModal) existingModal.remove();

        const t = (k) => this.t(k);
        const types = this.i18n[this.currentLang].types;
        const currencies = this.i18n[this.currentLang].currencies;

        const modalOverlay = document.createElement('div');
        modalOverlay.id = 'tror-account-modal';
        modalOverlay.className = 'tror-modal-overlay';
        
        let typeOptionsHTML = '';
        for (const [key, label] of Object.entries(types)) {
            typeOptionsHTML += `<option value="${key}">${label}</option>`;
        }

        let currencyOptionsHTML = '';
        currencies.forEach(curr => {
            currencyOptionsHTML += `<option value="${curr}">${curr}</option>`;
        });

        modalOverlay.innerHTML = `
            <div class="tror-modal-card">
                <div class="tror-modal-title">${t('modalTitle')}</div>
                <form id="tror-account-form">
                    <div class="tror-form-group">
                        <label class="tror-form-label">${t('nameLabel')}</label>
                        <input type="text" id="tror-acc-name" class="tror-form-input" placeholder="${t('namePlaceholder')}" required />
                    </div>
                    <div class="tror-form-group">
                        <label class="tror-form-label">${t('balanceLabel')}</label>
                        <input type="number" id="tror-acc-balance" class="tror-form-input" placeholder="0" value="0" required />
                    </div>
                    <div class="tror-form-group">
                        <label class="tror-form-label">${t('typeLabel')}</label>
                        <select id="tror-acc-type" class="tror-form-select">
                            ${typeOptionsHTML}
                        </select>
                    </div>
                    <div class="tror-form-group">
                        <label class="tror-form-label">${t('currencyLabel')}</label>
                        <select id="tror-acc-currency" class="tror-form-select">
                            ${currencyOptionsHTML}
                        </select>
                    </div>
                    <div class="tror-modal-actions">
                        <button type="button" class="tror-btn-secondary" id="tror-modal-cancel">${t('cancel')}</button>
                        <button type="submit" class="tror-btn-primary">${t('save')}</button>
                    </div>
                </form>
            </div>
        `;

        document.body.appendChild(modalOverlay);

        document.getElementById('tror-modal-cancel').addEventListener('click', () => modalOverlay.remove());
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) modalOverlay.remove();
        });

        document.getElementById('tror-account-form').addEventListener('submit', async (e) => {
            e.preventDefault();
            const name = document.getElementById('tror-acc-name').value.trim();
            const initialBalance = parseFloat(document.getElementById('tror-acc-balance').value) || 0;
            const typeKey = document.getElementById('tror-acc-type').value;
            const currency = document.getElementById('tror-acc-currency').value;

            // Future-proof schema with separate balances, unique ID, and audit fields
            const newAccountRecord = {
                id: 'tror_acc_' + Date.now() + '_' + Math.random().toString(36).substr(2, 6),
                name: name,
                typeKey: typeKey,
                type: types[typeKey] || typeKey,
                currency: currency,
                initialBalance: initialBalance,
                currentBalance: initialBalance, // Modified by future transactions
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                status: 'active',
                deleted: false,
                syncStatus: 'local_pending'
            };

            await this.saveAccountToDB(newAccountRecord);
            modalOverlay.remove();
            await this.loadAccounts();

            if (window.SmartNotification) {
                window.SmartNotification.show(this.i18n[this.currentLang].successMsg(name), "ثبت حساب", 4000, "success");
            }
        });
    }

    static async saveAccountToDB(accountData) {
        return new Promise((resolve) => {
            if (window.DatabaseManager && typeof window.DatabaseManager.add === 'function') {
                window.DatabaseManager.add('accounts', accountData).then(resolve).catch(() => resolve(null));
            } else if (window.indexedDB) {
                const request = indexedDB.open('TROR_PFOS_EnterpriseDB');
                request.onsuccess = (event) => {
                    const db = event.target.result;
                    if (!db.objectStoreNames.contains('accounts')) {
                        resolve(null);
                        return;
                    }
                    const transaction = db.transaction(['accounts'], 'readwrite');
                    const store = transaction.objectStore('accounts');
                    store.add(accountData);
                    transaction.oncomplete = () => resolve(true);
                    transaction.onerror = () => resolve(false);
                };
                request.onerror = () => resolve(false);
            } else {
                resolve(null);
            }
        });
    }

    static escapeHTML(str) {
        if (!str) return '';
        return String(str).replace(/[&<>'"]/g, 
            tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
        );
    }
}

window.AccountsModule = AccountsModule;
