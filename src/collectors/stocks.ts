// Collects major global stock-index quotes with BIST 100 prioritized.

import type { MarketQuote } from '../domain/types.js';
import { scrape } from '../services/browser.js';

const targetIndices = ['BIST 100', 'Nasdaq', 'S&P 500', 'Dow Jones', 'DAX'];

/** Fetches major stock index quotes for the market section. */
export async function fetch(): Promise<MarketQuote[]> {
  const [scrapedIndices, bistIndex] = await Promise.all([scrapeMajorIndices(), scrapeBistIndex()]);
  const indices = [...scrapedIndices];

  if (bistIndex && !indices.some((index) => index.name.includes('BIST'))) {
    indices.unshift(bistIndex);
  }

  const filtered = selectTargetIndices(indices);

  if (filtered.length === 0) {
    throw new Error('No stock indices data found');
  }

  return filtered.slice(0, 5);
}

/** Selects preferred indices first and fills remaining slots from scraped data. */
function selectTargetIndices(indices: MarketQuote[]): MarketQuote[] {
  const selected: MarketQuote[] = [];

  for (const target of targetIndices) {
    const found = indices.find((index) => index.name.toLowerCase().includes(target.toLowerCase()));
    if (found) {
      selected.push(found);
    }
  }

  if (selected.length < 3) {
    for (const index of indices) {
      if (!selected.some((item) => item.name === index.name)) {
        selected.push(index);
      }

      if (selected.length >= 5) {
        break;
      }
    }
  }

  return selected;
}

/** Scrapes the Investing.com major indices table. */
async function scrapeMajorIndices(): Promise<MarketQuote[]> {
  try {
    return await scrape(
      'https://www.investing.com/indices/major-indices',
      () => {
        const data: Array<{ name: string; last: string; changePercent: string }> = [];
        const rows = document.querySelectorAll('table tbody tr');

        rows.forEach((row) => {
          const cells = row.querySelectorAll('td');

          if (cells.length < 7) {
            return;
          }

          const name = cells[1]?.textContent?.trim()?.split('\n')[0];
          const last = cells[2]?.textContent?.trim();
          const changePercent = cells[6]?.textContent?.trim();

          if (name && last) {
            data.push({ name, last, changePercent: changePercent || '-' });
          }
        });

        return data;
      },
      'table tbody tr',
    );
  } catch {
    return [];
  }
}

/** Scrapes the dedicated BIST 100 quote page as a fallback source. */
async function scrapeBistIndex(): Promise<MarketQuote | null> {
  try {
    return await scrape(
      'https://www.investing.com/indices/ise-100',
      () => {
        const last = document.querySelector('[data-test="instrument-price-last"]')?.textContent?.trim();
        const changePercent = document.querySelector('[data-test="instrument-price-change-percent"]')?.textContent?.trim();
        return last ? { name: 'BIST 100', last, changePercent: changePercent || '-' } : null;
      },
      '[data-test="instrument-price-last"]',
    );
  } catch {
    return null;
  }
}
