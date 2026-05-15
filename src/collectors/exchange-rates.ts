// Collects key exchange-rate quotes from Investing.com.

import type { MarketQuote } from '../domain/types.js';
import { scrape } from '../services/browser.js';

const preferredOrder = ['USD/TRY', 'EUR/TRY', 'GBP/TRY', 'GAU/TRY', 'EUR/USD'];
const pairs = [
  { name: 'USD/TRY', slug: 'usd-try' },
  { name: 'EUR/TRY', slug: 'eur-try' },
  { name: 'GBP/TRY', slug: 'gbp-try' },
  { name: 'GAU/TRY', slug: 'gau-try' },
  { name: 'EUR/USD', slug: 'eur-usd' },
];

/** Fetches exchange-rate quotes in a stable display order. */
export async function fetch(): Promise<MarketQuote[]> {
  const quotes = await scrapeInvestingPairs();

  if (quotes.length === 0) {
    throw new Error('No exchange rate data found');
  }

  return quotes.sort((left, right) => resolvePairOrder(left.name) - resolvePairOrder(right.name));
}

/** Assigns each exchange pair to its preferred display position. */
function resolvePairOrder(pairName: string): number {
  const orderIndex = preferredOrder.indexOf(pairName);
  return orderIndex === -1 ? Number.MAX_SAFE_INTEGER : orderIndex;
}

/** Scrapes the configured currency pair pages concurrently. */
async function scrapeInvestingPairs(): Promise<MarketQuote[]> {
  const requests = pairs.map((pair) =>
    scrape(
      `https://www.investing.com/currencies/${pair.slug}`,
      () => {
        const last = document.querySelector('[data-test="instrument-price-last"]')?.textContent?.trim();
        const changePercent = document.querySelector('[data-test="instrument-price-change-percent"]')?.textContent?.trim();
        return last ? { last, changePercent: changePercent || '-' } : null;
      },
      '[data-test="instrument-price-last"]',
    )
      .then((quote) => (quote ? { name: pair.name, ...quote } : null))
      .catch(() => null),
  );

  const results = await Promise.all(requests);
  return results.filter((quote): quote is NonNullable<typeof quote> => quote !== null);
}
