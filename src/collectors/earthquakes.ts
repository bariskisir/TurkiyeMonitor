// Collects recent magnitude 4+ earthquakes from KOERI XML data.

import { parseStringPromise } from 'xml2js';
import type { Earthquake } from '../domain/types.js';
import httpClient from '../services/http-client.js';

const koeriLast24HoursUrl = 'http://www.koeri.boun.edu.tr/sismo/zeqmap/xmlt/son24saat.xml';

/** Fetches recent magnitude 4+ earthquakes from KOERI. */
export async function fetch(): Promise<Earthquake[]> {
  const response = await httpClient.get<string>(koeriLast24HoursUrl, {
    responseType: 'text',
    timeout: 10000,
  });
  const parsed = (await parseStringPromise(response.data, { explicitArray: false })) as unknown;
  const earthquakes = extractEarthquakeItems(parsed)
    .map(normalizeEarthquake)
    .filter((earthquake): earthquake is Earthquake => earthquake !== null && earthquake.magnitude >= 4)
    .sort((left, right) => right.time.localeCompare(left.time));

  return earthquakes.slice(0, 5);
}

/** Recursively extracts earthquake-like XML nodes from the parsed response. */
function extractEarthquakeItems(source: unknown): unknown[] {
  if (!source || typeof source !== 'object') {
    return [];
  }

  const items: unknown[] = [];

  for (const [key, value] of Object.entries(source)) {
    if (key.toLowerCase().includes('earthquake') || key.toLowerCase().includes('earhquake')) {
      if (Array.isArray(value)) {
        items.push(...value);
      } else {
        items.push(value);
      }
      continue;
    }

    items.push(...extractEarthquakeItems(value));
  }

  return items;
}

/** Converts a KOERI XML node into the internal earthquake shape. */
function normalizeEarthquake(item: unknown): Earthquake | null {
  if (!item || typeof item !== 'object') {
    return null;
  }

  const source = '$' in item && typeof item.$ === 'object' && item.$ ? item.$ : item;
  const attributes = source as Record<string, string | undefined>;
  const magnitude = Number.parseFloat(attributes.mag || attributes.magnitude || attributes.ML || attributes.Ml || attributes.Mw || attributes.MD || attributes.Md || '0');

  return {
    magnitude,
    location: attributes.lokasyon || attributes.location || '-',
    depth: attributes.Depth || attributes.depth || attributes.derinlik || '-',
    time: attributes.name || attributes.tarih || attributes.date || attributes.Time || attributes.time || '-',
  };
}
