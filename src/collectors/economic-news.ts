// Collects current economy headlines from Bloomberg HT.

import * as cheerio from 'cheerio';
import type { NewsItem } from '../domain/types.js';
import httpClient from '../services/http-client.js';

/** Fetches economy headlines from Bloomberg HT. */
export async function fetch(): Promise<NewsItem[]> {
  const response = await httpClient.get<string>('https://www.bloomberght.com/haberler');
  const $ = cheerio.load(response.data);
  const headlines: NewsItem[] = [];
  const seenTitles = new Set<string>();

  $('a').each((_, element) => {
    if (headlines.length >= 6) {
      return;
    }

    const anchor = $(element);
    const href = anchor.attr('href') || '';
    const title = normalizeHeadline(anchor.text());

    if (!isBloombergNewsUrl(href) || !isUsableHeadline(title) || seenTitles.has(title)) {
      return;
    }

    seenTitles.add(title);
    headlines.push({
      title,
      url: href.startsWith('http') ? href : `https://www.bloomberght.com${href}`,
    });
  });

  if (headlines.length === 0) {
    throw new Error('No economic news found');
  }

  return headlines;
}

/** Removes page chrome text from a scraped headline. */
function normalizeHeadline(text: string): string {
  return text.replace(/^HABERLER\s*/i, '').replace(/^Haberler\s*/i, '').trim();
}

/** Checks whether a Bloomberg HT URL points to an article. */
function isBloombergNewsUrl(href: string): boolean {
  if (!href || href === '/' || href === '#' || href.includes('javascript')) {
    return false;
  }

  if (href.includes('/kategori') || href.includes('/etiket') || href === '/haberler') {
    return false;
  }

  return /^\/[a-z0-9-]+-\d{5,}$/.test(href) || (href.includes('bloomberght.com/') && /\d{5,}$/.test(href));
}

/** Checks whether a headline has enough content for display. */
function isUsableHeadline(title: string): boolean {
  return title.length >= 20;
}
