// State Management
const state = {
    balance: 0,
    transactions: JSON.parse(localStorage.getItem('fin_data')) || []
};

// UI Controller
const showPage = (pageId) => {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.getElementById(pageId).classList.add('active');
};

const init = () => {
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
    }, 1500);
    updateDashboard();
};

const updateDashboard = () => {
    document.getElementById('total-balance').innerText = state.balance.toLocaleString('fa-IR') + ' تومان';
};

window.onload = init;
