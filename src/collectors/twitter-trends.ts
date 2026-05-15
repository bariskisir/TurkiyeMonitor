// Collects current Turkiye Twitter trends from GetDayTrends.

import * as cheerio from 'cheerio';
import type { TrendTopic } from '../domain/types.js';
import httpClient from '../services/http-client.js';

/** Fetches the current Twitter trend table for Turkiye. */
export async function fetch(): Promise<TrendTopic[]> {
  const response = await httpClient.get<string>('https://getdaytrends.com/tr/turkey/');
  const $ = cheerio.load(response.data);
  const trends: TrendTopic[] = [];

  $('#trends tbody tr').each((_, row) => {
    if (trends.length >= 10) {
      return;
    }

    const tableRow = $(row);
    const topic = tableRow.find('td:nth-child(2) a').text().trim();
    const tweets = tableRow.find('td:nth-child(3)').text().trim();

    if (topic) {
      trends.push({ rank: trends.length + 1, topic, tweets: tweets || '-' });
    }
  });

  if (trends.length === 0) {
    throw new Error('No Twitter trends found');
  }

  return trends;
}
