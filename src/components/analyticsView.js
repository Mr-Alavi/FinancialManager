/**
 * analyticsView.js
 * Isolated UI component for rendering advanced analytics and financial insights.
 * Interacts only with the designated container element: #analyticsViewContainer.
 */

import {
  calculateSavingsRate,
  calculateCategoryTrends,
  calculateSpendingVelocity,
  calculateFinancialRatios
} from '../engines/analyticsEngine.js';

import { getAll } from '../services/dbService.js';

import {
  formatCurrency,
  formatNumber
} from '../utils/formatters.js';

/**
 * Fetches required data, computes metrics, and renders the polished analytics view into #analyticsViewContainer.
 */
export async function renderAnalyticsView() {
  const container = document.getElementById('analyticsViewContainer');
  if (!container) {
    return;
  }

  try {
    // 1. Fetch required datasets from existing IndexedDB stores
    const [transactions, assets, obligations, savings] = await Promise.all([
      getAll('transactions').catch(() => []),
      getAll('assets').catch(() => []),
      getAll('obligations').catch(() => []),
      getAll('savings').catch(() => [])
    ]);

    // 2. Perform calculations via analyticsEngine
    const totalIncome = transactions
      .filter(tx => tx.type === 'income')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalExpense = transactions
      .filter(tx => tx.type === 'expense')
      .reduce((sum, tx) => sum + Number(tx.amount || 0), 0);

    const totalSavingsAdded = savings
      .reduce((sum, s) => sum + Number(s.amount || s.currentAmount || 0), 0);

    const totalAssets = assets
      .reduce((sum, a) => sum + Number(a.value || a.amount || 0), 0);

    const totalObligations = obligations
      .reduce((sum, o) => sum + Number(o.amount || o.remaining || 0), 0);

    const savingsRate = calculateSavingsRate(totalIncome, totalSavingsAdded);
    const spendingVelocity = calculateSpendingVelocity(transactions, 30);
    const financialRatios = calculateFinancialRatios(totalIncome, totalExpense, totalAssets, totalObligations);
    
    const categoryTrends = calculateCategoryTrends(transactions, []);

    // 3. Render polished HTML into the isolated container
    container.innerHTML = `
      <div class="analytics-dashboard p-4 sm:p-6 lg:p-8 space-y-6 max-w-7xl mx-auto">
        <!-- Header Section -->
        <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b pb-4">
          <div>
            <h2 class="text-2xl font-bold tracking-tight text-foreground">Advanced Analytics & Insights</h2>
            <p class="text-sm text-muted-foreground mt-0.5">Comprehensive overview of financial performance, spending velocity, and balance sheet health.</p>
          </div>
        </div>
        
        <!-- Summary Cards Grid -->
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="p-5 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Savings Rate</p>
              <p class="text-3xl font-extrabold mt-2 tracking-tight">${formatNumber(savingsRate)}%</p>
            </div>
            <div class="mt-4 pt-3 border-t text-xs text-muted-foreground flex items-center justify-between">
              <span>Target: &gt;20%</span>
              <span class="${savingsRate >= 20 ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}">${savingsRate >= 20 ? 'On Track' : 'Needs Focus'}</span>
            </div>
          </div>
          
          <div class="p-5 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">30-Day Spending Velocity</p>
              <p class="text-3xl font-extrabold mt-2 tracking-tight">${formatCurrency(spendingVelocity.dailyAverage)}</p>
            </div>
            <div class="mt-4 pt-3 border-t text-xs text-muted-foreground flex items-center justify-between">
              <span>Daily Average</span>
              <span class="font-medium text-foreground">30-day window</span>
            </div>
          </div>

          <div class="p-5 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Expense-to-Income</p>
              <p class="text-3xl font-extrabold mt-2 tracking-tight">${formatNumber(financialRatios.expenseToIncomeRatio)}%</p>
            </div>
            <div class="mt-4 pt-3 border-t text-xs text-muted-foreground flex items-center justify-between">
              <span>Burn Rate</span>
              <span class="${financialRatios.expenseToIncomeRatio <= 80 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}">${financialRatios.expenseToIncomeRatio <= 80 ? 'Healthy' : 'High'}</span>
            </div>
          </div>

          <div class="p-5 rounded-xl border bg-card text-card-foreground shadow-sm flex flex-col justify-between transition-all hover:shadow-md">
            <div>
              <p class="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Calculated Net Worth</p>
              <p class="text-3xl font-extrabold mt-2 tracking-tight ${financialRatios.netWorth >= 0 ? 'text-foreground' : 'text-red-600'}">${formatCurrency(financialRatios.netWorth)}</p>
            </div>
            <div class="mt-4 pt-3 border-t text-xs text-muted-foreground flex items-center justify-between">
              <span>Assets vs Obligations</span>
              <span class="font-medium text-foreground">Live Value</span>
            </div>
          </div>
        </div>

        <!-- Detailed Breakdown Sections -->
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Category Spending Breakdown -->
          <div class="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold tracking-tight">Category Spending Breakdown</h3>
              <span class="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-md font-medium">Active Categories</span>
            </div>
            <div class="divide-y max-h-80 overflow-y-auto pr-1">
              ${Object.keys(categoryTrends).length === 0 ? '<p class="text-sm text-muted-foreground py-8 text-center">No expense categories found.</p>' : ''}
              ${Object.entries(categoryTrends).map(([cat, data]) => `
                <div class="py-3.5 flex items-center justify-between text-sm transition-colors hover:bg-muted/30 px-2 rounded-lg">
                  <span class="font-medium text-foreground">${cat}</span>
                  <div class="text-right">
                    <span class="font-bold text-foreground block">${formatCurrency(data.current)}</span>
                    <span class="text-xs text-muted-foreground mt-0.5 block">Change: <span class="${data.percentChange <= 0 ? 'text-emerald-600 font-medium' : 'text-red-600 font-medium'}">${formatNumber(data.percentChange)}%</span></span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Financial Health Ratios -->
          <div class="p-6 rounded-xl border bg-card text-card-foreground shadow-sm space-y-4">
            <div class="flex items-center justify-between">
              <h3 class="text-lg font-semibold tracking-tight">Balance Sheet & Ratios</h3>
              <span class="text-xs bg-muted text-muted-foreground px-2.5 py-1 rounded-md font-medium">Solvency Overview</span>
            </div>
            <div class="space-y-4 text-sm pt-2">
              <div class="flex items-center justify-between py-2.5 border-b">
                <span class="text-muted-foreground font-medium">Debt-to-Asset Ratio</span>
                <span class="font-bold text-foreground">${formatNumber(financialRatios.debtToAssetRatio)}%</span>
              </div>
              <div class="flex items-center justify-between py-2.5 border-b">
                <span class="text-muted-foreground font-medium">Total Assets</span>
                <span class="font-bold text-emerald-600">${formatCurrency(totalAssets)}</span>
              </div>
              <div class="flex items-center justify-between py-2.5 border-b">
                <span class="text-muted-foreground font-medium">Total Obligations</span>
                <span class="font-bold text-red-600">${formatCurrency(totalObligations)}</span>
              </div>
              <div class="flex items-center justify-between py-2.5">
                <span class="text-muted-foreground font-medium">Total Period Expenses</span>
                <span class="font-bold text-foreground">${formatCurrency(spendingVelocity.totalExpense)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  } catch (error) {
    container.innerHTML = `
      <div class="p-8 text-center text-red-500 bg-card rounded-xl border m-6">
        <p class="font-semibold text-base">Failed to load analytics data.</p>
        <p class="text-xs text-muted-foreground mt-1">Please try switching views or check database connectivity.</p>
      </div>
    `;
  }
}
