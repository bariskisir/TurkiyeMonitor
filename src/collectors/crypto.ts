// Collects leading cryptocurrency quotes from Investing.com.

import type { MarketQuote } from '../domain/types.js';
import { scrape } from '../services/browser.js';

const excludedSymbols = new Set(['USDT', 'BNB']);

/** Fetches leading cryptocurrency prices for the crypto section. */
export async function fetch(): Promise<MarketQuote[]> {
  const quotes = await scrape(
    'https://www.investing.com/crypto/currencies',
    () => {
      const data: Array<{ name: string; price: string; changePercent: string }> = [];
      const table = document.querySelector('table');

      if (!table) {
        return data;
      }

      const rows = Array.from(table.querySelectorAll('tbody tr'));

      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td')).map((cell: Element) => cell.textContent?.trim() ?? '');

        if (cells.length < 6) {
          continue;
        }

        const nameText = cells[3];
        const price = cells[4];
        const changePercent = cells[5];

        if (nameText && price.includes('$')) {
          const lines = nameText.split('\n').map((line: string) => line.trim()).filter(Boolean);
          data.push({ name: lines[1] || lines[0] || '', price, changePercent });
        }

        if (data.length >= 5) {
          break;
        }
      }

      return data;
    },
    'table',
  );

  const filteredQuotes = quotes.filter((quote) => !excludedSymbols.has(quote.name));

  if (filteredQuotes.length === 0) {
    throw new Error('No crypto data found');
  }

  return filteredQuotes;
}
