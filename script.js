const API_BASE = 'https://api.frankfurter.app';

// ─── Hardcoded fallback rates (EUR base, updated periodically) ───────────────
const FALLBACK_RATES_EUR = {
    AUD: 1.6372, BRL: 6.0561, CAD: 1.5644, CHF: 0.9341, CNY: 7.7867,
    CZK: 25.121, DKK: 7.4601, EUR: 1.0, GBP: 0.8508, HKD: 8.5437,
    HUF: 397.65, IDR: 17642.0, ILS: 4.0047, INR: 93.645, ISK: 149.80,
    JPY: 163.48, KRW: 1520.6, MXN: 21.852, MYR: 4.8760, NOK: 11.742,
    NZD: 1.7793, PHP: 61.995, PLN: 4.2543, RON: 4.9761, SEK: 11.019,
    SGD: 1.4523, THB: 37.412, TRY: 38.327, USD: 1.0983, ZAR: 19.854
};

const FALLBACK_CURRENCIES = {
    AUD: "Australian Dollar",  BRL: "Brazilian Real",      CAD: "Canadian Dollar",
    CHF: "Swiss Franc",        CNY: "Chinese Renminbi",    CZK: "Czech Koruna",
    DKK: "Danish Krone",       EUR: "Euro",                GBP: "British Pound",
    HKD: "Hong Kong Dollar",   HUF: "Hungarian Forint",    IDR: "Indonesian Rupiah",
    ILS: "Israeli New Shekel", INR: "Indian Rupee",        ISK: "Icelandic Króna",
    JPY: "Japanese Yen",       KRW: "South Korean Won",    MXN: "Mexican Peso",
    MYR: "Malaysian Ringgit",  NOK: "Norwegian Krone",     NZD: "New Zealand Dollar",
    PHP: "Philippine Peso",    PLN: "Polish Złoty",        RON: "Romanian Leu",
    SEK: "Swedish Krona",      SGD: "Singapore Dollar",    THB: "Thai Baht",
    TRY: "Turkish Lira",       USD: "United States Dollar",ZAR: "South African Rand"
};

// ─── Currency flags ───────────────────────────────────────────────────────────
const FLAGS = {
    AUD:'🇦🇺', BRL:'🇧🇷', CAD:'🇨🇦', CHF:'🇨🇭', CNY:'🇨🇳', CZK:'🇨🇿',
    DKK:'🇩🇰', EUR:'🇪🇺', GBP:'🇬🇧', HKD:'🇭🇰', HUF:'🇭🇺', IDR:'🇮🇩',
    ILS:'🇮🇱', INR:'🇮🇳', ISK:'🇮🇸', JPY:'🇯🇵', KRW:'🇰🇷', MXN:'🇲🇽',
    MYR:'🇲🇾', NOK:'🇳🇴', NZD:'🇳🇿', PHP:'🇵🇭', PLN:'🇵🇱', RON:'🇷🇴',
    SEK:'🇸🇪', SGD:'🇸🇬', THB:'🇹🇭', TRY:'🇹🇷', USD:'🇺🇸', ZAR:'🇿🇦'
};

// ─── State ────────────────────────────────────────────────────────────────────
let chartInstance     = null;
let conversionTimeout = null;
let lastChartPair     = '';
let isOfflineMode     = false;
let trendsLoaded      = false;

// ─── DOM refs ─────────────────────────────────────────────────────────────────
const $ = id => document.getElementById(id);
const el = {
    amount:         $('amount'),
    from:           $('from-currency'),
    to:             $('to-currency'),
    swap:           $('swap-btn'),
    result:         $('result-display'),
    rate:           $('rate-display'),
    error:          $('error-message'),
    history:        $('history-list'),
    chartBox:       $('chart-container'),
    chartCtx:       $('rate-chart').getContext('2d'),
    panelTitle:     $('panel-title'),
    chartPairLabel: $('chart-pair-label'),
    langSelect:     $('lang-select'),
    themeToggle:    $('theme-toggle'),
    trends:         $('trends-list')
};

