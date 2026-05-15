// Collects short-term weather forecasts from the Turkish Meteorological Service.

import type { WeatherForecast } from '../domain/types.js';
import { scrape } from '../services/browser.js';

const cities = ['İstanbul', 'Ankara', 'İzmir', 'Çanakkale', 'Bursa', 'Antalya', 'Adana'];

/** Fetches weather forecasts for selected Turkish cities. */
export async function fetch(): Promise<WeatherForecast[]> {
  const forecasts: WeatherForecast[] = [];

  for (const city of cities) {
    const forecast = await scrapeCityForecast(city);

    if (forecast) {
      forecasts.push(forecast);
    }
  }

  if (forecasts.length === 0) {
    throw new Error('No weather data found');
  }

  return forecasts;
}

/** Scrapes a single city forecast from MGM. */
async function scrapeCityForecast(city: string): Promise<WeatherForecast | null> {
  try {
    const data = await scrape(
      `https://www.mgm.gov.tr/tahmin/il-ve-ilceler.aspx?il=${encodeURIComponent(city)}`,
      () => {
        const row = document.querySelector('#_4_5gunluk table tbody tr');

        if (!row) {
          return null;
        }

        const cells = row.querySelectorAll('td');

        if (cells.length < 5) {
          return null;
        }

        const condition = cells[1].querySelector('img')?.getAttribute('title') || 'Bilinmiyor';
        const min = cells[2].textContent?.trim() || '-';
        const max = cells[3].textContent?.trim() || '-';

        return { condition, min, max };
      },
      '#_4_5gunluk table tbody tr',
    );

    return data
      ? {
          city,
          condition: `${resolveConditionIcon(data.condition)} ${data.condition}`,
          range: `${data.max}°C ${data.min}°C`,
        }
      : null;
  } catch {
    return null;
  }
}

/** Maps a Turkish weather condition string to a compact icon. */
function resolveConditionIcon(condition: string): string {
  const normalizedCondition = condition.toLowerCase();

  if (normalizedCondition.includes('açık') || normalizedCondition.includes('güneş')) {
    return '☀️';
  }

  if (normalizedCondition.includes('yağmur') || normalizedCondition.includes('sağanak')) {
    return '🌧️';
  }

  if (normalizedCondition.includes('kar')) {
    return '❄️';
  }

  if (normalizedCondition.includes('sis')) {
    return '🌫️';
  }

  if (normalizedCondition.includes('fırtına')) {
    return '⛈️';
  }

  return '⛅';
}
