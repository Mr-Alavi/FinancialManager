// Database Configuration
const DB_NAME = 'FinancialManagerDB';
const DB_VERSION = 1;
let db;

const request = indexedDB.open(DB_NAME, DB_VERSION);

request.onupgradeneeded = (e) => {
    db = e.target.result;
    db.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
};

request.onsuccess = (e) => {
    db = e.target.result;
    console.log("Database initialized successfully.");
    updateDashboard();
};

// UI Logic
function updateDashboard() {
    // در اینجا محاسبات موجودی و نمایش در index.html انجام می‌شود
    console.log("Dashboard Updated");
}

// Transaction Handling
function addTransaction(type, amount, category, note) {
    const transaction = { type, amount, category, note, date: new Date().toISOString() };
    const tx = db.transaction(['transactions'], 'readwrite');
    tx.objectStore('transactions').add(transaction);
    tx.oncomplete = () => updateDashboard();
}

// Navigation Helper
function navigateTo(page) {
    console.log("Navigating to: " + page);
    // اینجا منطق تغییر نمایش صفحات (مثلاً تغییر display از none به block) قرار می‌گیرد
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const addBtn = document.querySelector('.btn-primary');
    if (addBtn) {
        addBtn.addEventListener('click', () => {
            alert("فرم ثبت تراکنش در مرحله بعد فعال می‌شود");
        });
    }
});
