/**
 * src/core/localization.js
 * Pure extraction of localization logic from app.js
 */

let currentLocale = 'en';

const translations = {
    en: {
        dashboard: "Dashboard",
        transactions: "Transactions",
        goals: "Goals",
        settings: "Settings",
        categories: "Categories",
        vehicleLogs: "Vehicle Logs",
        maintenance: "Maintenance",
        assets: "Assets",
        obligations: "Obligations",
        savings: "Savings"
    },
    fa: {
        dashboard: "داشبورد",
        transactions: "تراکنش‌ها",
        goals: "اهداف",
        settings: "تنظیمات",
        categories: "دسته‌بندی‌ها",
        vehicleLogs: "سوابق خودرو",
        maintenance: "نگهداری",
        assets: "دارایی‌ها",
        obligations: "تعهدات",
        savings: "پس‌اندازها"
    }
};

function t(key) {
    const lang = currentLocale || 'en';
    if (translations[lang] && translations[lang][key]) {
        return translations[lang][key];
    }
    if (translations['en'] && translations['en'][key]) {
        return translations['en'][key];
    }
    return key;
}

function setLanguage(lang) {
    if (!translations[lang]) return;
    currentLocale = lang;
    localStorage.setItem('tror_lang', lang);
    document.documentElement.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
    document.documentElement.setAttribute('lang', lang);
}

function initLocalization() {
    const savedLang = localStorage.getItem('tror_lang') || 'en';
    setLanguage(savedLang);
}

export { t, setLanguage, initLocalization };

