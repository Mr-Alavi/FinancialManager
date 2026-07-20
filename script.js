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
    }, 4000);
});

// باز کردن بخش‌ها با محتوای کاملاً اختصاصی برای هر کلید
function openSection(id, title) {
    currentSectionId = id;
    document.getElementById("dashboard-view").classList.add("hidden");
    document.getElementById("section-view").classList.remove("hidden");
    document.getElementById("section-title").innerText = `بخش ${id}: ${title}`;
    
    const container = document.getElementById("section-dynamic-content");
    container.innerHTML = ""; // پاک کردن محتوای قبلی

    // ساخت محتوای کاملاً مجزا بر اساس شماره و نوع بخش
    if (id === 13) {
        // بخش شاهین (گزارش ماشین و صندوق شاهین)
        container.innerHTML = `
            <div class="info-box">
                <h3 style="color: #00e6ff; margin-bottom: 10px;">🚗 مدیریت و صندوق شاهین (تیبا ۱)</h3>
                <p style="color: #ccc; font-size: 0.9rem;">وضعیت صندوق اختصاصی و هزینه‌های خودروی شاهین/تیبا:</p>
            </div>
            <div class="form-container">
                <h3>ثبت هزینه یا پس‌انداز شاهین</h3>
                <form id="transaction-form" onsubmit="saveTransaction(event)">
                    <div class="form-group">
                        <label>مبلغ (تومان):</label>
                        <input type="number" id="tx-amount" required placeholder="مثال: 1000000">
                    </div>
                    <div class="form-group">
                        <label>نوع تراکنش:</label>
                        <select id="tx-type">
                            <option value="هزینه تعمیرات">هزینه تعمیرات</option>
                            <option value="سوخت">سوخت</option>
                            <option value="پس‌انداز صندوق شاهین">پس‌انداز صندوق شاهین</option>
                        </select>
                    </div>
                    <input type="hidden" id="tx-category" value="شاهین">
                    <div class="form-group">
                        <label>توضیحات:</label>
                        <input type="text" id="tx-desc" placeholder="جزئیات تعمیرات یا واریز...">
                    </div>
                    <button type="submit" class="glass-btn submit-btn">ثبت در صندوق شاهین</button>
                </form>
            </div>
            <div class="records-container">
                <h3>تراکنش‌های ثبت شده شاهین</h3>
                <div id="records-list"></div>
            </div>
        `;
    } else if (id === 12) {
        // بخش تنظیمات
        container.innerHTML = `
            <div class="info-box">
                <h3 style="color: #8a2be2; margin-bottom: 10px;">⚙ تنظیمات سیستم و اطلاعات</h3>
                <p style="color: #ccc; font-size: 0.9rem;">مدیریت حافظه محلی، پاکسازی یا خروجی گرفتن از اطلاعات مالی.</p>
            </div>
            <div style="display: flex; flex-direction: column; gap: 15px; margin-top: 20px;">
                <button class="glass-btn" onclick="backupData()" style="text-align:center;">📥 دریافت فایل پشتیبان داده‌ها (JSON)</button>
                <button class="glass-btn" onclick="clearAllData()" style="border-color: #ff4d4d; color: #ff4d4d; text-align:center;">🗑 پاکسازی کامل اطلاعات حافظه</button>
            </div>
        `;
    } else if (id === 1) {
        // خلاصه مالی
        container.innerHTML = `
            <div class="info-box">
                <h3 style="color: #00e6ff; margin-bottom: 10px;">📊 خلاصه کلی وضعیت مالی</h3>
                <div id="financial-summary-box" style="margin-top: 10px; font-size: 0.95rem; line-height: 1.6;">
                    در حال محاسبه تراکنش‌ها...
                </div>
            </div>
            <div class="records-container">
                <h3>لیست کل تراکنش‌های ثبت‌شده</h3>
                <div id="records-list"></div>
            </div>
        `;
        loadAllRecordsSummary();
        return;
    } else {
        // سایر بخش‌ها (ثبت، بودجه، دسته‌بندی، داشبورد، اهداف و...)
        container.innerHTML = `
            <div class="form-container">
                <h3>ثبت اطلاعات در ${title}</h3>
                <form id="transaction-form" onsubmit="saveTransaction(event)">
                    <div class="form-group">
                        <label>مبلغ (تومان):</label>
                        <input type="number" id="tx-amount" required placeholder="مثال: 500000">
                    </div>
                    <div class="form-group">
                        <label>نوع تراکنش:</label>
                        <select id="tx-type">
                            <option value="هزینه">هزینه</option>
                            <option value="درآمد">درآمد</option>
                            <option value="متفرقه">متفرقه</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>دسته‌بندی:</label>
                        <select id="tx-category">
                            <option value="خوراک">🍕 خوراک</option>
                            <option value="ماشین">🚗 ماشین</option>
                            <option value="تعمیرات تیبا">🛠 تعمیرات تیبا</option>
                            <option value="سوخت">⛽ سوخت</option>
                            <option value="قبض">🧾 قبض</option>
                            <option value="خرید">🛍 خرید</option>
                            <option value="کار">💼 کار</option>
                            <option value="${title}">${title}</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>توضیحات:</label>
                        <input type="text" id="tx-desc" placeholder="توضیحات تراکنش...">
                    </div>
                    <button type="submit" class="glass-btn submit-btn">ثبت و ذخیره در ${title}</button>
                </form>
            </div>

            <div class="records-container">
                <h3>آرشیو ثبت‌شده‌های ${title}</h3>
                <div id="records-list"></div>
            </div>
        `;
    }

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
    const catSelect = document.getElementById("tx-category");
    const category = catSelect ? catSelect.value : "عمومی";
    const descInput = document.getElementById("tx-desc");
    const desc = descInput ? descInput.value : "";

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

    const form = document.getElementById("transaction-form");
    if (form) form.reset();
    
    if (currentSectionId === 1) {
        loadAllRecordsSummary();
    } else {
        loadRecords();
    }
}

