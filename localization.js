class LocalizationManager {
    constructor() {
        this.dictionary = {
            fa: {
                nav_dashboard: "داشبورد اصلی",
                nav_transactions: "مدیریت تراکنش‌ها",
                nav_goals: "اهداف مالی",
                nav_vehicles: "سرویس خودرو (شاهین / تیبا)",
                nav_assets: "مدیریت دارایی‌ها",
                nav_ai: "دستیار هوشمند (Hop AI)",
                nav_settings: "تنظیمات سیستم",
                status_offline_ready: "سیستم آفلاین آماده است",
                total_income: "مجموع درآمد کل",
                total_expense: "مجموع هزینه‌ها",
                net_balance: "خالص دارایی جاری",
                vehicle_costs: "هزینه‌های خودرو",
                recent_transactions: "آخرین تراکنش‌ها",
                goals_overview: "وضعیّت اهداف مالی",
                no_data: "هیچ تراکنشی ثبت نشده است.",
                no_goals: "هیچ هدفی تعریف نشده است.",
                settings_title: "سیستم تنظیمات پیشرفته",
                settings_subtitle: "مدیریت ظاهر، زبان، ارز و پیکربندی عمومی سیستم",
                label_theme: "پوسته بصری (Theme)",
                label_language: "زبان سیستم (Language)",
                label_currency: "واحد پول پیش‌فرض (Currency)",
                btn_save: "ذخیره تغییرات",
                settings_saved_success: "تنظیمات با موفقیت ذخیره شد."
            },
            en: {
                nav_dashboard: "Dashboard",
                nav_transactions: "Transactions",
                nav_goals: "Financial Goals",
                nav_vehicles: "Vehicle Care (Shahin/Tiba)",
                nav_assets: "Asset Portfolio",
                nav_ai: "Hop AI Assistant",
                nav_settings: "Settings",
                status_offline_ready: "Offline Mode Ready",
                total_income: "Total Income",
                total_expense: "Total Expenses",
                net_balance: "Net Balance",
                vehicle_costs: "Vehicle Maintenance",
                recent_transactions: "Recent Transactions",
                goals_overview: "Goals Overview",
                no_data: "No transactions recorded yet.",
                no_goals: "No active goals.",
                settings_title: "Advanced System Settings",
                settings_subtitle: "Configure theme, language, currency, and system behaviors",
                label_theme: "Visual Theme",
                label_language: "System Language",
                label_currency: "Default Currency",
                btn_save: "Save Changes",
                settings_saved_success: "Settings saved successfully."
            }
        };
    }

    setLanguage(lang) {
        localStorage.setItem('tror_pfos_lang', lang);
        document.documentElement.setAttribute('lang', lang);
        document.documentElement.setAttribute('dir', lang === 'fa' ? 'rtl' : 'ltr');
        this.updateDOMTexts(lang);
    }

    getCurrentLang() {
        return localStorage.getItem('tror_pfos_lang') || 'fa';
    }

    t(key) {
        const lang = this.getCurrentLang();
        return this.dictionary[lang]?.[key] || this.dictionary['fa'][key] || key;
    }

    updateDOMTexts(lang) {
        document.querySelectorAll('[data-i18n]').forEach(el => {
            const key = el.getAttribute('data-i18n');
            const translation = this.t(key);
            if (translation) {
                el.textContent = translation;
            }
        });
    }
}

window.LocalizationManager = new LocalizationManager();
