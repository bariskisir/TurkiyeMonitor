// Collects Istanbul fuel prices from Petrol Ofisi.

import * as cheerio from 'cheerio';
import type { FuelPrice } from '../domain/types.js';
import httpClient from '../services/http-client.js';

const wantedProducts = ['V/Max Kurşunsuz 95', 'V/Max Diesel', 'PO/gaz Otogaz'];

/** Fetches selected fuel prices for Istanbul Europe. */
export async function fetch(): Promise<FuelPrice[]> {
  const response = await httpClient.get<string>('https://www.petrolofisi.com.tr/akaryakit-fiyatlari');
  const $ = cheerio.load(response.data);
  const results = [...extractTablePrices($), ...extractListPrices($)];

  if (results.length === 0) {
    throw new Error('No fuel price data found');
  }

  return deduplicatePrices(results);
}

/** Extracts fuel prices from the desktop table layout. */
function extractTablePrices($: cheerio.CheerioAPI): FuelPrice[] {
  const headers: string[] = [];
  const prices: FuelPrice[] = [];

  $('table.table-prices thead th').each((_, element) => {
    headers.push($(element).text().trim());
  });

  const row = $('tr[data-disctrict-name="ISTANBUL (AVRUPA)"]').first();

  if (!row.length || headers.length <= 1) {
    return prices;
  }

  row.find('td').each((index, element) => {
    const productName = headers[index] || '';

    if (!wantedProducts.includes(productName)) {
      return;
    }

    const price = $(element).find('span.with-tax').text().trim();

    if (price) {
      prices.push({ productName, amount: Number.parseFloat(price.replace(',', '.')) });
    }
  });

  return prices;
}

/** Extracts fuel prices from the responsive list layout. */
function extractListPrices($: cheerio.CheerioAPI): FuelPrice[] {
  const prices: FuelPrice[] = [];

  $('li').each((_, element) => {
    const item = $(element);

    if (!item.text().trim().startsWith('ISTANBUL (AVRUPA)')) {
      return;
    }

    item.find('div.mt-2').each((_, block) => {
      const productName = $(block).find('.text-primary').text().trim();

      if (!wantedProducts.includes(productName)) {
        return;
      }

      const priceMatch = $(block).text().match(/([\d.]+)\s*TL/);

      if (priceMatch) {
        prices.push({ productName, amount: Number.parseFloat(priceMatch[1].replace(',', '.')) });
      }
    });
  });

  return prices;
}

/** Removes duplicate prices when both page layouts are present. */
function deduplicatePrices(prices: FuelPrice[]): FuelPrice[] {
  const seen = new Set<string>();

  return prices.filter((price) => {
    if (seen.has(price.productName)) {
      return false;
    }

    seen.add(price.productName);
    return true;
  });
}
