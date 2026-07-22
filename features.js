import { getStoreService, DB_CONFIG } from './database.js';
import { formatCurrency } from './utils.js';
import { ShowToast } from './components.js';
import { renderCharts } from './charts.js';

// Services
export const getAccounts = () => getStoreService(DB_CONFIG.stores.ACCOUNTS).getAll();
export const getTransactions = () => getStoreService(DB_CONFIG.stores.TRANSACTIONS).getAll();
export const getCategories = () => getStoreService(DB_CONFIG.stores.CATEGORIES).getAll();

// Views
export async function DashboardView() {
  const container = document.createElement('div');
  container.className = 'app-main-content animate-fade';
  const [accounts, transactions, categories] = await Promise.all([getAccounts(), getTransactions(), getCategories()]);
  
  let totalBalance = accounts.reduce((s, a) => s + (a.balance || 0), 0);
  let incomeMonth = 0, expenseMonth = 0;
  const currentMonthPrefix = new Date().toISOString().slice(0, 7);

  transactions.forEach(t => {
    if (t.date && t.date.slice(0, 7) === currentMonthPrefix) {
      if (t.type === 'income') incomeMonth += t.amount;
      if (t.type === 'expense') expenseMonth += t.amount;
    }
  });

  container.innerHTML = `
    <h2 style="font-size:24px; font-weight:700; margin-bottom:16px;">داشبورد هوشمند</h2>
    <div class="tror-card" style="background:linear-gradient(135deg, #3B82F6, #1D4ED8); color:#fff;">
      <span style="font-size:12px; opacity:0.9;">موجودی کل دارایی‌ها</span>
      <h3 class="ltr-text" style="font-size:32px; font-weight:700; margin-top:8px;">${formatCurrency(totalBalance)}</h3>
    </div>
    <div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:16px;">
      <div class="tror-card"><span style="color:var(--text-secondary); font-size:12px;">درآمد ماه</span><h4 class="ltr-text" style="color:var(--fin-income);">${formatCurrency(incomeMonth)}</h4></div>
      <div class="tror-card"><span style="color:var(--text-secondary); font-size:12px;">هزینه ماه</span><h4 class="ltr-text" style="color:var(--fin-expense);">${formatCurrency(expenseMonth)}</h4></div>
    </div>
    <div class="tror-card" style="display:flex; flex-direction:column; align-items:center;">
      <h4 style="align-self:flex-start; margin-bottom:12px;">روند هزینه‌ها</h4>
      <div style="width:100%; height:200px; position:relative;"><canvas id="donutChart"></canvas></div>
    </div>
  `;

  setTimeout(() => {
    const expenseCats = {};
    transactions.filter(t => t.type === 'expense' && t.date?.slice(0, 7) === currentMonthPrefix).forEach(t => {
      const cat = categories.find(c => c.id === t.categoryId)?.name || 'متفرقه';
      expenseCats[cat] = (expenseCats[cat] || 0) + t.amount;
    });
    renderCharts(container, {
      canvasId: 'donutChart',
      type: 'doughnut',
      data: {
        labels: Object.keys(expenseCats).length ? Object.keys(expenseCats) : ['بدون هزینه'],
        datasets: [{ data: Object.keys(expenseCats).length ? Object.values(expenseCats) : [1], backgroundColor: ['#EF4444', '#F59E0B', '#3B82F6', '#10B981'] }]
      }
    });
  }, 50);

  return container;
}

export async function TransactionsView() {
  const container = document.createElement('div');
  container.className = 'app-main-content animate-fade';
  const transactions = await getTransactions();
  container.innerHTML = `
    <h2 style="font-size:24px; font-weight:700; margin-bottom:16px;">تراکنش‌ها</h2>
    <div class="tror-card">
      ${transactions.length === 0 ? '<p style="text-align:center; color:var(--text-secondary);">تراکنشی یافت نشد</p>' : transactions.map(t => `<div style="display:flex; justify-content:space-between; padding:8px 0; border-bottom:1px solid var(--border-color);"><span>${t.description || 'تراکنش'}</span><span class="ltr-text" style="color:${t.type==='income'?'var(--fin-income)':'var(--fin-expense)'};">${formatCurrency(t.amount)}</span></div>`).join('')}
    </div>
  `;
  return container;
}

export async function BudgetView() {
  const container = document.createElement('div');
  container.className = 'app-main-content animate-fade';
  container.innerHTML = `<h2 style="font-size:24px; font-weight:700; margin-bottom:16px;">بودجه‌ها</h2><div class="tror-card"><p style="text-align:center; color:var(--text-secondary);">مدیریت بودجه فعال است</p></div>`;
  return container;
}

export async function GoalsView() {
  const container = document.createElement('div');
  container.className = 'app-main-content animate-fade';
  container.innerHTML = `<h2 style="font-size:24px; font-weight:700; margin-bottom:16px;">اهداف مالی</h2><div class="tror-card"><p style="text-align:center; color:var(--text-secondary);">اهداف ثبت شده</p></div>`;
  return container;
}

export async function SearchView() {
  const container = document.createElement('div');
  container.className = 'app-main-content animate-fade';
  container.innerHTML = `<h2 style="font-size:24px; font-weight:700; margin-bottom:16px;">جستجو</h2><div class="tror-card"><input type="text" class="tror-input" placeholder="جستجوی پیشرفته..." /></div>`;
  return container;
}

export async function SettingsView() {
  const container = document.createElement('div');
  container.className = 'app-main-content animate-fade';
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
  container.innerHTML = `
    <h2 style="font-size:24px; font-weight:700; margin-bottom:16px;">تنظیمات</h2>
    <div class="tror-card" style="display:flex; justify-content:space-between; align-items:center;">
      <span>تم تاریک / روشن</span>
      <select id="theme-select" class="tror-input" style="width:120px;">
        <option value="dark" ${currentTheme==='dark'?'selected':''}>تاریک</option>
        <option value="light" ${currentTheme==='light'?'selected':''}>روشن</option>
      </select>
    </div>
  `;
  container.querySelector('#theme-select').addEventListener('change', (e) => {
    document.documentElement.setAttribute('data-theme', e.target.value);
    localStorage.setItem('tror_theme', e.target.value);
    ShowToast('تم تغییر کرد');
  });
  return container;
}