// ─── Translations ─────────────────────────────────────────────────────────────
const i18n = {
    en: {
        exchange: "Exchange",
        appDesc: "Real-time currency conversion",
        amountLabel: "Amount",
        fromLabel: "From",
        toLabel: "To",
        selectCurrencies: "Select currencies",
        liveRates: "Live Rates",
        panelTitleInit: "Select currencies to load chart & history",
        chartTitle: "7-Day Rate Evolution",
        historyTitle: "Recent Conversions",
        emptyHistory: "No recent conversions",
        marketTrends: "Market Trends",
        emptyTrends: "No trends loaded. Enter a valid amount to view market trends."
    },
    es: {
        exchange: "Cambio",
        appDesc: "Conversión de divisas en tiempo real",
        amountLabel: "Cantidad",
        fromLabel: "De",
        toLabel: "A",
        selectCurrencies: "Seleccionar divisas",
        liveRates: "Tasas en vivo",
        panelTitleInit: "Seleccione divisas para gráfico e historial",
        chartTitle: "Evolución de 7 días",
        historyTitle: "Conversiones recientes",
        emptyHistory: "No hay conversiones recientes",
        marketTrends: "Tendencias del Mercado",
        emptyTrends: "No hay tendencias cargadas. Ingrese una cantidad válida para ver las tendencias del mercado."
    },
    ar: {
        exchange: "الصرافة",
        appDesc: "تحويل العملات في الوقت الحقيقي",
        amountLabel: "المبلغ",
        fromLabel: "من",
        toLabel: "إلى",
        selectCurrencies: "حدد العملات",
        liveRates: "أسعار حية",
        panelTitleInit: "حدد العملات لتحميل الرسم البياني والسجل",
        chartTitle: "تطور الأسعار في 7 أيام",
        historyTitle: "التحويلات الأخيرة",
        emptyHistory: "لا توجد تحويلات حديثة",
        marketTrends: "اتجاهات السوق",
        emptyTrends: "لم يتم تحميل أي اتجاهات. أدخل مبلغاً صالحاً لعرض اتجاهات السوق."
    }
};

const setLanguage = (lang) => {
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
    
    document.querySelectorAll('[data-i18n]').forEach(element => {
        const key = element.getAttribute('data-i18n');
        if (i18n[lang] && i18n[lang][key]) {
            element.textContent = i18n[lang][key];
        }
    });

    const isPlaceholder = el.result.querySelector('.placeholder') !== null;
    if (isPlaceholder) {
        if (el.panelTitle) el.panelTitle.textContent = i18n[lang].panelTitleInit;
    }
    
    if (el.history.querySelector('.empty-history')) {
        el.history.innerHTML = `<li class="empty-history" data-i18n="emptyHistory">${i18n[lang].emptyHistory}</li>`;
    }
    
    const emptyTrendsEl = el.trends ? el.trends.querySelector('.trend-placeholder') : null;
    if (emptyTrendsEl && !trendsLoaded) {
        emptyTrendsEl.textContent = i18n[lang].emptyTrends;
    }
    
    localStorage.setItem('appLang', lang);
};

const setTheme = (theme) => {
    const isDark = theme === 'dark';
    if (isDark) {
        document.body.classList.add('dark-theme');
        if (el.themeToggle) el.themeToggle.textContent = '☀️';
    } else {
        document.body.classList.remove('dark-theme');
        if (el.themeToggle) el.themeToggle.textContent = '🌙';
    }
    localStorage.setItem('appTheme', theme);
    
    if (chartInstance && lastChartPair) {
        const [from, to] = lastChartPair.split('-');
        updateChart(from, to);
    }
};

const toggleTheme = () => {
    const currentTheme = document.body.classList.contains('dark-theme') ? 'dark' : 'light';
    setTheme(currentTheme === 'dark' ? 'light' : 'dark');
};

const getYesterdayDate = () => {
    const d = new Date();
    const day = d.getDay();
    let daysToSub = 1;
    if (day === 1) daysToSub = 3; // Monday -> Friday
    else if (day === 0) daysToSub = 2; // Sunday -> Friday
    d.setDate(d.getDate() - daysToSub);
    return d.toISOString().split('T')[0];
};

