// Formats collected agenda data into a compact three-column terminal report.

import chalk from 'chalk';
import type {
  AgendaResultLike,
  Earthquake,
  FuelPrice,
  Language,
  MarketQuote,
  NewsItem,
  TranslationBundle,
  TrendTopic,
  WeatherForecast,
  YoutubeVideo,
} from '../domain/types.js';
import { getTranslations } from './i18n.js';

const ANSI_PATTERN = /\u001b\[[0-9;]*m/g;

/** Formats an agenda result for terminal output. */
export function formatOutput(result: AgendaResultLike, language: Language): string {
  const translations = getTranslations(language);
  const width = Math.floor((process.stdout.columns || 150) * 0.98);
  const firstColumnWidth = Math.floor((width - 4) * 0.25);
  const secondColumnWidth = Math.floor((width - 4) * 0.45);
  const thirdColumnWidth = Math.floor((width - 4) * 0.3);
  const lines: string[] = [];
  const firstColumn: string[] = [];
  const secondColumn: string[] = [];
  const thirdColumn: string[] = [];

  lines.push(chalk.bold.cyan(` ${translations.appTitle} | ${new Date().toLocaleString(language === 'tr' ? 'tr-TR' : 'en-US')} `));
  lines.push(chalk.gray('═'.repeat(Math.min(width, 200))));

  buildExchangeRates(firstColumn, result.exchangeRates, translations);
  buildStocks(firstColumn, result.stocks, translations);
  buildMagnificentSeven(firstColumn, result.magnificentSevenStocks, translations);
  buildCrypto(firstColumn, result.crypto, translations);
  buildFuelPrices(firstColumn, result.fuelPrices, translations);

  buildEconomicNews(secondColumn, result.economicNews, translations, secondColumnWidth);
  buildPolitics(secondColumn, result.politics, translations, secondColumnWidth);
  buildTuikStats(secondColumn, result.tuikStats, translations);
  buildEarthquakes(secondColumn, result.earthquakes, translations);

  buildTwitterTrends(thirdColumn, result.twitterTrends, translations, thirdColumnWidth);
  buildEksiSozluk(thirdColumn, result.eksiSozluk, translations);
  buildYoutubeTrends(thirdColumn, result.youtubeTrends, translations);
  buildWeather(thirdColumn, result.weather, translations);

  const maxLength = Math.max(firstColumn.length, secondColumn.length, thirdColumn.length);
  const separator = chalk.gray(' ║ ');

  for (let index = 0; index < maxLength; index += 1) {
    const first = padToWidth(firstColumn[index] ?? dottedPadding(firstColumnWidth), firstColumnWidth);
    const second = padToWidth(secondColumn[index] ?? dottedPadding(secondColumnWidth), secondColumnWidth);
    const third = padToWidth(thirdColumn[index] ?? dottedPadding(thirdColumnWidth), thirdColumnWidth);
    lines.push(`${first}${separator}${second}${separator}${third}`);
  }

  lines.push(chalk.gray('═'.repeat(Math.min(width, 200))));
  return lines.join('\n');
}

/** Removes ANSI escape sequences from a string. */
function stripAnsi(value: string): string {
  return value.replace(ANSI_PATTERN, '');
}

/** Calculates the visible terminal width of a formatted string. */
function visibleLength(value: string): number {
  return Array.from(stripAnsi(value)).length;
}

/** Creates a subtle placeholder line for an empty table cell. */
function dottedPadding(width: number): string {
  return chalk.dim.gray(` ${'· '.repeat(Math.max(0, Math.floor((width - 2) / 2)))}`);
}

/** Pads or truncates a string to a target visible terminal width. */
function padToWidth(value: string, width: number): string {
  const visible = visibleLength(value);

  if (visible >= width) {
    return truncateToWidth(value, width);
  }

  return `${value}${' '.repeat(width - visible)}`;
}

/** Truncates a possibly colorized string without breaking ANSI color codes. */
function truncateToWidth(value: string, width: number): string {
  const output: string[] = [];
  let visible = 0;
  let inEscapeSequence = false;
  let escapeBuffer = '';

  for (const character of value) {
    if (character === '\u001b') {
      inEscapeSequence = true;
      escapeBuffer = character;
      continue;
    }

    if (inEscapeSequence) {
      escapeBuffer += character;
      if (character === 'm') {
        output.push(escapeBuffer);
        inEscapeSequence = false;
        escapeBuffer = '';
      }
      continue;
    }

    if (visible >= width - 1) {
      output.push('…');
      break;
    }

    output.push(character);
    visible += 1;
  }

  while (visible < width) {
    output.push(' ');
    visible += 1;
  }

  return output.join('');
}

/** Formats a section heading for terminal output. */
function sectionHeader(title: string): string {
  return chalk.dim.yellow(`▸ ${title}`);
}

/** Formats the standard section-level error message. */
function errorMessage(translations: TranslationBundle): string {
  return chalk.dim.red(`  ⚠ ${translations.errorOccurred}`);
}

/** Applies positive, negative, or neutral color to numeric change values. */
function colorizeValue(text: string | null | undefined): string {
  if (!text || text === '-') {
    return text || '-';
  }

  const numericValue = Number.parseFloat(String(text).replace(/[%,\s+()]/g, '').replace(',', '.'));

  if (Number.isNaN(numericValue)) {
    return text;
  }

  if (numericValue > 0) {
    return chalk.green(text.replace(/[()]/g, ''));
  }

  if (numericValue < 0) {
    return chalk.red(text.replace(/[()]/g, ''));
  }

  return chalk.gray(text);
}

/** Truncates a plain string to the requested character length. */
function truncate(value: string | null | undefined, length: number): string {
  if (!value) {
    return '-';
  }

  return value.length <= length ? value : `${value.substring(0, length - 3)}…`;
}

/** Appends exchange-rate rows to a formatter column. */
function buildExchangeRates(column: string[], data: MarketQuote[] | null, translations: TranslationBundle): void {
  column.push(sectionHeader(translations.sections.exchangeRates));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  for (const item of data) {
    column.push(chalk.dim(` ${item.name.padEnd(10)}${(item.last || '-').padEnd(12)}${colorizeValue(item.changePercent)}`));
  }
}

/** Appends stock-index rows to a formatter column. */
function buildStocks(column: string[], data: MarketQuote[] | null, translations: TranslationBundle): void {
  column.push(sectionHeader(translations.sections.stocks));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  for (const item of data) {
    column.push(chalk.dim(` ${truncate(item.name, 11).padEnd(12)}${(item.last || '-').padEnd(10)}${colorizeValue(item.changePercent)}`));
  }
}

/** Appends crypto-market rows to a formatter column. */
function buildCrypto(column: string[], data: MarketQuote[] | null, translations: TranslationBundle): void {
  column.push(sectionHeader(translations.sections.crypto));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  for (const item of data) {
    column.push(chalk.dim(` ${truncate(item.name, 5).padEnd(6)}${(item.price || '-').padEnd(10)}${colorizeValue(item.changePercent)}`));
  }
}

/** Appends fuel-price rows to a formatter column. */
function buildFuelPrices(column: string[], data: FuelPrice[] | null, translations: TranslationBundle): void {
  column.push(sectionHeader(translations.sections.fuelPrices));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  for (const item of data) {
    const displayName = item.productName.split(' ').slice(1).join(' ') || item.productName;
    column.push(chalk.dim(` ${displayName.padEnd(16)} ${item.amount} ₺`));
  }
}

/** Appends TUIK indicator rows to a formatter column. */
function buildTuikStats(column: string[], data: AgendaResultLike['tuikStats'], translations: TranslationBundle): void {
  column.push(sectionHeader(translations.sections.tuikStats));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  if (data.cpi) {
    column.push(chalk.dim(` ${translations.tuikCpiLabel}: %${data.cpi.value} (${formatPeriod(data.cpi.period, translations)})`));
  }

  if (data.unemployment) {
    column.push(chalk.dim(` ${translations.tuikUnemploymentLabel}: %${data.unemployment.value} (${formatPeriod(data.unemployment.period, translations)})`));
  }

  if (data.gdp) {
    column.push(chalk.dim(` ${translations.tuikGdpLabel}: %${data.gdp.value} (${formatPeriod(data.gdp.period, translations)})`));
  }

  if (data.consumerConfidence) {
    column.push(chalk.dim(` ${translations.tuikConsumerConfidenceLabel}: ${data.consumerConfidence.value} (${formatPeriod(data.consumerConfidence.period, translations)})`));
  }
}

/** Appends economic-news rows to a formatter column. */
function buildEconomicNews(column: string[], data: NewsItem[] | null, translations: TranslationBundle, columnWidth: number): void {
  appendNewsSection(column, data, translations.sections.economicNews, translations, columnWidth, 8);
}

/** Appends politics-news rows to a formatter column. */
function buildPolitics(column: string[], data: NewsItem[] | null, translations: TranslationBundle, columnWidth: number): void {
  appendNewsSection(column, data, translations.sections.politics, translations, columnWidth, 6);
}

/** Appends a wrapped news section to a formatter column. */
function appendNewsSection(
  column: string[],
  data: NewsItem[] | null,
  title: string,
  translations: TranslationBundle,
  columnWidth: number,
  limit: number,
): void {
  column.push(sectionHeader(title));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  for (const item of data.slice(0, limit)) {
    const fullTitle = `- ${item.title}`;
    const maxPerLine = columnWidth - 3;

    if (fullTitle.length > maxPerLine) {
      column.push(chalk.dim(` ${fullTitle.substring(0, maxPerLine)}`));
      column.push(chalk.dim(` ${truncate(fullTitle.substring(maxPerLine), maxPerLine)}`));
      continue;
    }

    column.push(chalk.dim(` ${fullTitle}`));
  }
}

/** Appends earthquake rows to a formatter column. */
function buildEarthquakes(column: string[], data: Earthquake[] | null, translations: TranslationBundle): void {
  column.push(sectionHeader(translations.sections.earthquakes));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  if (data.length === 0) {
    column.push(chalk.dim.gray(`  ${translations.noData}`));
    return;
  }

  for (const earthquake of data) {
    const magnitude = earthquake.magnitude >= 5 ? chalk.red.bold(earthquake.magnitude.toFixed(1)) : chalk.yellow(earthquake.magnitude.toFixed(1));
    const location = truncate(earthquake.location, 27).padEnd(28);
    const time = earthquake.time.split(' ')[1] || earthquake.time;
    column.push(chalk.dim(` ${magnitude}  ${location}${truncate(time, 16)}`));
  }
}

/** Appends Twitter trend rows to a formatter column. */
function buildTwitterTrends(column: string[], data: TrendTopic[] | null, translations: TranslationBundle, columnWidth: number): void {
  column.push(sectionHeader(translations.sections.twitterTrends));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  const words = data.map((trend) => trend.topic).join(' | ').split(' ');
  let currentLine = '';

  for (const word of words) {
    if (currentLine.length + word.length + 1 > columnWidth - 2) {
      column.push(chalk.dim(` ${currentLine}`));
      currentLine = word;
      continue;
    }

    currentLine += `${currentLine.length === 0 ? '' : ' '}${word}`;
  }

  if (currentLine) {
    column.push(chalk.dim(` ${currentLine}`));
  }
}

/** Appends Eksi Sozluk agenda rows to a formatter column. */
function buildEksiSozluk(column: string[], data: TrendTopic[] | null, translations: TranslationBundle): void {
  column.push(sectionHeader(translations.sections.eksiSozluk));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  for (const topic of data) {
    column.push(chalk.dim(` ${truncate(topic.title, 45).padEnd(46)}${topic.entries || '-'}`));
  }
}

/** Appends YouTube trend rows to a formatter column. */
function buildYoutubeTrends(column: string[], data: YoutubeVideo[] | null, translations: TranslationBundle): void {
  column.push(sectionHeader(translations.sections.youtubeTrends));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  for (const video of data) {
    column.push(chalk.dim(` ${truncate(video.title, 55)}`));
  }
}

/** Appends weather forecast rows to a formatter column. */
function buildWeather(column: string[], data: WeatherForecast[] | null, translations: TranslationBundle): void {
  column.push(sectionHeader(translations.sections.weather));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  for (const forecast of data) {
    const city = `${forecast.city}${' '.repeat(Math.max(1, 10 - visibleLength(forecast.city)))}`;
    column.push(chalk.dim(` ${city} ${forecast.range.padStart(11)} ${truncate(forecast.condition, 30)}`));
  }
}

/** Converts numeric month periods to localized month names. */
function formatPeriod(dateText: string | null | undefined, translations: TranslationBundle): string {
  if (!dateText) {
    return '-';
  }

  const parts = dateText.split('/');

  if (parts.length === 2) {
    const monthName = translations.months[Number.parseInt(parts[1], 10)] || parts[1];
    return `${parts[0]} ${monthName}`;
  }

  return dateText;
}

/** Appends Magnificent Seven stock rows to a formatter column. */
function buildMagnificentSeven(column: string[], data: MarketQuote[] | null, translations: TranslationBundle): void {
  column.push(sectionHeader(translations.sections.magnificentSevenStocks));

  if (!data) {
    column.push(errorMessage(translations));
    return;
  }

  for (const item of data) {
    column.push(chalk.dim(` ${item.ticker?.padEnd(6) ?? item.name.padEnd(6)}${(item.price || '-').padEnd(10)}${colorizeValue(item.changePercent)}`));
  }
}
