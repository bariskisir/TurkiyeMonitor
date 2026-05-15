// Coordinates all agenda collectors and returns a single normalized result.

import chalk from 'chalk';
import cliProgress from 'cli-progress';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import * as cryptoCollector from '../collectors/crypto.js';
import * as earthquakesCollector from '../collectors/earthquakes.js';
import * as economicNewsCollector from '../collectors/economic-news.js';
import * as eksisozlukCollector from '../collectors/eksi-sozluk.js';
import * as exchangeRatesCollector from '../collectors/exchange-rates.js';
import * as fuelPricesCollector from '../collectors/fuel-prices.js';
import * as magnificentSevenCollector from '../collectors/magnificent-seven-stocks.js';
import * as politicsCollector from '../collectors/politics.js';
import * as stocksCollector from '../collectors/stocks.js';
import * as tuikStatsCollector from '../collectors/tuik-stats.js';
import * as twitterTrendsCollector from '../collectors/twitter-trends.js';
import * as weatherCollector from '../collectors/weather.js';
import * as youtubeTrendsCollector from '../collectors/youtube-trends.js';
import { AgendaResult } from '../domain/agenda-result.js';
import type { AgendaResultData, Collector, Language, ResultKey, SectionKey } from '../domain/types.js';
import { closeBrowser } from '../services/browser.js';
import { getTranslations } from './i18n.js';

type CollectorDefinition = {
  key: ResultKey;
  collector: Collector<unknown>;
  section: SectionKey;
};

const collectors: CollectorDefinition[] = [
  { key: 'exchangeRates', collector: exchangeRatesCollector, section: 'exchangeRates' },
  { key: 'stocks', collector: stocksCollector, section: 'stocks' },
  { key: 'crypto', collector: cryptoCollector, section: 'crypto' },
  { key: 'fuelPrices', collector: fuelPricesCollector, section: 'fuelPrices' },
  { key: 'tuikStats', collector: tuikStatsCollector, section: 'tuikStats' },
  { key: 'economicNews', collector: economicNewsCollector, section: 'economicNews' },
  { key: 'twitterTrends', collector: twitterTrendsCollector, section: 'twitterTrends' },
  { key: 'politics', collector: politicsCollector, section: 'politics' },
  { key: 'eksiSozluk', collector: eksisozlukCollector, section: 'eksiSozluk' },
  { key: 'earthquakes', collector: earthquakesCollector, section: 'earthquakes' },
  { key: 'youtubeTrends', collector: youtubeTrendsCollector, section: 'youtubeTrends' },
  { key: 'weather', collector: weatherCollector, section: 'weather' },
  { key: 'magnificentSevenStocks', collector: magnificentSevenCollector, section: 'magnificentSevenStocks' },
];

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const logFilePath = path.join(currentDirectory, '..', '..', 'log.txt');

/** Appends collector errors to the package log file without breaking the CLI. */
function logCollectorError(collectorName: string, error: unknown): void {
  const message = error instanceof Error ? error.message : String(error);
  const timestamp = new Date().toISOString();

  try {
    fs.appendFileSync(logFilePath, `[${timestamp}] [${collectorName}] ${message}\n`, 'utf8');
  } catch {
    // Logging must never prevent the CLI from producing partial results.
  }
}

/** Creates the progress bar used while collectors run in parallel. */
function createProgressBar(): cliProgress.SingleBar {
  return new cliProgress.SingleBar(
    {
      format: `${chalk.cyan('{bar}')} | {percentage}% | {value}/{total} | ${chalk.yellow('{module}')}`,
      barCompleteChar: '█',
      barIncompleteChar: '░',
      hideCursor: true,
      clearOnComplete: true,
    },
    cliProgress.Presets.shades_grey,
  );
}

/** Runs every agenda collector and returns a normalized agenda snapshot. */
export async function runAgendaCollectors(language: Language): Promise<AgendaResult> {
  const translations = getTranslations(language);
  const resultData = {} as Partial<Record<ResultKey, unknown>>;
  const progressBar = createProgressBar();
  let completedCount = 0;

  console.log(chalk.bold.cyan(`${translations.fetchingModule}...`));
  progressBar.start(collectors.length, 0, { module: '...' });

  const tasks = collectors.map(async (definition) => {
    try {
      resultData[definition.key] = await definition.collector.fetch();
    } catch (error) {
      resultData[definition.key] = null;
      logCollectorError(definition.key, error);
    } finally {
      completedCount += 1;
      progressBar.update(completedCount, {
        module: translations.sections[definition.section] ?? definition.key,
      });
    }
  });

  await Promise.all(tasks);
  progressBar.stop();
  console.log(chalk.green(`✓ ${translations.moduleComplete}`));

  await closeBrowser();

  return new AgendaResult(resultData as Partial<AgendaResultData>);
}
