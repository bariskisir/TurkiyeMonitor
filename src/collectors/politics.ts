// Collects current politics headlines from sondakika.com.

import * as cheerio from 'cheerio';
import type { NewsItem } from '../domain/types.js';
import httpClient from '../services/http-client.js';

/** Fetches politics headlines from sondakika.com. */
export async function fetch(): Promise<NewsItem[]> {
  const response = await httpClient.get<string>('https://www.sondakika.com/siyaset/');
  const $ = cheerio.load(response.data);
  const headlines: NewsItem[] = [];
  const seenTitles = new Set<string>();

  $('a').each((_, element) => {
    if (headlines.length >= 5) {
      return;
    }

    const anchor = $(element);
    const href = anchor.attr('href') || '';
    const title = anchor.text().trim();

    if (!isPoliticsNewsUrl(href) || title.length < 20 || seenTitles.has(title)) {
      return;
    }

    seenTitles.add(title);
    headlines.push({
      title,
      url: href.startsWith('http') ? href : `https://www.sondakika.com${href}`,
    });
  });

  if (headlines.length === 0) {
    throw new Error('No politics news found');
  }

  return headlines;
}

/** Checks whether a URL points to a politics article. */
function isPoliticsNewsUrl(href: string): boolean {
  return href.includes('/haber/') || href.includes('/politika/');
}
