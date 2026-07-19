// بودجه‌بندی: ۴۰٪ جاری، ۳۰٪ پس‌انداز، ۳۰٪ خودرو
const BUDGET_RULES = { current: 0.4, savings: 0.3, car: 0.3 };

function saveTransaction() {
    const amount = parseFloat(document.getElementById('amount').value);
    const category = document.getElementById('category').value;
    
    // محاسبه تخصیص بودجه برای درآمدهای جدید
    if(category === 'income') {
        console.log("تخصیص بودجه:", amount * BUDGET_RULES.savings, "به پس‌انداز");
    }

    const tx = db.transaction('transactions', 'readwrite');
    tx.objectStore('transactions').add({ amount, category, date: new Date().toISOString() });
    tx.oncomplete = () => { 
        alert('تراکنش با موفقیت ثبت شد'); 
        updateUI(); 
    };
}

function updateUI() {
    const txStore = db.transaction('transactions', 'readonly').objectStore('transactions');
    txStore.getAll().onsuccess = (e) => {
        const data = e.target.result;
        // فیلتر کردن هزینه‌های تیبا ۱
        const carExpenses = data.filter(t => t.category === 'car')
                                .reduce((sum, t) => sum + parseFloat(t.amount), 0);
        
        document.getElementById('vehicle-total').innerText = carExpenses.toLocaleString() + ' تومان';
        document.getElementById('total-balance').innerText = data.reduce((sum, t) => sum + parseFloat(t.amount), 0).toLocaleString() + ' تومان';
    };
}
