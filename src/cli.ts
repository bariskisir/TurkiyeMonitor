#!/usr/bin/env node
// Provides the TurkiyeMonitor command-line entry point and option handling.

import { Command } from 'commander';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { formatOutput } from './core/formatter.js';
import { runAgendaCollectors } from './core/runner.js';
import type { Language } from './domain/types.js';

const program = new Command();
const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const logFilePath = path.join(currentDirectory, '..', 'log.txt');

/** Detects the preferred output language from the runtime locale. */
function detectLanguage(): Language {
  const locale =
    Intl.DateTimeFormat().resolvedOptions().locale ||
    process.env.LANG ||
    process.env.LC_ALL ||
    process.env.LC_MESSAGES ||
    os.platform();
  const language = locale.toLowerCase().slice(0, 2);

  return language === 'tr' || language === 'en' ? language : 'en';
}

/** Normalizes user-supplied language values to supported language codes. */
function resolveLanguage(language: string): Language {
  return language === 'tr' || language === 'en' ? language : 'en';
}

/** Prints the application log file when it exists. */
function printLogFile(): void {
  if (fs.existsSync(logFilePath)) {
    console.log(fs.readFileSync(logFilePath, 'utf8'));
    return;
  }

  console.log('No log file found.');
}

program
  .name('turkiyemonitor')
  .description('A CLI tool for monitoring Turkiye agenda data in real time.')
  .version('1.1.0')
  .option('--lang <language>', 'Output language (tr or en)', detectLanguage())
  .option('--log', 'Show application logs')
  .action(async (options: { lang: string; log?: boolean }) => {
    if (options.log) {
      printLogFile();
      process.exit(0);
    }

    try {
      const language = resolveLanguage(options.lang);
      const result = await runAgendaCollectors(language);
      console.log(formatOutput(result, language));
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error(`Fatal error: ${message}`);
      process.exit(1);
    }
  });

program.parse();
