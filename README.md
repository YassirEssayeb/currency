<div align="center">

# 💱 FX Exchange — Live Currency Converter

**Real-time currency conversion with 7-day rate charts and market trends**

![Version](https://img.shields.io/badge/version-2.0.0-blue)
![Status](https://img.shields.io/badge/status-stable-brightgreen)
![License](https://img.shields.io/github/license/YassirEssayeb/currency)
![Stars](https://img.shields.io/github/stars/YassirEssayeb/currency?style=social)
![Built with](https://img.shields.io/badge/built%20with-Vanilla%20JS-ffdd54)

</div>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🪙 **Live exchange rates** | Powered by the [Frankfurter API](https://frankfurter.app) |
| 📈 **7-day rate chart** | Interactive Chart.js graph with real-time updates |
| 🔄 **Swap currencies** | One-click swap between source and target currency |
| 💾 **Conversion history** | Last 5 conversions stored in `localStorage` |
| 📉 **Market trends** | Sparkline widgets with daily % change for major pairs |
| 🌙 **Dark / Light theme** | Persistent theme preference |
| 🌍 **i18n** | English, Spanish & Arabic with full RTL support |
| 🕸️ **Offline fallback** | Graceful degradation with static EUR-based rates |
| ⚡ **Optimistic UI** | Skeleton loaders, debounced input & smooth animations |

## 🚀 Quick Start

Clone the repository and open `index.html` in your browser — no build step required.

```bash
git clone https://github.com/YassirEssayeb/currency.git
cd currency
```

Or just open the file:

```
start index.html
```

### 🔗 Live Demo

> **Coming soon** — deploy via GitHub Pages:
> 1. `Settings → Pages → Source: GitHub Actions`
> 2. Push to `main` — the workflow deploys automatically.

## 🛠️ Tech Stack

- **100% Vanilla JavaScript** — no frameworks
- **HTML5 + CSS3** — custom design system with CSS variables
- **[Chart.js](https://www.chartjs.org/)** — via CDN, for rate charts
- **[Frankfurter API](https://frankfurter.app)** — ECB daily reference rates
- **localStorage** — history, theme & language persistence

## 📁 Project Structure

```
currency/
├── index.html      # Single-page layout (sidebar + panel)
├── style.css       # Design system, themes, RTL & responsive rules
├── script.js       # App logic: API, charts, trends, i18n
├── favicon.svg     # Brand icon
├── LICENSE         # MIT license
└── .github/
    └── workflows/
        └── ci.yml # Automated lint & deployment checks
```

## 🧠 How It Works

1. On load, the app fetches available currencies from the Frankfurter API (5s timeout).
2. If the API is unreachable, it switches to **offline mode** using embedded static EUR-based rates.
3. Each valid amount triggers a conversion request; results are cached in history.
4. Trends and the 7-day chart are fetched lazily on the first conversion.

## 📋 API Reference

```
GET https://api.frankfurter.app/currencies           # List of currencies
GET https://api.frankfurter.app/latest?amount=100&from=USD&to=EUR
GET https://api.frankfurter.app/YYYY-MM-DD..YYYY-MM-DD?from=EUR
```

## 🤝 Contributing

Contributions, issues and feature requests are welcome! Feel free to check the [issues page](https://github.com/YassirEssayeb/currency/issues).

## 📄 License

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  Made with ❤️ by <a href="https://github.com/YassirEssayeb">YassirEssayeb</a>
</div>