function loadRecords() {
    const listContainer = document.getElementById("records-list");
    if (!listContainer) return;
    listContainer.innerHTML = "";

    let allData = JSON.parse(localStorage.getItem("tror_finance_data")) || {};
    let sectionRecords = allData[currentSectionId] || [];

    if (sectionRecords.length === 0) {
        listContainer.innerHTML = "<p style='color: #888; font-size: 0.85rem;'>هنوز موردی در این بخش ثبت نشده است.</p>";
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

function loadAllRecordsSummary() {
    const listContainer = document.getElementById("records-list");
    const summaryBox = document.getElementById("financial-summary-box");
    if (!listContainer || !summaryBox) return;

    let allData = JSON.parse(localStorage.getItem("tror_finance_data")) || {};
    let totalIncome = 0;
    let totalExpense = 0;
    let count = 0;

    listContainer.innerHTML = "";
    
    Object.keys(allData).forEach(secId => {
        if (Array.isArray(allData[secId])) {
            allData[secId].forEach(item => {
                count++;
                const amt = parseFloat(item.amount) || 0;
                if (item.type && item.type.includes("درآمد")) {
                    totalIncome += amt;
                } else {
                    totalExpense += amt;
                }
            });
        }
    });

    summaryBox.innerHTML = `
        کل تراکنش‌ها: <b>${count} مورد</b><br>
        مجموع درآمدها: <span style="color: #00e6ff;">${totalIncome.toLocaleString()} تومان</span><br>
        مجموع هزینه‌ها: <span style="color: #ff4d4d;">${totalExpense.toLocaleString()} تومان</span><br>
        تراز نهایی: <b>${(totalIncome - totalExpense).toLocaleString()} تومان</b>
    `;

    listContainer.innerHTML = "<p style='color: #888; font-size: 0.85rem;'>نمایش خلاصه کلی از تمام بخش‌های فعال سیستم.</p>";
}

function deleteRecord(index) {
    let allData = JSON.parse(localStorage.getItem("tror_finance_data")) || {};
    if (allData[currentSectionId]) {
        allData[currentSectionId].splice(index, 1);
        localStorage.setItem("tror_finance_data", JSON.stringify(allData));
        if (currentSectionId === 1) {
            loadAllRecordsSummary();
        } else {
            loadRecords();
        }
    }
}

function clearAllData() {
    if (confirm("آیا مطمئن هستید که می‌خواهید تمام داده‌های ذخیره‌شده را پاک کنید؟")) {
        localStorage.removeItem("tror_finance_data");
        alert("حافظه کامل پاکسازی شد.");
        backToDashboard();
    }
}

function backupData() {
    let allData = localStorage.getItem("tror_finance_data") || "{}";
    let blob = new Blob([allData], { type: "application/json" });
    let url = URL.createObjectURL(blob);
    let a = document.createElement("a");
    a.href = url;
    a.download = "TROR_Financial_Backup.json";
    a.click();
    alert("فایل پشتیبان دانلود شد.");
}
