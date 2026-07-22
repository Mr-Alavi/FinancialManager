class ThemeManager {
    constructor() {
        this.themes = {
            dark: {
                '--bg-color': '#050505',
                '--card-bg': 'rgba(16, 16, 26, 0.68)',
                '--card-border': 'rgba(138, 43, 226, 0.28)',
                '--card-border-glow': 'rgba(0, 230, 255, 0.55)',
                '--text-main': '#f8f9fa',
                '--text-muted': '#94a3b8'
            },
            light: {
                '--bg-color': '#f0f2f5',
                '--card-bg': 'rgba(255, 255, 255, 0.85)',
                '--card-border': 'rgba(138, 43, 226, 0.2)',
                '--card-border-glow': 'rgba(0, 119, 255, 0.4)',
                '--text-main': '#1a1a1a',
                '--text-muted': '#64748b'
            }
        };
    }

    applyTheme(themeName) {
        const theme = this.themes[themeName] || this.themes.dark;
        const root = document.documentElement;
        
        Object.entries(theme).forEach(([property, value]) => {
            root.style.setProperty(property, value);
        });

        document.body.setAttribute('data-theme', themeName);
        localStorage.setItem('tror_pfos_theme', themeName);
    }

    getCurrentTheme() {
        return localStorage.getItem('tror_pfos_theme') || 'dark';
    }
}

window.ThemeManager = new ThemeManager();
