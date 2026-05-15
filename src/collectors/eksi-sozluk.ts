// Collects the current Eksi Sozluk agenda topics.

import * as cheerio from 'cheerio';
import type { TrendTopic } from '../domain/types.js';
import httpClient from '../services/http-client.js';

type EksiTopic = TrendTopic & {
  topicId: number;
};

/** Fetches current agenda topics from Eksi Sozluk. */
export async function fetch(): Promise<TrendTopic[]> {
  const response = await httpClient.get<string>('https://eksisozluk.com/basliklar/gundem');
  const $ = cheerio.load(response.data);
  const topics: EksiTopic[] = [];

  $('ul.topic-list li a').each((_, element) => {
    const anchor = $(element);
    const fullText = anchor.text().trim();
    const entries = anchor.find('small').text().trim();
    const title = fullText.replace(entries, '').trim();
    const href = anchor.attr('href') || '';
    const topicId = parseTopicId(href);

    if (title) {
      topics.push({
        title,
        entries: entries || '-',
        url: `https://eksisozluk.com${href}`,
        topicId,
      });
    }
  });

  if (topics.length === 0) {
    throw new Error('No Eksi Sozluk topics found');
  }

  return topics
    .sort((left, right) => right.topicId - left.topicId)
    .slice(0, 5)
    .map(({ title, entries, url }) => ({ title, entries, url }));
}

/** Extracts the numeric Eksi Sozluk topic id from a topic URL. */
function parseTopicId(href: string): number {
  const match = href.match(/--(\d+)/);
  return match ? Number.parseInt(match[1], 10) : 0;
}
