export function renderCharts(container, config) {
  if (typeof Chart === 'undefined') {
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/npm/chart.js';
    script.onload = () => buildChartInstance(container, config);
    document.head.appendChild(script);
  } else {
    buildChartInstance(container, config);
  }
}

function buildChartInstance(container, { canvasId, type, data, options }) {
  const ctx = container.querySelector('#' + canvasId);
  if (!ctx) return;
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = isDark ? '#F3F4F6' : '#1F2937';
  
  new Chart(ctx, {
    type,
    data,
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: { legend: { position: 'bottom', labels: { color: textColor } } },
      ...options
    }
  });
}
