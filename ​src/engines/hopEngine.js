/**
 * Financial Calculation & Aggregation Engine
 * Handles pure financial math, summaries, totals, and budget calculations.
 */

export function calculateTotals(items = []) {
  return items.reduce((acc, item) => {
    const amount = parseFloat(item.amount) || 0;
    if (item.type === 'income' || amount > 0) {
      acc.income += Math.abs(amount);
    } else {
      acc.expense += Math.abs(amount);
    }
    acc.net = acc.income - acc.expense;
    return acc;
  }, { income: 0, expense: 0, net: 0 });
}

export function aggregateByCategory(items = []) {
  return items.reduce((acc, item) => {
    const category = item.category || 'Uncategorized';
    const amount = parseFloat(item.amount) || 0;
    acc[category] = (acc[category] || 0) + amount;
    return acc;
  }, {});
}

export function calculateBudgetProgress(spent, budget) {
  const b = parseFloat(budget) || 0;
  const s = parseFloat(spent) || 0;
  if (b <= 0) return 0;
  return Math.min(Math.round((s / b) * 100), 100);
}

