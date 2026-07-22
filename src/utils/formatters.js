/**
 * src/utils/formatters.js
 * Pure extraction of formatting functions from app.js
 */

function formatCurrency(amount) {
    if (isNaN(amount) || amount === null) return '0';
    return Number(amount).toLocaleString('en-US');
}

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString;
    return date.toLocaleDateString();
}

function formatNumber(num) {
    if (isNaN(num) || num === null) return '0';
    return Number(num).toLocaleString();
}

export { formatCurrency, formatDate, formatNumber };

