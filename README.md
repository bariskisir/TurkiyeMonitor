# TurkiyeMonitor 🇹🇷

A professional CLI tool for monitoring Turkiye's agenda in real time. Get economic data, news, social trends, earthquakes, weather, and market snapshots from your terminal.

<img src="screenshot.png" alt="Screenshot" width="50%">

[![GitHub](https://img.shields.io/badge/GitHub-bariskisir-black?logo=github)](https://github.com/bariskisir/TurkiyeMonitor)
[![NPM](https://img.shields.io/badge/NPM-turkiyemonitor-red?logo=npm)](https://www.npmjs.com/package/turkiyemonitor)


## Installation

```bash
npm install -g turkiyemonitor
```


## Usage

```bash
turkiyemonitor
turkiyemonitor --lang tr
turkiyemonitor --lang en
```

| Option | Description | Default |
|--------|-------------|---------|
| `--lang` | Output language (`tr` or `en`) | Auto-detect from OS |
| `--log` | Show application logs | - |
| `--version` | Show version | - |
| `--help` | Show help | - |


## Modules

| # | Module | Source |
|---|--------|--------|
| 1 | 💱 Exchange Rates | investing.com |
| 2 | 📈 BIST 100 Stocks | investing.com |
| 3 | 🪙 Crypto Assets | investing.com |
| 4 | ⛽ Fuel Prices | petrolofisi |
| 5 | 📊 TUIK Indicators | tuik |
| 6 | 📰 Economic News | bloomberght.com |
| 7 | 🐦 Twitter Trends | getdaytrends.com |
| 8 | 🏛️ Politics News | sondakika.com |
| 9 | 💬 Ekşi Sözlük Agenda | eksisozluk.com |
| 10 | 🌍 Earthquakes (4+) | kandilli |
| 11 | ▶️ YouTube Trends | yttrendz.com |
| 12 | 🌦️ Weather | mgm.gov.tr |


## License

MIT
