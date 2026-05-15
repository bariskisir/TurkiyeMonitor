// Collects the Magnificent Seven stock quotes from Investing.com.

import type { MarketQuote } from '../domain/types.js';
import { scrape } from '../services/browser.js';

const magnificentSevenStocks = [
  { slug: 'nvidia-corp', ticker: 'NVDA' },
  { slug: 'apple-computer-inc', ticker: 'AAPL' },
  { slug: 'google-inc', ticker: 'GOOGL' },
  { slug: 'microsoft-corp', ticker: 'MSFT' },
  { slug: 'amazon-com-inc', ticker: 'AMZN' },
  { slug: 'facebook-inc', ticker: 'META' },
  { slug: 'tesla-motors', ticker: 'TSLA' },
];

/** Fetches Magnificent Seven stock quotes in display order. */
export async function fetch(): Promise<MarketQuote[]> {
  const results: MarketQuote[] = [];

  for (const stock of magnificentSevenStocks) {
    const quote = await scrapeStock(stock.slug, stock.ticker);

    if (quote) {
      results.push(quote);
    }
  }

  if (results.length === 0) {
    throw new Error('No Magnificent Seven stock data found');
  }

  return results;
}

/** Scrapes a single stock quote page from Investing.com. */
async function scrapeStock(slug: string, ticker: string): Promise<MarketQuote | null> {
  try {
    const quote = await scrape(
      `https://www.investing.com/equities/${slug}`,
      () => {
        const price = document.querySelector('[data-test="instrument-price-last"]')?.textContent?.trim();
        const changePercent = document.querySelector('[data-test="instrument-price-change-percent"]')?.textContent?.trim();
        return price ? { price, changePercent: changePercent || '-' } : null;
      },
      '[data-test="instrument-price-last"]',
    );

    return quote ? { name: ticker, ticker, price: quote.price, changePercent: quote.changePercent } : null;
  } catch {
    return null;
  }
}
