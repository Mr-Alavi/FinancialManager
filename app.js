class TrorApp {
    constructor() {
        this.activeCar = 'shahin';
        document.addEventListener('DOMContentLoaded', () => this.init());
    }

    async init() {
        await window.DB.initDB();
        
        window.ThemeManager.applyTheme(window.ThemeManager.getCurrentTheme());
        window.LocalizationManager.setLanguage(window.LocalizationManager.getCurrentLang());
        this.updateCurrencyDisplay();

        this.setupNavigation();
        this.setupForms();
        this.setupVehicleTabs();
        this.setupSettings();
        this.setupHopAI();

        this.refreshData();
    }

    setupNavigation() {
        const navItems = document.querySelectorAll('.nav-item');
        navItems.forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                navItems.forEach(i => i.classList.remove('active'));
                item.classList.add('active');

                const target = item.getAttribute('data-target');
                document.querySelectorAll('.view-section').forEach(sec => sec.classList.remove('active'));
                const targetSec = document.getElementById(`${target}-view`);
                if (targetSec) targetSec.classList.add('active');

                const pageTitle = item.querySelector('span').textContent;
                document.getElementById('page-title').textContent = pageTitle;
            });
        });
    }

    setupForms() {
        document.getElementById('transaction-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const tx = {
                type: document.getElementById('tx-type').value,
                title: document.getElementById('tx-title').value,
                amount: parseFloat(document.getElementById('tx-amount').value),
                category: document.getElementById('tx-category').value,
                date: new Date().toLocaleDateString('fa-IR')
            };
            await window.DB.add('transactions', tx);
            this.showToast('تراکنش با موفقیت ثبت شد.');
            e.target.reset();
            this.refreshData();
        });

        document.getElementById('goal-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const goal = {
                title: document.getElementById('goal-title').value,
                target: parseFloat(document.getElementById('goal-target').value),
                current: parseFloat(document.getElementById('goal-current').value || 0)
            };
            await window.DB.add('goals', goal);
            this.showToast('هدف جدید با موفقیت اضافه شد.');
            e.target.reset();
            this.refreshData();
        });

        document.getElementById('vehicle-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const record = {
                carType: this.activeCar,
                serviceType: document.getElementById('vehicle-service-type').value,
                mileage: parseInt(document.getElementById('vehicle-mileage').value),
                cost: parseFloat(document.getElementById('vehicle-cost').value),
                notes: document.getElementById('vehicle-notes').value,
                date: new Date().toLocaleDateString('fa-IR')
            };
            await window.DB.add('vehicles', record);
            this.showToast(`سرویس خودرو ${this.activeCar === 'shahin' ? 'شاهین' : 'تیبا'} ثبت شد.`);
            e.target.reset();
            this.refreshData();
        });

        document.getElementById('asset-form')?.addEventListener('submit', async (e) => {
            e.preventDefault();
            const asset = {
                name: document.getElementById('asset-name').value,
                category: document.getElementById('asset-category').value,
                value: parseFloat(document.getElementById('asset-value').value)
            };
            await window.DB.add('assets', asset);
            this.showToast('دارایی جدید اضافه شد.');
            e.target.reset();
            this.refreshData();
        });
    }

    setupVehicleTabs() {
        const tabs = document.querySelectorAll('.vehicle-tabs .tab-btn');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                this.activeCar = tab.getAttribute('data-car');
                this.renderVehicles();
            });
        });
    }

    setupSettings() {
        const saveBtn = document.getElementById('save-settings-btn');
        if (saveBtn) {
            saveBtn.addEventListener('click', () => {
                const theme = document.getElementById('setting-theme').value;
                const lang = document.getElementById('setting-lang').value;
                const curr = document.getElementById('setting-currency').value;

                window.ThemeManager.applyTheme(theme);
                window.LocalizationManager.setLanguage(lang);
                localStorage.setItem('tror_pfos_currency', curr);

                this.updateCurrencyDisplay();
                this.showToast(window.LocalizationManager.t('settings_saved_success'));
            });
        }
    }

    setupHopAI() {
        const btn = document.getElementById('ai-send-btn');
        const input = document.getElementById('ai-input');
        if (!btn || !input) return;

        const handleSend = () => {
            const query = input.value.trim();
            if (!query) return;

            this.appendChatMessage('user', query);
            input.value = '';

            setTimeout(() => {
                let reply = "با بررسی داده‌های مالی شما، پیشنهاد می‌شود حداقل ۲۰٪ درآمد خود را پس‌انداز کنید.";
                if (query.includes("شاهین") || query.includes("تیبا") || query.includes("خودرو")) {
                    reply = "بر اساس سوابق خودرو: حتماً تعویض روغن موتور را هر ۵۰۰۰ کیلومتر چک کنید.";
                } else if (query.includes("هدف") || query.includes("پس انداز")) {
                    reply = "اهداف شما در حال پیشرفت هستند. ادامه دهید!";
                }
                this.appendChatMessage('bot', reply);
            }, 600);
        };

        btn.addEventListener('click', handleSend);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') handleSend(); });
    }

    appendChatMessage(sender, text) {
        const chatBox = document.getElementById('ai-chat-box');
        const msg = document.createElement('div');
        msg.className = `chat-message ${sender}`;
        msg.textContent = text;
        chatBox.appendChild(msg);
        chatBox.scrollTop = chatBox.scrollHeight;
    }

    async refreshData() {
        await this.renderDashboard();
        await this.renderTransactions();
        await this.renderGoals();
        await this.renderVehicles();
        await this.renderAssets();
    }

    async renderDashboard() {
        const txs = await window.DB.getAll('transactions');
        const vRecs = await window.DB.getAll('vehicles');

        let income = 0;
        let expense = 0;
        txs.forEach(t => {
            if (t.type === 'income') income += t.amount;
            else expense += t.amount;
        });

        let vCost = 0;
        vRecs.forEach(v => vCost += v.cost);

        document.getElementById('stat-total-income').textContent = this.formatNum(income);
        document.getElementById('stat-total-expense').textContent = this.formatNum(expense);
        document.getElementById('stat-net-balance').textContent = this.formatNum(income - expense);
        document.getElementById('stat-vehicle-total').textContent = this.formatNum(vCost);
    }

    async renderTransactions() {
        const txs = await window.DB.getAll('transactions');
        const tbody = document.getElementById('transactions-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        if (txs.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color: var(--text-muted);">هیچ تراکنشی وجود ندارد.</td></tr>`;
            return;
        }

        txs.reverse().forEach(tx => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${tx.title}</td>
                <td class="${tx.type === 'income' ? 'badge-income' : 'badge-expense'}">${tx.type === 'income' ? 'درآمد (+)' : 'هزینه (-)'}</td>
                <td>${tx.category}</td>
                <td>${tx.date || '-'}</td>
                <td>${this.formatNum(tx.amount)}</td>
                <td><button onclick="app.deleteItem('transactions', ${tx.id})" class="glass-btn" style="padding:4px 8px; font-size:0.75rem;"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    async renderGoals() {
        const goals = await window.DB.getAll('goals');
        const container = document.getElementById('goals-full-list');
        if (!container) return;
        container.innerHTML = '';

        goals.forEach(g => {
            const pct = Math.min(100, Math.round((g.current / g.target) * 100));
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.marginBottom = '12px';
            card.innerHTML = `
                <h4>${g.title}</h4>
                <p style="font-size:0.85rem; color:var(--text-muted); margin: 6px 0;">پیشرفت: ${this.formatNum(g.current)} از ${this.formatNum(g.target)} (${pct}%)</p>
                <div style="background: rgba(255,255,255,0.1); height: 8px; border-radius: 4px; overflow: hidden;">
                    <div style="width: ${pct}%; background: var(--neon-blue); height: 100%;"></div>
                </div>
            `;
            container.appendChild(card);
        });
    }

    async renderVehicles() {
        const recs = await window.DB.getAll('vehicles');
        const carRecs = recs.filter(r => r.carType === this.activeCar);
        const tbody = document.getElementById('vehicle-table-body');
        if (!tbody) return;
        tbody.innerHTML = '';

        carRecs.forEach(r => {
            const tr = document.createElement('tr');
            tr.innerHTML = `
                <td>${r.serviceType}</td>
                <td>${this.formatNum(r.mileage)} km</td>
                <td>${this.formatNum(r.cost)}</td>
                <td>${r.notes || '-'}</td>
                <td>${r.date || '-'}</td>
                <td><button onclick="app.deleteItem('vehicles', ${r.id})" class="glass-btn" style="padding:4px 8px; font-size:0.75rem;"><i class="fas fa-trash"></i></button></td>
            `;
            tbody.appendChild(tr);
        });
    }

    async renderAssets() {
        const assets = await window.DB.getAll('assets');
        const container = document.getElementById('assets-list');
        if (!container) return;
        container.innerHTML = '';

        assets.forEach(a => {
            const card = document.createElement('div');
            card.className = 'glass-card';
            card.style.marginBottom = '12px';
            card.innerHTML = `
                <h4>${a.name}</h4>
                <p style="color:var(--neon-green); font-weight:bold;">${this.formatNum(a.value)} ${localStorage.getItem('tror_pfos_currency') || 'تومان'}</p>
            `;
            container.appendChild(card);
        });
    }

    async deleteItem(store, id) {
        await window.DB.delete(store, id);
        this.showToast('آیتم با موفقیت حذف شد.');
        this.refreshData();
    }

    updateCurrencyDisplay() {
        const curr = localStorage.getItem('tror_pfos_currency') || 'تومان';
        document.getElementById('current-currency-display').textContent = curr;
    }

    showToast(message) {
        const container = document.getElementById('toast-container');
        if (!container) return;
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        container.appendChild(toast);
        setTimeout(() => toast.remove(), 3000);
    }

    formatNum(num) {
        return new Intl.NumberFormat('fa-IR').format(num || 0);
    }
}

window.app = new TrorApp();
