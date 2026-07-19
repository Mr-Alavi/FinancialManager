let db;
const request = indexedDB.open('TROR_Finance', 1);

request.onupgradeneeded = e => { e.target.result.createObjectStore('transactions', { autoIncrement: true }); };
request.onsuccess = e => { db = e.target.result; updateUI(); };

function switchPage(p) {
    document.querySelectorAll('.page').forEach(page => page.style.display = 'none');
    document.getElementById(p + '-page').style.display = 'block';
}

function showForm() { document.getElementById('transaction-form').style.display = 'block'; }

function saveTransaction() {
    const amount = document.getElementById('amount').value;
    const category = document.getElementById('category').value;
    const tx = db.transaction('transactions', 'readwrite');
    tx.objectStore('transactions').add({ amount, category, date: new Date() });
    tx.oncomplete = () => { alert('ثبت شد'); updateUI(); };
}

function updateUI() {
    // منطق نمایش موجودی از دیتابیس
    console.log("UI Updated");
}
