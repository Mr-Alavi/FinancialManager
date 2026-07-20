let currentSectionId = null;

document.addEventListener("DOMContentLoaded", () => {
    const splashScreen = document.getElementById("splash-screen");
    const mainContent = document.getElementById("main-content");

    setTimeout(() => {
        splashScreen.style.opacity = "0";
        setTimeout(() => {
            splashScreen.style.display = "none";
            mainContent.classList.remove("hidden");
        }, 1000);
    }, 1000);
});

function openSection(id, title) {
    currentSectionId = id;
    document.getElementById("dashboard-view").classList.add("hidden");
    document.getElementById("section-view").classList.remove("hidden");
    document.getElementById("section-title").innerText = `بخش ${id}: ${title}`;
    loadRecords();
}

function backToDashboard() {
    document.getElementById("section-view").classList.add("hidden");
    document.getElementById("dashboard-view").classList.remove("hidden");
    currentSectionId = null;
}

function saveTransaction(event) {
    event.preventDefault();
    
    const amount = document.getElementById("tx-amount").value;
    const type = document.getElementById("tx-type").value;
    const category = document.getElementById("tx-category").value;
    const desc = document.getElementById("tx-desc").value;

    const transaction = {
        amount,
        type,
        category,
        desc,
        date: new Date().toLocaleDateString('fa-IR')
    };

    let allData = JSON.parse(localStorage.getItem("tror_finance_data")) || {};
    if (!allData[currentSectionId]) {
        allData[currentSectionId] = [];
    }

    allData[currentSectionId].push(transaction);
    localStorage.setItem("tror_finance_data", JSON.stringify(allData));

    document.getElementById("transaction-form").reset();
    loadRecords();
}

function loadRecords() {
    const listContainer = document.getElementById("records-list");
    listContainer.innerHTML = "";

    let allData = JSON.parse(localStorage.getItem("tror_finance_data")) || {};
    let sectionRecords = allData[currentSectionId] || [];

    if (sectionRecords.length === 0) {
        listContainer.innerHTML = "<p style='color: #888; font-size: 0.85rem;'>هنوز تراکنشی در این بخش ثبت نشده است.</p>";
        return;
    }

    sectionRecords.forEach((item, index) => {
        const div = document.createElement("div");
        div.className = "record-item";
        div.innerHTML = `
            <div>
                <strong>${item.category} (${item.type})</strong>: ${item.amount} تومان<br>
                <small style='color: #aaa;'>${item.desc || 'بدون توضیحات'} - ${item.date}</small>
            </div>
            <button onclick="deleteRecord(${index})" style="background:transparent; border:none; color:#ff4d4d; cursor:pointer; font-size:1rem;">✕</button>
        `;
        listContainer.appendChild(div);
    });
}

function deleteRecord(index) {
    let allData = JSON.parse(localStorage.getItem("tror_finance_data")) || {};
    if (allData[currentSectionId]) {
        allData[currentSectionId].splice(index, 1);
        localStorage.setItem("tror_finance_data", JSON.stringify(allData));
        loadRecords();
    }
}

function openSettings() {
    alert("بخش تنظیمات سیستم فعال است.");
}

function backupData() {
    let allData = localStorage.getItem("tror_finance_data");
    console.log("Backup Data:", allData);
    alert("پشتیبان‌گیری انجام شد. داده‌ها در حافظه مرورگر امن هستند.");
}
