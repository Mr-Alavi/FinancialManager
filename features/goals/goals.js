class GoalsModule {
    constructor() {
        this.goalsKey = 'tror_pfos_goals_data';
    }

    init() {
        this.loadGoals();
        this.bindEvents();
    }

    getGoals() {
        const data = localStorage.getItem(this.goalsKey);
        return data ? JSON.parse(data) : [
            { id: 1, name: 'هدف خودرو (شاحین)', target: 50000000, current: 15000000, priority: 'بالا', category: 'Vehicle' },
            { id: 2, name: 'صندوق اضطراری', target: 30000000, current: 10000000, priority: 'بحرانی', category: 'Emergency' }
        ];
    }

    saveGoals(goals) {
        localStorage.setItem(this.goalsKey, JSON.stringify(goals));
        this.loadGoals();
    }

    loadGoals() {
        const container = document.getElementById('goals-grid');
        const emptyState = document.getElementById('goals-empty-state');
        if (!container) return;

        const goals = this.getGoals();
        
        if (goals.length === 0) {
            emptyState.style.display = 'block';
            container.innerHTML = '';
            return;
        }

        emptyState.style.display = 'none';
        container.innerHTML = goals.map(goal => {
            const percent = Math.min(100, Math.round((goal.current / goal.target) * 100));
            return `
                <div class="glass-card goal-card">
                    <div class="goal-info">
                        <h3>${goal.name}</h3>
                        <span class="badge ${goal.priority}">${goal.priority}</span>
                    </div>
                    <div class="goal-amounts">
                        <span>موجودی: ${goal.current.toLocaleString()} تومان</span>
                        <span>هدف: ${goal.target.toLocaleString()} تومان</span>
                    </div>
                    <div class="progress-bar-container">
                        <div class="progress-bar-fill" style="width: ${percent}%;"></div>
                    </div>
                    <span class="progress-text">${percent}% پیشرفت</span>
                </div>
            `;
        }).join('');
    }

    bindEvents() {
        const allocateBtn = document.getElementById('run-auto-allocation');
        if (allocateBtn) {
            allocateBtn.addEventListener('click', () => {
                this.runAutoAllocation();
            });
        }
    }

    runAutoAllocation() {
        // نمونه تخصیص خودکار درآمد بر اساس قوانین سیستم
        alert('تخصیص خودکار درآمد روی اهداف (خودرو ۵٪، خانواده ۵٪ و صندوق اضطراری ۱۰٪) با موفقیت اجرا شد.');
        // منطق به‌روزرسانی مقادیر اهداف در اینجا اعمال می‌شود
    }
}

window.GoalsModule = new GoalsModule();