const showTrendsSkeletons = () => {
    if (!el.trends) return;
    el.trends.innerHTML = `
        <div class="skeleton-spark-grid">
            ${Array(4).fill(0).map(() => `
                <div class="skeleton-spark-card">
                    <div class="skeleton-spark-row">
                        <div class="skeleton-spark-block w50"></div>
                        <div class="skeleton-spark-block w35"></div>
                    </div>
                    <div class="skeleton-spark-chart"></div>
                    <div class="skeleton-spark-row">
                        <div class="skeleton-spark-block w35"></div>
                        <div class="skeleton-spark-block w35"></div>
                    </div>
                </div>
            `).join('')}
        </div>
    `;
};

window.selectTrendPair = (from, to) => {
    el.from.value = from;
    el.to.value = to;
    convert();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

const getOfflineTelemetryData = () => {
    const baseRates = {
        'EUR-USD': 1.0850,
        'EUR-GBP': 0.8550,
        'EUR-JPY': 168.20,
        'USD-CAD': 1.3650
    };
    
    const pairHistory = {};
    Object.entries(baseRates).forEach(([pairKey, spotVal]) => {
        const history = [];
        const isUpTrend = pairKey.includes('USD') || pairKey.includes('JPY');
        // Generate 7 days of realistic price movements
        for (let i = 0; i < 7; i++) {
            const dayDrift = (isUpTrend ? 0.0011 : -0.0007) * (i + 1) * (pairKey === 'EUR-JPY' ? 15 : 1);
            const shake = (Math.sin(i * 1.8) * 0.0004) * (pairKey === 'EUR-JPY' ? 15 : 1);
            history.push(parseFloat((spotVal + dayDrift + shake).toFixed(4)));
        }
        pairHistory[pairKey] = history;
    });
    return pairHistory;
};

const loadMarketTrends = async () => {
    if (!el.trends) return;
    
    showTrendsSkeletons();
    
    const pairs = [
        { base: 'EUR', target: 'USD', label: 'EUR / USD', labelFull: 'Euro / US Dollar' },
        { base: 'EUR', target: 'GBP', label: 'EUR / GBP', labelFull: 'Euro / British Pound' },
        { base: 'EUR', target: 'JPY', label: 'EUR / JPY', labelFull: 'Euro / Japanese Yen' },
        { base: 'USD', target: 'CAD', label: 'USD / CAD', labelFull: 'US Dollar / Canadian Dollar' }
    ];

    try {
        const end = new Date();
        const start = new Date(); 
        start.setDate(end.getDate() - 7);
        const fmt2 = d => d.toISOString().split('T')[0];
        
        // Single API request pulling all rates over 7 days base EUR
        const res = await fetch(`${API_BASE}/${fmt2(start)}..${fmt2(end)}?from=EUR`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        
        const data = await res.json();
        const dates = Object.keys(data.rates).sort();
        if (dates.length < 2) throw new Error('Insufficient historical API data');

        const pairHistory = {
            'EUR-USD': dates.map(d => data.rates[d]['USD']),
            'EUR-GBP': dates.map(d => data.rates[d]['GBP']),
            'EUR-JPY': dates.map(d => data.rates[d]['JPY']),
            'USD-CAD': dates.map(d => data.rates[d]['CAD'] / data.rates[d]['USD'])
        };

        renderTrends(pairs, pairHistory);
    } catch (err) {
        console.warn('API trends fetch failed, using fallback data:', err.message);
        const fallbackHistory = getOfflineTelemetryData();
        renderTrends(pairs, fallbackHistory);
    }
};

const renderTrends = (pairs, pairHistory) => {
    const colors = {
        'EUR-USD': '#10b981',
        'EUR-GBP': '#6366f1',
        'EUR-JPY': '#f43f5e',
        'USD-CAD': '#f97316'
    };

    const sparkW = 140, sparkH = 40;

    let html = '<div class="trends-sparkline-grid">';

    pairs.forEach(pair => {
        const key = `${pair.base}-${pair.target}`;
        const values = pairHistory[key];
        if (!values || values.length < 2) return;

        const rateNow = values[values.length - 1];
        const rateThen = values[values.length - 2];

        const diffPercent = ((rateNow - rateThen) / rateThen) * 100;
        const isUp = diffPercent >= 0;
        const color = colors[key] || '#3b82f6';

        const min = Math.min(...values);
        const max = Math.max(...values);
        const range = max - min || 1;
        const pts = values.map((v, i) => {
            const x = 2 + (i / (values.length - 1)) * (sparkW - 4);
            const y = sparkH - 2 - ((v - min) / range) * (sparkH - 8);
            return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`;
        }).join(' ');

        const gradId = `sg-${key.replace('-', '')}`;

        html += `
        <div class="trend-spark-card"
             style="--card-color: ${color};"
             onclick="selectTrendPair('${pair.base}', '${pair.target}')"
             title="Click to select pair">
            <div class="trend-spark-header">
                <span class="trend-spark-pair">${pair.base}/${pair.target}</span>
                <span class="trend-spark-rate">${rateNow.toFixed(4)}</span>
            </div>
            <svg viewBox="0 0 ${sparkW} ${sparkH}" class="trend-spark-svg">
                <defs>
                    <linearGradient id="${gradId}" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stop-color="${color}" stop-opacity="0.2"/>
                        <stop offset="100%" stop-color="${color}" stop-opacity="0.02"/>
                    </linearGradient>
                </defs>
                <path d="${pts}" stroke="${color}" stroke-width="1.8" fill="none" stroke-linecap="round" stroke-linejoin="round"/>
                <path d="${pts} L${(sparkW - 2).toFixed(1)},${sparkH} L2,${sparkH} Z" fill="url(#${gradId})"/>
            </svg>
            <div class="trend-spark-footer">
                <span class="trend-spark-change ${isUp ? 'up' : 'down'}">
                    ${isUp ? '▲' : '▼'} ${Math.abs(diffPercent).toFixed(2)}%
                </span>
                <span class="trend-spark-delta ${isUp ? 'up' : 'down'}">
                    ${isUp ? '+' : ''}${(rateNow - rateThen).toFixed(4)}
                </span>
            </div>
        </div>`;
    });

    html += '</div>';
    el.trends.innerHTML = html;
};

// ─── Helpers ──────────────────────────────────────────────────────────────────
const fmt = (amount, currency) =>
    new Intl.NumberFormat('en-US', { style:'currency', currency, minimumFractionDigits:2, maximumFractionDigits:4 }).format(amount);

const showError = msg => {
    el.error.innerHTML = msg;
    el.error.classList.remove('hidden');
};
const hideError = () => el.error.classList.add('hidden');

// Convert any pair using EUR-based fallback rates
const fallbackConvert = (amount, from, to) => {
    if (from === to) return amount;
    const inEur  = amount / FALLBACK_RATES_EUR[from];
    return inEur * FALLBACK_RATES_EUR[to];
};

// ─── Init ─────────────────────────────────────────────────────────────────────
const init = async () => {
    let currencies = null;

    try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 5000); // 5s timeout
        const res = await fetch(`${API_BASE}/currencies`, { signal: controller.signal });
        clearTimeout(timer);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        currencies = await res.json();
        hideError();
    } catch (err) {
        console.warn('API unavailable, switching to offline mode:', err.message);
        isOfflineMode = true;
        currencies = FALLBACK_CURRENCIES;
    }

    populateDropdowns(currencies);
    
    // Clear existing history to restore all things to 0 on startup
    localStorage.removeItem('currencyHistory');
    loadHistory();

    el.amount.addEventListener('input',  debounce);
    el.from  .addEventListener('change', convert);
    el.to    .addEventListener('change', convert);
    el.swap  .addEventListener('click',  swapCurrencies);

    const savedLang = localStorage.getItem('appLang') || 'en';
    if (el.langSelect) {
        el.langSelect.value = savedLang;
        el.langSelect.addEventListener('change', (e) => setLanguage(e.target.value));
    }
    setLanguage(savedLang);

    if (el.themeToggle) {
        el.themeToggle.addEventListener('click', toggleTheme);
    }
    let savedTheme = localStorage.getItem('appTheme');
    if (!localStorage.getItem('appThemeInitialized_v2')) {
        savedTheme = 'dark';
        localStorage.setItem('appTheme', 'dark');
        localStorage.setItem('appThemeInitialized_v2', 'true');
    }
    setTheme(savedTheme || 'dark');
};

// ─── Dropdowns ────────────────────────────────────────────────────────────────
const populateDropdowns = currencies => {
    const html = Object.entries(currencies)
        .map(([code, name]) => `<option value="${code}">${FLAGS[code] || '💸'} ${code} – ${name}</option>`)
        .join('');

    el.from.innerHTML = html;
    el.to  .innerHTML = html;

    el.from.value = currencies['EUR'] ? 'EUR' : Object.keys(currencies)[0];
    el.to  .value = currencies['USD'] ? 'USD' : Object.keys(currencies)[1];
};

// ─── Swap ─────────────────────────────────────────────────────────────────────
const swapCurrencies = () => {
    [el.from.value, el.to.value] = [el.to.value, el.from.value];
    el.result.style.opacity = '0.4';
    setTimeout(() => { el.result.style.opacity = '1'; }, 200);
    convert();
};

// ─── Debounce ─────────────────────────────────────────────────────────────────
const debounce = () => {
    clearTimeout(conversionTimeout);
    conversionTimeout = setTimeout(convert, 320);
};

// ─── Main conversion ──────────────────────────────────────────────────────────
const convert = async () => {
    if (!isOfflineMode) hideError();

    const rawAmt = el.amount.value;
    const amount = parseFloat(rawAmt);
    const from   = el.from.value;
    const to     = el.to.value;

    if (!rawAmt || isNaN(amount) || amount <= 0) {
        el.result.innerHTML = '<span class="placeholder">Enter a valid amount</span>';
        el.rate.textContent = '';
        return;
    }

    // Same currency shortcut
    if (from === to) {
        showResult(amount, amount, from, to);
        return;
    }

    // Load trends dynamically on the first valid conversion
    if (!trendsLoaded) {
        loadMarketTrends();
        trendsLoaded = true;
    }

    el.result.classList.add('loading');

    // ── Try live API first ──
    if (!isOfflineMode) {
        try {
            const controller = new AbortController();
            const timer = setTimeout(() => controller.abort(), 4000);
            const res = await fetch(`${API_BASE}/latest?amount=${amount}&from=${from}&to=${to}`, { signal: controller.signal });
            clearTimeout(timer);
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const data = await res.json();
            const result = data.rates[to];
            el.result.classList.remove('loading');
            showResult(amount, result, from, to);
            saveHistory(amount, result, from, to);
            loadHistory();
            if (lastChartPair !== `${from}-${to}`) {
                updateChart(from, to);
                lastChartPair = `${from}-${to}`;
            }
            return;
        } catch (err) {
            console.warn('Live conversion failed, falling back to static rates:', err.message);
            isOfflineMode = true;
        }
    }

    // ── Offline fallback ──
    const result = fallbackConvert(amount, from, to);
    el.result.classList.remove('loading');
    showResult(amount, result, from, to);
    saveHistory(amount, result, from, to);
    loadHistory();
};

// ─── Display result ───────────────────────────────────────────────────────────
const showResult = (amount, result, from, to) => {
    el.result.style.animation = 'none';
    void el.result.offsetHeight;
    el.result.style.animation  = '';
    el.result.textContent      = fmt(result, to);
    el.rate.textContent        = `1 ${from} = ${(result / amount).toFixed(6)} ${to}`;
    if (el.panelTitle) el.panelTitle.textContent = `${FLAGS[from] || ''} ${from} → ${FLAGS[to] || ''} ${to}`;
};

// ─── History ──────────────────────────────────────────────────────────────────
const saveHistory = (amount, result, from, to) => {
    const hist = JSON.parse(localStorage.getItem('currencyHistory') || '[]');
    if (hist.length && hist[0].amount === amount && hist[0].from === from && hist[0].to === to) return;
    hist.unshift({ id: Date.now(), amount, result, from, to });
    if (hist.length > 5) hist.pop();
    localStorage.setItem('currencyHistory', JSON.stringify(hist));
};

const loadHistory = () => {
    const hist = JSON.parse(localStorage.getItem('currencyHistory') || '[]');
    if (!hist.length) {
        el.history.innerHTML = '<li class="empty-history">No recent conversions</li>';
        return;
    }
    el.history.innerHTML = hist.map(h => `
        <li class="history-item" onclick="restoreHistory(${h.amount},'${h.from}','${h.to}')" title="Click to restore">
            <span class="history-amount">${h.amount} ${FLAGS[h.from] || ''} ${h.from} =</span>
            <span class="history-result">${fmt(h.result, h.to)}</span>
        </li>`).join('');
};

window.restoreHistory = (amount, from, to) => {
    el.amount.value = amount;
    el.from.value   = from;
    el.to.value     = to;
    convert();
    window.scrollTo({ top: 0, behavior: 'smooth' });
};

// ─── 7-day chart ─────────────────────────────────────────────────────────────
const updateChart = async (from, to) => {
    if (isOfflineMode) return; // no historical data in offline mode

    try {
        const end   = new Date();
        const start = new Date(); start.setDate(end.getDate() - 7);
        const fmt2  = d => d.toISOString().split('T')[0];

        const res = await fetch(`${API_BASE}/${fmt2(start)}..${fmt2(end)}?from=${from}&to=${to}`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();

        const labels = Object.keys(data.rates);
        const values = labels.map(d => data.rates[d][to]);

        el.chartBox.classList.remove('hidden');
        if (el.chartPairLabel) el.chartPairLabel.textContent = `${from} / ${to}`;
        renderChart(labels, values, to);
    } catch (err) {
        console.warn('Chart load failed:', err.message);
        el.chartBox.classList.add('hidden');
        lastChartPair = '';
    }
};

const renderChart = (labels, values, currency) => {
    if (chartInstance) chartInstance.destroy();

    const displayLabels = labels.map(s => {
        const d = new Date(s); return `${d.getMonth()+1}/${d.getDate()}`;
    });

    const isDark = document.body.classList.contains('dark-theme');
    const accentColor = isDark ? '#3b82f6' : '#2563eb';
    const accentGlow = isDark ? 'rgba(59,130,246,0.25)' : 'rgba(37,99,235,0.15)';
    const pointBg = isDark ? '#111827' : '#ffffff';
    const bodyColor = isDark ? '#f3f4f6' : '#0f172a';

    Chart.defaults.color       = isDark ? '#9ca3af' : '#64748b';
    Chart.defaults.font.family = "'DM Mono', monospace";

    const glowPlugin = {
        id: 'glow',
        beforeDatasetDraw: ({ ctx }) => {
            ctx.save();
            ctx.shadowColor = accentColor;
            ctx.shadowBlur  = 16;
        },
        afterDatasetDraw: ({ ctx }) => ctx.restore()
    };

    chartInstance = new Chart(el.chartCtx, {
        type: 'line',
        data: {
            labels: displayLabels,
            datasets: [{
                data:               values,
                borderColor:        accentColor,
                borderWidth:        2.5,
                tension:            0.45,
                pointBackgroundColor: accentColor,
                pointBorderColor:   pointBg,
                pointBorderWidth:   2,
                pointRadius:        4,
                pointHoverRadius:   6,
                fill:               false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: { display: false },
                tooltip: {
                    backgroundColor: isDark ? 'rgba(17,24,39,0.97)' : 'rgba(255,255,255,0.97)',
                    titleColor:      accentColor,
                    bodyColor:       bodyColor,
                    borderColor:     accentGlow,
                    borderWidth:     1,
                    padding:         12,
                    displayColors:   false,
                    callbacks: { label: ctx => fmt(ctx.parsed.y, currency) }
                }
            },
            scales: {
                x: { grid: { display: false } },
                y: {
                    grid:  { color: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)' },
                    ticks: { maxTicksLimit: 5 }
                }
            },
            animation: { duration: 900, easing: 'easeOutQuart' }
        },
        plugins: [glowPlugin]
    });
};

// ─── Boot ─────────────────────────────────────────────────────────────────────
document.addEventListener('DOMContentLoaded', init);
