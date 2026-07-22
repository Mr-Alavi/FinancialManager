class LocalizationManager {
    constructor() {
        this.dictionary = {
            fa: {
                settings_title: "سیستم تنظیمات پیشرفته",
                settings_subtitle: "مدیریت ظاهر، زبان، ارز و پیکربندی عمومی سیستم",
                general_settings: "تنظیمات عمومی",
                label_theme: "پوسته بصری (Theme)",
                label_language: "زبان سیستم (Language)",
                label_currency: "واحد پول پیش‌فرض (Currency)",
                btn_save: "ذخیره تغییرات",
                settings_saved_success: "تنظیمات با موفقیت ذخیره و اعمال شد."
            },
            en: {
                settings_title: "System Settings",
                settings_subtitle: "Manage appearance, language, currency, and system configuration",
                general_settings: "General Settings",
                label_theme: "Visual Theme",
                label_language: "System Language",
                label_currency: "Default Currency",
                btn_save: "Save Changes",
                settings_saved_success: "Settings saved and applied successfully."
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
